import { MANTLE_CHAIN_ID, MOLQ_VAULT, type Portfolio } from "@molq/shared";
import { createPublicClient, formatUnits, type PublicClient } from "viem";
import { mantle } from "viem/chains";
import { mantleTransport } from "../mantle-client.js";

const vaultAbi = [
	{
		type: "function",
		name: "totalAssets",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "shieldAssets",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "liquidAssets",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
] as const;

export interface VaultState {
	address: `0x${string}`;
	chainId: number;
	totalAssets: bigint;
	shieldAssets: bigint;
	liquidAssets: bigint;
	updatedAt: string;
}

export async function getVaultState(
	client: PublicClient = createPublicClient({
		chain: mantle,
		transport: mantleTransport(),
	}),
): Promise<VaultState> {
	const [totalAssets, shieldAssets, liquidAssets] = await Promise.all([
		client.readContract({
			address: MOLQ_VAULT,
			abi: vaultAbi,
			functionName: "totalAssets",
		}),
		client.readContract({
			address: MOLQ_VAULT,
			abi: vaultAbi,
			functionName: "shieldAssets",
		}),
		client.readContract({
			address: MOLQ_VAULT,
			abi: vaultAbi,
			functionName: "liquidAssets",
		}),
	]);

	return {
		address: MOLQ_VAULT,
		chainId: MANTLE_CHAIN_ID,
		totalAssets,
		shieldAssets,
		liquidAssets,
		updatedAt: new Date().toISOString(),
	};
}

export function vaultStateToPortfolio(state: VaultState): Portfolio {
	const balance = toNumber(state.totalAssets);
	const shieldBalance = toNumber(state.shieldAssets);
	const alphaBalance = toNumber(state.liquidAssets);
	const shieldPercent = balance > 0 ? round((shieldBalance / balance) * 100) : 85;

	return {
		balance,
		deposited: balance,
		realizedProfit: 0,
		shieldBalance,
		alphaBalance,
		allocation: {
			shieldPercent,
			alphaPercent: round(100 - shieldPercent),
		},
		riskMode: "balanced",
	};
}

function toNumber(value: bigint): number {
	return Number(formatUnits(value, 18));
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
