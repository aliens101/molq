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
export const MOLQ_VAULT = "0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9";
export const MOLQ_LEGACY_DECISION_LOGGER = "0x24df9c33D24D7C84e527D247D25a203490001Be9";
export const MOLQ_DECISION_LOGGER = "0x0F38FF858fE3974be7c05625281CA6b774Be9E9b";
export const ERC8004_IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
export const MOLQ_AGENT_ID = 112n;

export type MolqRiskMode = "conservative" | "balanced" | "growth";

export interface Allocation {
	shieldPercent: number;
	alphaPercent: number;
}

export interface MarketSnapshot {
	mantleYieldApy: number;
	fundingApy: number;
	estimatedNetApy: number;
	targetNetApy: number;
	shieldContributionApy: number;
	hedgeContributionApy: number;
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
	action:
		| "deposit"
		| "allocate"
		| "harvest"
		| "harden"
		| "hold"
		| "rebalance"
		| "hedge"
		| "rebalance_and_hedge";
	amount: number;
	riskScore: number;
	reason: string;
	createdAt: string;
	txHash?: string;
}

export type AgentAction = "hold" | "rebalance" | "hedge" | "rebalance_and_hedge";
export type AgentDecisionSource = "model" | "deterministic";

export interface AgentPolicySnapshot {
	totalAssetsUsd: number;
	shieldAssetsUsd: number;
	liquidAssetsUsd: number;
	targetShieldAssetsUsd: number;
	currentHedgeNotionalUsd: number;
	aaveSupplyApy: number;
	bybitFundingApy: number;
	liquidityScore: number;
	marketRiskScore: number;
	shieldMarketLive: boolean;
	alphaMarketLive: boolean;
}

export interface AgentPolicyDecision {
	id: string;
	action: AgentAction;
	targetHedgeNotionalUsd: number;
	confidence: number;
	riskScore: number;
	reason: string;
	source: AgentDecisionSource;
	model?: string;
	safetyChecks: string[];
	createdAt: string;
}

export interface AgentIdentity {
	agentId: string;
	registry: `0x${string}`;
	owner: `0x${string}`;
	agentWallet: `0x${string}`;
	agentUri: string;
	name: string;
	description: string;
	active: boolean;
	registered: boolean;
}

export interface DashboardResponse {
	portfolio: Portfolio;
	market: MarketSnapshot;
	shieldMarket?: ShieldMarket;
	alphaMarket?: AlphaMarket;
	hedgeExecution?: HedgeExecutionStatus;
	decisions: AgentDecision[];
}

export interface PerformancePoint {
	timestamp: string;
	totalAssets: number;
	shieldAssets: number;
	liquidAssets: number;
	activeProjectedApy: number;
	targetScenarioApy: number;
	aaveSupplyApy: number;
	fundingApy: number;
	riskScore: number;
}

export interface VaultHistoryEvent {
	id: string;
	type: string;
	assets?: string | null;
	shares?: string | null;
	amount?: string | null;
	blockTimestamp: string;
	transactionHash: `0x${string}`;
}

export interface VaultHistorySnapshot {
	id: string;
	trigger: string;
	totalAssets: string;
	shieldBalance: string;
	alphaBalance: string;
	blockTimestamp: string;
	transactionHash: `0x${string}`;
}

export interface PerformanceHistory {
	performance: PerformancePoint[];
	vaultEvents: VaultHistoryEvent[];
	vaultSnapshots: VaultHistorySnapshot[];
	indexerAvailable: boolean;
}

export interface SimulateRequest {
	amount: number;
	riskMode: MolqRiskMode;
}
