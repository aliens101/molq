import type { AlphaMarket, DashboardResponse, ShieldMarket } from "@molq/shared";
import { getBybitEthMarket, getBybitFallbackMarket } from "./bybit.js";
import { getInitFallbackMarket, getInitUsdeMarket } from "./init.js";

export interface ProtocolMarkets {
	shieldMarket: ShieldMarket;
	alphaMarket: AlphaMarket;
}

export async function getProtocolMarkets(): Promise<ProtocolMarkets> {
	const [shieldMarket, alphaMarket] = await Promise.all([
		getInitUsdeMarket().catch(() => getInitFallbackMarket()),
		getBybitEthMarket().catch(() => getBybitFallbackMarket()),
	]);

	return { shieldMarket, alphaMarket };
}

export async function enrichDashboard(dashboard: DashboardResponse): Promise<DashboardResponse> {
	const { shieldMarket, alphaMarket } = await getProtocolMarkets();
	const mantleYieldApy =
		shieldMarket.status === "live"
			? shieldMarket.estimatedSupplyApy
			: dashboard.market.mantleYieldApy;
	const fundingApy =
		alphaMarket.status === "live"
			? alphaMarket.estimatedFundingApy
			: dashboard.market.fundingApy;

	return {
		...dashboard,
		market: {
			...dashboard.market,
			mantleYieldApy,
			fundingApy,
			estimatedNetApy: round(mantleYieldApy + fundingApy - 2.1),
			updatedAt: new Date().toISOString(),
		},
		shieldMarket,
		alphaMarket,
	};
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
