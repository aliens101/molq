import type { DashboardResponse } from "@molq/shared";
import { getProtocolMarkets } from "./integrations/markets.js";
import { getVaultState, vaultStateToPortfolio } from "./integrations/vault.js";

export async function getLiveDashboard(): Promise<DashboardResponse> {
	const [vault, markets] = await Promise.all([getVaultState(), getProtocolMarkets()]);
	const portfolio = vaultStateToPortfolio(vault);
	const mantleYieldApy = markets.shieldMarket.estimatedSupplyApy;
	const fundingApy = markets.alphaMarket.estimatedFundingApy;
	const estimatedNetApy = round(
		(mantleYieldApy * portfolio.allocation.shieldPercent +
			fundingApy * portfolio.allocation.alphaPercent) /
			100,
	);

	return {
		portfolio,
		market: {
			mantleYieldApy,
			fundingApy,
			estimatedNetApy,
			hedgeRatio: 0,
			liquidityScore:
				markets.shieldMarket.status === "live" && markets.alphaMarket.status === "live"
					? 100
					: 50,
			riskScore: markets.shieldMarket.status === "live" ? 25 : 75,
			updatedAt: vault.updatedAt,
		},
		...markets,
		decisions: [],
	};
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
