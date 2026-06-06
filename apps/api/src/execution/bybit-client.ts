import { createHmac } from "node:crypto";

export interface BybitClientOptions {
	apiKey: string;
	apiSecret: string;
	baseUrl?: string;
	recvWindow?: number;
	fetcher?: typeof fetch;
	now?: () => number;
}

interface BybitResponse<T> {
	retCode: number;
	retMsg: string;
	result: T;
	time: number;
}

export interface BybitPosition {
	symbol: string;
	side: "Buy" | "Sell" | "";
	size: string;
	avgPrice: string;
	markPrice: string;
	unrealisedPnl: string;
	leverage: string;
}

export interface BybitInstrument {
	symbol: string;
	status: string;
	lotSizeFilter: {
		minNotionalValue: string;
		maxMktOrderQty: string;
		minOrderQty: string;
		qtyStep: string;
	};
	leverageFilter: {
		minLeverage: string;
		maxLeverage: string;
		leverageStep: string;
	};
}

export interface BybitTicker {
	symbol: string;
	markPrice: string;
	fundingRate: string;
}

export interface CreateOrderRequest {
	category: "linear";
	symbol: string;
	side: "Buy" | "Sell";
	orderType: "Market";
	qty: string;
	positionIdx: 0;
	orderLinkId: string;
	reduceOnly: boolean;
	closeOnTrigger: boolean;
	slippageToleranceType: "Percent";
	slippageTolerance: string;
}

export interface CreateOrderResult {
	orderId: string;
	orderLinkId: string;
}

export class BybitClient {
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly baseUrl: string;
	private readonly recvWindow: number;
	private readonly fetcher: typeof fetch;
	private readonly now: () => number;

	constructor(options: BybitClientOptions) {
		this.apiKey = options.apiKey;
		this.apiSecret = options.apiSecret;
		this.baseUrl = options.baseUrl ?? "https://api.bybit.com";
		this.recvWindow = options.recvWindow ?? 5_000;
		this.fetcher = options.fetcher ?? fetch;
		this.now = options.now ?? Date.now;
	}

	async getPosition(symbol: string): Promise<BybitPosition | null> {
		const result = await this.privateGet<{ list: BybitPosition[] }>("/v5/position/list", {
			category: "linear",
			symbol,
		});
		return result.list[0] ?? null;
	}

	async getWalletBalance(): Promise<{
		totalEquity: string;
		totalAvailableBalance: string;
		totalPerpUPL: string;
	}> {
		const result = await this.privateGet<{
			list: Array<{
				totalEquity: string;
				totalAvailableBalance: string;
				totalPerpUPL: string;
			}>;
		}>("/v5/account/wallet-balance", { accountType: "UNIFIED" });
		const account = result.list[0];
		if (!account) throw new Error("Bybit returned no unified account");
		return account;
	}

	async getInstrument(symbol: string): Promise<BybitInstrument> {
		const query = new URLSearchParams({ category: "linear", symbol }).toString();
		const response = await this.fetcher(`${this.baseUrl}/v5/market/instruments-info?${query}`, {
			signal: AbortSignal.timeout(8_000),
		});
		const payload = (await response.json()) as BybitResponse<{ list: BybitInstrument[] }>;
		this.assertResponse(response, payload);
		const instrument = payload.result.list[0];
		if (!instrument) throw new Error(`Bybit instrument ${symbol} was not found`);
		return instrument;
	}

	async getTicker(symbol: string): Promise<BybitTicker> {
		const query = new URLSearchParams({ category: "linear", symbol }).toString();
		const response = await this.fetcher(`${this.baseUrl}/v5/market/tickers?${query}`, {
			signal: AbortSignal.timeout(8_000),
		});
		const payload = (await response.json()) as BybitResponse<{ list: BybitTicker[] }>;
		this.assertResponse(response, payload);
		const ticker = payload.result.list[0];
		if (!ticker) throw new Error(`Bybit ticker ${symbol} was not found`);
		return ticker;
	}

	async setLeverage(symbol: string, leverage: string): Promise<void> {
		await this.privatePost("/v5/position/set-leverage", {
			category: "linear",
			symbol,
			buyLeverage: leverage,
			sellLeverage: leverage,
		});
	}

	async createOrder(order: CreateOrderRequest): Promise<CreateOrderResult> {
		return this.privatePost<CreateOrderResult>("/v5/order/create", order);
	}

	sign(timestamp: string, payload: string): string {
		const plainText = `${timestamp}${this.apiKey}${this.recvWindow}${payload}`;
		return createHmac("sha256", this.apiSecret).update(plainText).digest("hex");
	}

	private async privateGet<T>(path: string, params: Record<string, string>): Promise<T> {
		const query = new URLSearchParams(params).toString();
		const timestamp = String(this.now());
		const response = await this.fetcher(`${this.baseUrl}${path}?${query}`, {
			headers: this.authHeaders(timestamp, query),
			signal: AbortSignal.timeout(8_000),
		});
		const payload = (await response.json()) as BybitResponse<T>;
		this.assertResponse(response, payload);
		return payload.result;
	}

	private async privatePost<T>(path: string, body: object): Promise<T> {
		const json = JSON.stringify(body);
		const timestamp = String(this.now());
		const response = await this.fetcher(`${this.baseUrl}${path}`, {
			method: "POST",
			headers: {
				...this.authHeaders(timestamp, json),
				"Content-Type": "application/json",
			},
			body: json,
			signal: AbortSignal.timeout(8_000),
		});
		const payload = (await response.json()) as BybitResponse<T>;
		this.assertResponse(response, payload);
		return payload.result;
	}

	private authHeaders(timestamp: string, payload: string): Record<string, string> {
		return {
			"X-BAPI-API-KEY": this.apiKey,
			"X-BAPI-TIMESTAMP": timestamp,
			"X-BAPI-RECV-WINDOW": String(this.recvWindow),
			"X-BAPI-SIGN": this.sign(timestamp, payload),
		};
	}

	private assertResponse(response: Response, payload: BybitResponse<unknown>) {
		if (!response.ok) {
			throw new Error(`Bybit returned HTTP ${response.status}`);
		}
		if (payload.retCode !== 0) {
			throw new Error(`Bybit ${payload.retCode}: ${payload.retMsg}`);
		}
	}
}
