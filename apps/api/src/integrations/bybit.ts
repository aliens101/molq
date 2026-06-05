import type { AlphaMarket } from "@molq/shared";

const BYBIT_TICKER_URL = "https://api.bybit.com/v5/market/tickers?category=linear&symbol=ETHUSDT";
const FUNDING_INTERVALS_PER_YEAR = 3 * 365;

interface BybitTickerResponse {
	retCode: number;
	result?: {
		list?: Array<{
			fundingRate?: string;
			markPrice?: string;
		}>;
	};
}

export function annualizeEightHourFunding(rate: number): number {
	return round(rate * FUNDING_INTERVALS_PER_YEAR * 100, 4);
}

export async function getBybitEthMarket(fetcher: typeof fetch = fetch): Promise<AlphaMarket> {
	const response = await fetcher(process.env.BYBIT_TICKER_URL ?? BYBIT_TICKER_URL, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(5_000),
	});

	if (!response.ok) {
		throw new Error(`Bybit returned HTTP ${response.status}`);
	}

	const payload = (await response.json()) as BybitTickerResponse;
	const ticker = payload.result?.list?.[0];
	const fundingRate = Number(ticker?.fundingRate);
	const markPrice = Number(ticker?.markPrice);

	if (payload.retCode !== 0 || !Number.isFinite(fundingRate) || !Number.isFinite(markPrice)) {
		throw new Error("Bybit returned an invalid ETHUSDT ticker");
	}

	return {
		protocol: "Bybit",
		market: "ETHUSDT",
		fundingRate,
		estimatedFundingApy: annualizeEightHourFunding(fundingRate),
		markPrice,
		status: "live",
		updatedAt: new Date().toISOString(),
	};
}

export function getBybitFallbackMarket(): AlphaMarket {
	return {
		protocol: "Bybit",
		market: "ETHUSDT",
		fundingRate: 0.000073,
		estimatedFundingApy: annualizeEightHourFunding(0.000073),
		markPrice: 0,
		status: "fallback",
		updatedAt: new Date().toISOString(),
	};
}

function round(value: number, digits: number): number {
	const scale = 10 ** digits;
	return Math.round(value * scale) / scale;
}
