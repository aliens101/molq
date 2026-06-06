import { createHash } from "node:crypto";
import type { HedgeExecutionStatus } from "@molq/shared";
import { BybitClient, type BybitInstrument, type BybitPosition } from "./bybit-client.js";

const SYMBOL = "ETHUSDT";

export interface HedgeExecutorConfig {
	apiKey?: string;
	apiSecret?: string;
	baseUrl?: string;
	tradingEnabled: boolean;
	maxNotionalUsd: number;
	leverage: number;
	slippagePercent: number;
	client?: BybitClient;
}

export class BybitHedgeExecutor {
	private readonly configured: boolean;
	private readonly tradingEnabled: boolean;
	private readonly maxNotionalUsd: number;
	private readonly leverage: number;
	private readonly slippagePercent: number;
	private readonly client?: BybitClient;
	private lastOrderId?: string;
	private lastReconciledAt?: string;

	constructor(config: HedgeExecutorConfig) {
		this.configured = Boolean(config.client || (config.apiKey && config.apiSecret));
		this.tradingEnabled = config.tradingEnabled;
		this.maxNotionalUsd = config.maxNotionalUsd;
		this.leverage = config.leverage;
		this.slippagePercent = config.slippagePercent;
		this.client =
			config.client ??
			(config.apiKey && config.apiSecret
				? new BybitClient({
						apiKey: config.apiKey,
						apiSecret: config.apiSecret,
						baseUrl: config.baseUrl,
					})
				: undefined);

		if (this.maxNotionalUsd <= 0) throw new Error("Maximum hedge notional must be positive");
		if (this.leverage < 1 || this.leverage > 2) {
			throw new Error("MolQ hedge leverage must be between 1x and 2x");
		}
		if (this.slippagePercent <= 0 || this.slippagePercent > 1) {
			throw new Error("MolQ hedge slippage must be between 0% and 1%");
		}
	}

	static fromEnv(): BybitHedgeExecutor {
		return new BybitHedgeExecutor({
			apiKey: process.env.BYBIT_API_KEY,
			apiSecret: process.env.BYBIT_API_SECRET,
			baseUrl: process.env.BYBIT_BASE_URL,
			tradingEnabled: process.env.BYBIT_TRADING_ENABLED === "true",
			maxNotionalUsd: Number(process.env.BYBIT_MAX_NOTIONAL_USD ?? 10_000),
			leverage: Number(process.env.BYBIT_LEVERAGE ?? 1),
			slippagePercent: Number(process.env.BYBIT_SLIPPAGE_PERCENT ?? 0.5),
		});
	}

	async status(targetNotionalUsd = 0): Promise<HedgeExecutionStatus> {
		if (!this.client) {
			return this.baseStatus(targetNotionalUsd, "Bybit API credentials are not configured.");
		}

		try {
			const [position, account] = await Promise.all([
				this.client.getPosition(SYMBOL),
				this.client.getWalletBalance(),
			]);
			const markPrice = Number(position?.markPrice ?? 0);
			const shortQuantity = currentShortQuantity(position);

			return {
				...this.baseStatus(
					targetNotionalUsd,
					this.tradingEnabled
						? "Bybit execution is armed."
						: "Bybit is connected in read-only mode.",
				),
				currentShortQuantity: shortQuantity,
				currentShortNotionalUsd: round(shortQuantity * markPrice),
				accountEquityUsd: numberOrZero(account.totalEquity),
				unrealizedPnlUsd: numberOrZero(account.totalPerpUPL),
			};
		} catch (error) {
			return this.baseStatus(
				targetNotionalUsd,
				error instanceof Error ? error.message : "Bybit status request failed.",
			);
		}
	}

	async reconcile(
		targetNotionalUsd: number,
		idempotencyKey: string,
	): Promise<HedgeExecutionStatus> {
		if (!this.client || !this.configured) {
			throw new Error("Bybit API credentials are not configured");
		}
		if (!this.tradingEnabled) {
			throw new Error("Bybit trading is disabled");
		}
		if (targetNotionalUsd < 0 || targetNotionalUsd > this.maxNotionalUsd) {
			throw new Error(`Target hedge exceeds the ${this.maxNotionalUsd} USD limit`);
		}

		const [instrument, ticker, position] = await Promise.all([
			this.client.getInstrument(SYMBOL),
			this.client.getTicker(SYMBOL),
			this.client.getPosition(SYMBOL),
		]);
		const markPrice = Number(ticker.markPrice);
		if (!Number.isFinite(markPrice) || markPrice <= 0) {
			throw new Error("Bybit returned an invalid ETH mark price");
		}

		validateInstrument(instrument, this.leverage);
		const targetQuantity = roundDown(
			targetNotionalUsd / markPrice,
			Number(instrument.lotSizeFilter.qtyStep),
		);
		const currentQuantity = currentShortQuantity(position);
		const delta = roundDown(
			targetQuantity - currentQuantity,
			Number(instrument.lotSizeFilter.qtyStep),
		);
		const absoluteDelta = Math.abs(delta);

		if (absoluteDelta < Number(instrument.lotSizeFilter.minOrderQty)) {
			this.lastReconciledAt = new Date().toISOString();
			return this.status(targetNotionalUsd);
		}

		const orderNotional = absoluteDelta * markPrice;
		if (orderNotional < Number(instrument.lotSizeFilter.minNotionalValue)) {
			throw new Error("Hedge delta is below Bybit's minimum order notional");
		}

		try {
			await this.client.setLeverage(SYMBOL, String(this.leverage));
		} catch (error) {
			if (!(error instanceof Error) || !error.message.includes("110043")) throw error;
		}

		const side = delta > 0 ? "Sell" : "Buy";
		const result = await this.client.createOrder({
			category: "linear",
			symbol: SYMBOL,
			side,
			orderType: "Market",
			qty: formatQuantity(absoluteDelta, instrument.lotSizeFilter.qtyStep),
			positionIdx: 0,
			orderLinkId: orderLinkId(idempotencyKey),
			reduceOnly: side === "Buy",
			closeOnTrigger: false,
			slippageToleranceType: "Percent",
			slippageTolerance: String(this.slippagePercent),
		});

		this.lastOrderId = result.orderId;
		this.lastReconciledAt = new Date().toISOString();
		return this.status(targetNotionalUsd);
	}

	private baseStatus(targetNotionalUsd: number, message: string): HedgeExecutionStatus {
		return {
			configured: this.configured,
			tradingEnabled: this.tradingEnabled,
			venue: "Bybit",
			symbol: SYMBOL,
			targetNotionalUsd,
			currentShortQuantity: 0,
			currentShortNotionalUsd: 0,
			accountEquityUsd: 0,
			unrealizedPnlUsd: 0,
			lastOrderId: this.lastOrderId,
			lastReconciledAt: this.lastReconciledAt,
			message,
		};
	}
}

function currentShortQuantity(position: BybitPosition | null): number {
	if (!position) return 0;
	const size = numberOrZero(position.size);
	if (position.side === "Sell") return size;
	if (position.side === "Buy") return -size;
	return 0;
}

function validateInstrument(instrument: BybitInstrument, leverage: number) {
	if (instrument.status !== "Trading") {
		throw new Error(`${instrument.symbol} is not currently trading`);
	}
	if (leverage > Number(instrument.leverageFilter.maxLeverage)) {
		throw new Error("Configured leverage exceeds the instrument maximum");
	}
}

export function roundDown(value: number, step: number): number {
	if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return 0;
	return Math.trunc(value / step) * step;
}

function formatQuantity(quantity: number, step: string): string {
	const decimals = step.includes(".") ? (step.split(".")[1]?.length ?? 0) : 0;
	return quantity.toFixed(decimals);
}

function orderLinkId(idempotencyKey: string): string {
	const digest = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 24);
	return `molq-${digest}`;
}

function numberOrZero(value: string): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
