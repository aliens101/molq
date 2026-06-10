import type { DashboardResponse } from "@molq/shared";
import { getProtocolMarkets } from "./integrations/markets.js";
import { getVaultState, vaultStateToPortfolio } from "./integrations/vault.js";

const TARGET_SHIELD_PERCENT = 85;
const TARGET_ALPHA_PERCENT = 15;

export async function getLiveDashboard(): Promise<DashboardResponse> {
	const [vault, markets] = await Promise.all([getVaultState(), getProtocolMarkets()]);
	const portfolio = vaultStateToPortfolio(vault);
	const mantleYieldApy = markets.shieldMarket.estimatedSupplyApy;
	const fundingApy = markets.alphaMarket.estimatedFundingApy;
	const projection = projectStrategyApy(
		mantleYieldApy,
		fundingApy,
		portfolio.balance,
		portfolio.shieldBalance,
		portfolio.alphaBalance,
		0,
	);

	return {
		portfolio,
		market: {
			mantleYieldApy,
			fundingApy,
			...projection,
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

export function applyHedgeProjection(
	dashboard: DashboardResponse,
	currentShortNotionalUsd: number,
): DashboardResponse {
	return {
		...dashboard,
		market: {
			...dashboard.market,
			...projectStrategyApy(
				dashboard.market.mantleYieldApy,
				dashboard.market.fundingApy,
				dashboard.portfolio.balance,
				dashboard.portfolio.shieldBalance,
				dashboard.portfolio.alphaBalance,
				currentShortNotionalUsd,
			),
		},
	};
}

export function projectStrategyApy(
	mantleYieldApy: number,
	fundingApy: number,
	totalAssets: number,
	shieldAssets: number,
	liquidAssets: number,
	currentShortNotionalUsd: number,
) {
	const shieldWeight = totalAssets > 0 ? shieldAssets / totalAssets : 0;
	const hedgeWeight =
		totalAssets > 0
			? Math.min(Math.max(currentShortNotionalUsd, 0), liquidAssets) / totalAssets
			: 0;
	const shieldContributionApy = round(mantleYieldApy * shieldWeight);
	const hedgeContributionApy = round(fundingApy * hedgeWeight);

	return {
		estimatedNetApy: round(shieldContributionApy + hedgeContributionApy),
		targetNetApy: round(
			(mantleYieldApy * TARGET_SHIELD_PERCENT + fundingApy * TARGET_ALPHA_PERCENT) / 100,
		),
		shieldContributionApy,
		hedgeContributionApy,
		hedgeRatio:
			liquidAssets > 0
				? round(
						(Math.min(Math.max(currentShortNotionalUsd, 0), liquidAssets) /
							liquidAssets) *
							100,
					)
				: 0,
	};
}

function round(value: number): number {
	const rounded = Math.round(value * 100) / 100;
	return Object.is(rounded, -0) ? 0 : rounded;
}
