export const MOLQ_NAME = "MolQ";
export const MANTLE_CHAIN_ID = 5000;
export const MANTLE_EXPLORER_URL = "https://mantlescan.xyz";
export const MANTLE_RPC_URL = "https://rpc.mantle.xyz";

export const INIT_USDE_LENDING_POOL = "0x3282437C436eE6AA9861a6A46ab0822d82581b1c";
export const INIT_CORE = "0x972BcB0284cca0152527c4f70f8F689852bCAFc5";
export const AAVE_MANTLE_POOL = "0x458F293454fE0d67EC0655f3672301301DD51422";
export const AAVE_MANTLE_DATA_PROVIDER = "0x487c5c669D9eee6057C44973207101276cf73b68";
export const AAVE_MANTLE_USDE_ATOKEN = "0xb9aCA933C9c0aa854a6DBb7b12f0CC3FdaC15ee7";
export const MANTLE_USDE = "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34";
export const MOLQ_VAULT = "0x71711F35c200fDabE75F2e82F0146c35f32eBAA5";

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
	protocol: "Aave V3" | "INIT Capital";
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

export interface HedgeExecutionStatus {
	configured: boolean;
	tradingEnabled: boolean;
	venue: "Bybit";
	symbol: "ETHUSDT";
	targetNotionalUsd: number;
	currentShortQuantity: number;
	currentShortNotionalUsd: number;
	accountEquityUsd: number;
	unrealizedPnlUsd: number;
	lastOrderId?: string;
	lastReconciledAt?: string;
	message: string;
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
	hedgeExecution?: HedgeExecutionStatus;
	decisions: AgentDecision[];
}

export interface SimulateRequest {
	amount: number;
	riskMode: MolqRiskMode;
}
