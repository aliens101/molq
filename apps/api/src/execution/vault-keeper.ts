import { MOLQ_VAULT } from "@molq/shared";
import {
	createPublicClient,
	createWalletClient,
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
		name: "rebalance",
		stateMutability: "nonpayable",
		inputs: [{ name: "minAssetsOut", type: "uint256" }],
		outputs: [],
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
		);
	}

	async status(): Promise<VaultKeeperStatus> {
		const [totalAssets, shieldAssets, liquidAssets, targetBps, onchainKeeper] =
			await Promise.all([
				this.read("totalAssets"),
				this.read("shieldAssets"),
				this.read("liquidAssets"),
				this.read("shieldTargetBps"),
				this.read("keeper"),
			]);
		const targetShieldAssets = (totalAssets * targetBps) / BPS;
		const driftAssets =
			shieldAssets > targetShieldAssets
				? shieldAssets - targetShieldAssets
				: targetShieldAssets - shieldAssets;
		const keeperAddress = this.walletClient?.account?.address;
		const authorized =
			Boolean(keeperAddress) && keeperAddress?.toLowerCase() === onchainKeeper.toLowerCase();

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

	private async read(
		functionName: "totalAssets" | "shieldAssets" | "liquidAssets" | "shieldTargetBps",
	): Promise<bigint>;
	private async read(functionName: "keeper"): Promise<`0x${string}`>;
	private async read(
		functionName:
			| "totalAssets"
			| "shieldAssets"
			| "liquidAssets"
			| "shieldTargetBps"
			| "keeper",
	) {
		return this.publicClient.readContract({
			address: MOLQ_VAULT,
			abi: vaultAbi,
			functionName,
		});
	}
}
