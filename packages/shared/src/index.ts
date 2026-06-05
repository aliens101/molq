export const MOLQ_NAME = "MolQ";
export const MANTLE_CHAIN_ID = 5000;
export const MANTLE_EXPLORER_URL = "https://mantlescan.xyz";
export const MANTLE_RPC_URL = "https://rpc.mantle.xyz";

export const INIT_USDE_LENDING_POOL = "0x3282437C436eE6AA9861a6A46ab0822d82581b1c";
export const INIT_CORE = "0x972BcB0284cca0152527c4f70f8F689852bCAFc5";

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

export interface ShieldMarket {
	protocol: "INIT Capital";
	market: "USDe";
	poolAddress: `0x${string}`;
	underlyingToken: `0x${string}`;
	supplyRateE18: string;
	estimatedSupplyApy: number;
	availableLiquidity: string;
	totalAssets: string;
	status: "live" | "fallback";
	updatedAt: string;
}

export interface AlphaMarket {
	protocol: "Bybit";
	market: "ETHUSDT";
	fundingRate: number;
	estimatedFundingApy: number;
	markPrice: number;
	status: "live" | "fallback";
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
	shieldMarket?: ShieldMarket;
	alphaMarket?: AlphaMarket;
	decisions: AgentDecision[];
}

export interface SimulateRequest {
	amount: number;
	riskMode: MolqRiskMode;
}
