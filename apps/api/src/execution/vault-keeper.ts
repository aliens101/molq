import { MOLQ_VAULT } from "@molq/shared";
import {
	createPublicClient,
	createWalletClient,
	formatUnits,
	parseUnits,
	type Hash,
	type Hex,
	type PublicClient,
	type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantle } from "viem/chains";
import { mantleTransport } from "../mantle-client.js";

const BPS = 10_000n;
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
	{
		type: "function",
		name: "shieldTargetBps",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "keeper",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "address" }],
	},
	{
		type: "function",
		name: "asset",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "address" }],
	},
	{
		type: "function",
		name: "treasury",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "address" }],
	},
	{
		type: "function",
		name: "performanceFeeBps",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "rebalance",
		stateMutability: "nonpayable",
		inputs: [{ name: "minAssetsOut", type: "uint256" }],
		outputs: [],
	},
	{
		type: "function",
		name: "hardenProfit",
		stateMutability: "nonpayable",
		inputs: [{ name: "grossProfit", type: "uint256" }],
		outputs: [],
	},
] as const;
const erc20Abi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "allowance",
		stateMutability: "view",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
] as const;

export interface VaultKeeperStatus {
	configured: boolean;
	enabled: boolean;
	authorized: boolean;
	keeperAddress?: `0x${string}`;
	onchainKeeper?: `0x${string}`;
	totalAssets: string;
	shieldAssets: string;
	liquidAssets: string;
	targetShieldAssets: string;
	driftAssets: string;
	message: string;
	lastTransactionHash?: Hash;
	profitHardening: {
		enabled: boolean;
		maxGrossProfitUsd: number;
		keeperUsdeBalance: number;
		treasury?: `0x${string}`;
		performanceFeeBps: number;
	};
}

export function calculateProfitDistribution(grossProfitUsd: number, feeBps: number) {
	const feeUsd = (grossProfitUsd * feeBps) / Number(BPS);
	return {
		grossProfitUsd,
		feeUsd,
		netProfitUsd: grossProfitUsd - feeUsd,
	};
}

export class VaultKeeper {
	private lastTransactionHash?: Hash;

	constructor(
		private readonly enabled: boolean,
		private readonly walletClient?: WalletClient,
		private readonly publicClient: PublicClient = createPublicClient({
			chain: mantle,
			transport: mantleTransport(),
		}),
		private readonly maxSlippageBps = 10n,
		private readonly profitHardeningEnabled = false,
		private readonly maxGrossProfitUsd = 1_000,
	) {}

	static fromEnv(): VaultKeeper {
		const privateKey = process.env.MOLQ_KEEPER_PRIVATE_KEY as Hex | undefined;
		const transport = mantleTransport();
		const publicClient = createPublicClient({ chain: mantle, transport });
		if (!privateKey) {
			return new VaultKeeper(false, undefined, publicClient);
		}

		const account = privateKeyToAccount(privateKey);
		return new VaultKeeper(
			process.env.MOLQ_KEEPER_ENABLED === "true",
			createWalletClient({ account, chain: mantle, transport }),
			publicClient,
			BigInt(process.env.MOLQ_KEEPER_MAX_SLIPPAGE_BPS ?? 10),
			process.env.MOLQ_PROFIT_HARDENING_ENABLED === "true",
			Number(process.env.MOLQ_MAX_HARDEN_PROFIT_USD ?? 1_000),
		);
	}

	async status(): Promise<VaultKeeperStatus> {
		const [
			totalAssets,
			shieldAssets,
			liquidAssets,
			targetBps,
			onchainKeeper,
			asset,
			treasury,
			feeBps,
		] = await Promise.all([
			this.read("totalAssets"),
			this.read("shieldAssets"),
			this.read("liquidAssets"),
			this.read("shieldTargetBps"),
			this.read("keeper"),
			this.read("asset"),
			this.read("treasury"),
			this.read("performanceFeeBps"),
		]);
		const targetShieldAssets = (totalAssets * targetBps) / BPS;
		const driftAssets =
			shieldAssets > targetShieldAssets
				? shieldAssets - targetShieldAssets
				: targetShieldAssets - shieldAssets;
		const keeperAddress = this.walletClient?.account?.address;
		const authorized =
			Boolean(keeperAddress) && keeperAddress?.toLowerCase() === onchainKeeper.toLowerCase();
		const keeperBalance = keeperAddress
			? await this.publicClient.readContract({
					address: asset,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [keeperAddress],
				})
			: 0n;

		return {
			configured: Boolean(this.walletClient),
			enabled: this.enabled,
			authorized,
			keeperAddress,
			onchainKeeper,
			totalAssets: totalAssets.toString(),
			shieldAssets: shieldAssets.toString(),
			liquidAssets: liquidAssets.toString(),
			targetShieldAssets: targetShieldAssets.toString(),
			driftAssets: driftAssets.toString(),
			message: !this.walletClient
				? "Keeper credentials are not configured."
				: !this.enabled
					? "Keeper writes are disabled."
					: !authorized
						? "Configured signer is not the vault keeper."
						: driftAssets === 0n
							? "Vault allocation is on target."
							: "Vault is ready to rebalance.",
			lastTransactionHash: this.lastTransactionHash,
			profitHardening: {
				enabled: this.profitHardeningEnabled,
				maxGrossProfitUsd: this.maxGrossProfitUsd,
				keeperUsdeBalance: Number(formatUnits(keeperBalance, 18)),
				treasury,
				performanceFeeBps: Number(feeBps),
			},
		};
	}

	async rebalance(): Promise<VaultKeeperStatus> {
		const status = await this.status();
		if (!this.walletClient?.account) {
			throw new Error("Keeper credentials are not configured");
		}
		if (!this.enabled) {
			throw new Error("Keeper writes are disabled");
		}
		if (!status.authorized) {
			throw new Error("Configured signer is not the vault keeper");
		}
		if (status.driftAssets === "0") {
			return status;
		}

		const shieldAssets = BigInt(status.shieldAssets);
		const targetShieldAssets = BigInt(status.targetShieldAssets);
		const redemption =
			shieldAssets > targetShieldAssets ? shieldAssets - targetShieldAssets : 0n;
		const minAssetsOut = (redemption * (BPS - this.maxSlippageBps)) / BPS;
		const hash = await this.walletClient.writeContract({
			account: this.walletClient.account,
			chain: mantle,
			address: MOLQ_VAULT,
			abi: vaultAbi,
			functionName: "rebalance",
			args: [minAssetsOut],
		});
		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
		if (receipt.status !== "success") {
			throw new Error("Vault rebalance reverted");
		}
		this.lastTransactionHash = hash;
		return this.status();
	}

	async hardenProfit(grossProfitUsd: number): Promise<VaultKeeperStatus> {
		const status = await this.status();
		if (!this.walletClient?.account) throw new Error("Keeper credentials are not configured");
		if (!this.enabled) throw new Error("Keeper writes are disabled");
		if (!status.authorized) throw new Error("Configured signer is not the vault keeper");
		if (!this.profitHardeningEnabled) throw new Error("Profit hardening is disabled");
		if (
			!Number.isFinite(grossProfitUsd) ||
			grossProfitUsd <= 0 ||
			grossProfitUsd > this.maxGrossProfitUsd
		) {
			throw new Error(`Gross profit must be between 0 and ${this.maxGrossProfitUsd} USDe`);
		}
		if (grossProfitUsd > status.profitHardening.keeperUsdeBalance) {
			throw new Error("Keeper USDe balance is below the requested profit amount");
		}

		const grossProfit = parseUnits(grossProfitUsd.toFixed(18), 18);
		const asset = await this.read("asset");
		const allowance = await this.publicClient.readContract({
			address: asset,
			abi: erc20Abi,
			functionName: "allowance",
			args: [this.walletClient.account.address, MOLQ_VAULT],
		});
		if (allowance < grossProfit) {
			const approvalHash = await this.walletClient.writeContract({
				account: this.walletClient.account,
				chain: mantle,
				address: asset,
				abi: erc20Abi,
				functionName: "approve",
				args: [MOLQ_VAULT, grossProfit],
			});
			const approvalReceipt = await this.publicClient.waitForTransactionReceipt({
				hash: approvalHash,
			});
			if (approvalReceipt.status !== "success") throw new Error("USDe approval reverted");
		}

		const hash = await this.walletClient.writeContract({
			account: this.walletClient.account,
			chain: mantle,
			address: MOLQ_VAULT,
			abi: vaultAbi,
			functionName: "hardenProfit",
			args: [grossProfit],
		});
		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
		if (receipt.status !== "success") throw new Error("Profit hardening reverted");
		this.lastTransactionHash = hash;
		return this.status();
	}

	private async read(
		functionName:
			| "totalAssets"
			| "shieldAssets"
			| "liquidAssets"
			| "shieldTargetBps"
			| "performanceFeeBps",
	): Promise<bigint>;
	private async read(functionName: "keeper" | "asset" | "treasury"): Promise<`0x${string}`>;
	private async read(
		functionName:
			| "totalAssets"
			| "shieldAssets"
			| "liquidAssets"
			| "shieldTargetBps"
			| "performanceFeeBps"
			| "keeper"
			| "asset"
			| "treasury",
	) {
		return this.publicClient.readContract({
			address: MOLQ_VAULT,
			abi: vaultAbi,
			functionName,
		});
	}
}
