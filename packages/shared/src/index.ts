export const MOLQ_NAME = "MolQ";

export type MolqRiskMode = "conservative" | "balanced" | "growth";

export interface Allocation {
	shieldPercent: number;
	alphaPercent: number;
}

export interface MarketSnapshot {
	mantleYieldApy: number;
	fundingApy: number;
	estimatedNetApy: number;
	hedgeRatio: number;
	liquidityScore: number;
	riskScore: number;
	updatedAt: string;
}

export interface Portfolio {
	balance: number;
	deposited: number;
	realizedProfit: number;
	shieldBalance: number;
	alphaBalance: number;
	allocation: Allocation;
	riskMode: MolqRiskMode;
}

export interface AgentDecision {
	id: string;
	action: "deposit" | "allocate" | "harvest" | "harden" | "hold";
	amount: number;
	riskScore: number;
	reason: string;
	createdAt: string;
	txHash?: string;
}

export interface DashboardResponse {
	portfolio: Portfolio;
	market: MarketSnapshot;
	decisions: AgentDecision[];
}

export interface SimulateRequest {
	amount: number;
	riskMode: MolqRiskMode;
}
