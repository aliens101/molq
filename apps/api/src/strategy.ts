import type {
	AgentDecision,
	DashboardResponse,
	MarketSnapshot,
	MolqRiskMode,
	Portfolio,
} from "@molq/shared";

const ALLOCATIONS: Record<MolqRiskMode, { shieldPercent: number; alphaPercent: number }> = {
	conservative: { shieldPercent: 90, alphaPercent: 10 },
	balanced: { shieldPercent: 85, alphaPercent: 15 },
	growth: { shieldPercent: 75, alphaPercent: 25 },
};

export class MolqStrategyEngine {
	private sequence = 1;
	private portfolio: Portfolio = {
		balance: 0,
		deposited: 0,
		realizedProfit: 0,
		shieldBalance: 0,
		alphaBalance: 0,
		allocation: ALLOCATIONS.balanced,
		riskMode: "balanced",
	};

	private decisions: AgentDecision[] = [
		{
			id: "decision-0",
			action: "hold",
			amount: 0,
			riskScore: 22,
			reason: "Agent initialized. Waiting for the first deposit.",
			createdAt: new Date().toISOString(),
		},
	];

	getMarketSnapshot(): MarketSnapshot {
		const minute = Math.floor(Date.now() / 60_000);
		const cycle = (minute % 11) / 10;
		const mantleYieldApy = round(5.1 + cycle * 0.8);
		const fundingApy = round(7.4 + (1 - cycle) * 1.6);
		const estimatedNetApy = round(mantleYieldApy + fundingApy - 2.1);

		return {
			mantleYieldApy,
			fundingApy,
			estimatedNetApy,
			hedgeRatio: round(97.5 + cycle * 1.5),
			liquidityScore: Math.round(88 + cycle * 7),
			riskScore: Math.round(24 + cycle * 8),
			updatedAt: new Date().toISOString(),
		};
	}

	getDashboard(): DashboardResponse {
		return {
			portfolio: { ...this.portfolio, allocation: { ...this.portfolio.allocation } },
			market: this.getMarketSnapshot(),
			decisions: this.decisions.slice(0, 8),
		};
	}

	deposit(amount: number, riskMode: MolqRiskMode): DashboardResponse {
		const allocation = ALLOCATIONS[riskMode];
		const shieldAmount = round((amount * allocation.shieldPercent) / 100);
		const alphaAmount = round(amount - shieldAmount);

		this.portfolio = {
			...this.portfolio,
			balance: round(this.portfolio.balance + amount),
			deposited: round(this.portfolio.deposited + amount),
			shieldBalance: round(this.portfolio.shieldBalance + shieldAmount),
			alphaBalance: round(this.portfolio.alphaBalance + alphaAmount),
			allocation,
			riskMode,
		};

		this.addDecision(
			"deposit",
			amount,
			this.getMarketSnapshot().riskScore,
			`Accepted deposit and allocated ${allocation.shieldPercent}% to Shield and ${allocation.alphaPercent}% to Alpha.`,
		);

		return this.getDashboard();
	}

	runCycle(): DashboardResponse {
		if (this.portfolio.alphaBalance === 0) {
			this.addDecision("hold", 0, 20, "No active Alpha capital. The agent remains idle.");
			return this.getDashboard();
		}

		const market = this.getMarketSnapshot();
		const grossProfit = round(
			this.portfolio.alphaBalance * (market.estimatedNetApy / 100 / 52),
		);
		const hardened = round(grossProfit * 0.8);
		const retained = round(grossProfit - hardened);

		this.portfolio = {
			...this.portfolio,
			balance: round(this.portfolio.balance + grossProfit),
			realizedProfit: round(this.portfolio.realizedProfit + grossProfit),
			shieldBalance: round(this.portfolio.shieldBalance + hardened),
			alphaBalance: round(this.portfolio.alphaBalance + retained),
		};

		this.addDecision(
			"harvest",
			grossProfit,
			market.riskScore,
			`Captured one simulated week of basis yield at ${market.estimatedNetApy}% net APY.`,
		);
		this.addDecision(
			"harden",
			hardened,
			Math.max(10, market.riskScore - 8),
			"Moved 80% of realized Alpha profit into the Shield bucket.",
		);

		return this.getDashboard();
	}

	reset(): DashboardResponse {
		this.portfolio = {
			balance: 0,
			deposited: 0,
			realizedProfit: 0,
			shieldBalance: 0,
			alphaBalance: 0,
			allocation: ALLOCATIONS.balanced,
			riskMode: "balanced",
		};
		this.decisions = [];
		this.addDecision("hold", 0, 22, "Simulation reset. Waiting for a deposit.");
		return this.getDashboard();
	}

	private addDecision(
		action: AgentDecision["action"],
		amount: number,
		riskScore: number,
		reason: string,
	) {
		const id = this.sequence++;
		this.decisions.unshift({
			id: `decision-${id}`,
			action,
			amount,
			riskScore,
			reason,
			createdAt: new Date().toISOString(),
			txHash: `0x${id.toString(16).padStart(64, "0")}`,
		});
	}
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
