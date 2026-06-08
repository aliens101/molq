import { MANTLE_RPC_URL, MOLQ_DECISION_LOGGER, type AgentPolicyDecision } from "@molq/shared";
import {
	createPublicClient,
	createWalletClient,
	http,
	keccak256,
	parseUnits,
	toBytes,
	type Hash,
	type Hex,
	type PublicClient,
	type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantle } from "viem/chains";

const decisionLoggerAbi = [
	{
		type: "function",
		name: "agents",
		stateMutability: "view",
		inputs: [{ name: "agent", type: "address" }],
		outputs: [{ type: "bool" }],
	},
	{
		type: "function",
		name: "logDecision",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "actionType", type: "uint8" },
			{ name: "amount", type: "uint256" },
			{ name: "riskScoreBps", type: "uint256" },
			{ name: "reasonHash", type: "bytes32" },
		],
		outputs: [{ name: "id", type: "uint256" }],
	},
] as const;

export interface DecisionLoggerStatus {
	configured: boolean;
	enabled: boolean;
	authorized: boolean;
	agentAddress?: `0x${string}`;
	lastTransactionHash?: Hash;
	message: string;
}

export class DecisionLoggerClient {
	private lastTransactionHash?: Hash;

	constructor(
		private readonly enabled: boolean,
		private readonly walletClient?: WalletClient,
		private readonly publicClient: PublicClient = createPublicClient({
			chain: mantle,
			transport: http(process.env.MANTLE_RPC_URL ?? MANTLE_RPC_URL),
		}),
	) {}

	static fromEnv(): DecisionLoggerClient {
		const privateKey = process.env.MOLQ_AGENT_PRIVATE_KEY as Hex | undefined;
		const rpcUrl = process.env.MANTLE_RPC_URL ?? MANTLE_RPC_URL;
		const publicClient = createPublicClient({ chain: mantle, transport: http(rpcUrl) });
		if (!privateKey) {
			return new DecisionLoggerClient(false, undefined, publicClient);
		}

		const account = privateKeyToAccount(privateKey);
		return new DecisionLoggerClient(
			process.env.MOLQ_AGENT_WRITES_ENABLED === "true",
			createWalletClient({ account, chain: mantle, transport: http(rpcUrl) }),
			publicClient,
		);
	}

	async status(): Promise<DecisionLoggerStatus> {
		const agentAddress = this.walletClient?.account?.address;
		const authorized = agentAddress
			? await this.publicClient.readContract({
					address: MOLQ_DECISION_LOGGER,
					abi: decisionLoggerAbi,
					functionName: "agents",
					args: [agentAddress],
				})
			: false;

		return {
			configured: Boolean(this.walletClient),
			enabled: this.enabled,
			authorized,
			agentAddress,
			lastTransactionHash: this.lastTransactionHash,
			message: !this.walletClient
				? "Agent signer is not configured."
				: !this.enabled
					? "On-chain decision writes are disabled."
					: !authorized
						? "Agent signer is not authorized by the decision logger."
						: "On-chain decision logging is armed.",
		};
	}

	async log(decision: AgentPolicyDecision, execution: unknown): Promise<Hash | undefined> {
		if (decision.action === "hold") return undefined;
		const status = await this.status();
		if (!this.walletClient?.account || !status.enabled || !status.authorized) {
			throw new Error(status.message);
		}

		const reasonHash = keccak256(
			toBytes(
				JSON.stringify({
					decisionId: decision.id,
					action: decision.action,
					reason: decision.reason,
					safetyChecks: decision.safetyChecks,
					execution,
				}),
			),
		);
		const hash = await this.walletClient.writeContract({
			account: this.walletClient.account,
			chain: mantle,
			address: MOLQ_DECISION_LOGGER,
			abi: decisionLoggerAbi,
			functionName: "logDecision",
			args: [
				actionType(decision.action),
				parseUnits(decision.targetHedgeNotionalUsd.toFixed(6), 18),
				BigInt(Math.round(decision.riskScore * 100)),
				reasonHash,
			],
		});
		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
		if (receipt.status !== "success") {
			throw new Error("Decision log transaction reverted");
		}
		this.lastTransactionHash = hash;
		return hash;
	}
}

function actionType(action: AgentPolicyDecision["action"]): 2 | 3 {
	return action === "rebalance" ? 2 : 3;
}
