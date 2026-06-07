import { useCallback, useMemo, useState } from "react";
import { formatUnits, parseUnits, zeroAddress, type Hash } from "viem";
import {
	useAccount,
	useConnect,
	useDisconnect,
	usePublicClient,
	useReadContract,
	useSwitchChain,
	useWriteContract,
} from "wagmi";
import { mantle } from "wagmi/chains";
import { erc20Abi, MOLQ_VAULT, molqVaultAbi, USDE } from "@/molq/contracts";

const USDE_DECIMALS = 18;

export function useMolqVault() {
	const account = useAccount();
	const { connectors, connectAsync, isPending: isConnecting } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
	const { writeContractAsync } = useWriteContract();
	const publicClient = usePublicClient({ chainId: mantle.id });
	const [pendingAction, setPendingAction] = useState<"deposit" | "withdraw" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [transactionHash, setTransactionHash] = useState<Hash | null>(null);

	const totalAssets = useReadContract({
		address: MOLQ_VAULT,
		abi: molqVaultAbi,
		functionName: "totalAssets",
		chainId: mantle.id,
	});
	const shieldAssets = useReadContract({
		address: MOLQ_VAULT,
		abi: molqVaultAbi,
		functionName: "shieldAssets",
		chainId: mantle.id,
	});
	const liquidAssets = useReadContract({
		address: MOLQ_VAULT,
		abi: molqVaultAbi,
		functionName: "liquidAssets",
		chainId: mantle.id,
	});
	const walletBalance = useReadContract({
		address: USDE,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [account.address ?? zeroAddress],
		chainId: mantle.id,
		query: { enabled: Boolean(account.address) },
	});
	const allowance = useReadContract({
		address: USDE,
		abi: erc20Abi,
		functionName: "allowance",
		args: [account.address ?? zeroAddress, MOLQ_VAULT],
		chainId: mantle.id,
		query: { enabled: Boolean(account.address) },
	});
	const shareBalance = useReadContract({
		address: MOLQ_VAULT,
		abi: molqVaultAbi,
		functionName: "balanceOf",
		args: [account.address ?? zeroAddress],
		chainId: mantle.id,
		query: { enabled: Boolean(account.address) },
	});
	const userAssets = useReadContract({
		address: MOLQ_VAULT,
		abi: molqVaultAbi,
		functionName: "convertToAssets",
		args: [shareBalance.data ?? 0n],
		chainId: mantle.id,
		query: { enabled: Boolean(account.address) },
	});

	const refresh = useCallback(async () => {
		await Promise.all([
			totalAssets.refetch(),
			shieldAssets.refetch(),
			liquidAssets.refetch(),
			walletBalance.refetch(),
			allowance.refetch(),
			shareBalance.refetch(),
			userAssets.refetch(),
		]);
	}, [
		allowance,
		liquidAssets,
		shareBalance,
		shieldAssets,
		totalAssets,
		userAssets,
		walletBalance,
	]);

	const connect = useCallback(async () => {
		setError(null);
		const connector = connectors[0];
		if (!connector) {
			setError("No injected wallet was found.");
			return;
		}
		await connectAsync({ connector, chainId: mantle.id });
	}, [connectAsync, connectors]);

	const ensureMantle = useCallback(async () => {
		if (account.chainId !== mantle.id) {
			await switchChainAsync({ chainId: mantle.id });
		}
	}, [account.chainId, switchChainAsync]);

	const waitForReceipt = useCallback(
		async (hash: Hash) => {
			if (!publicClient) {
				throw new Error("Mantle RPC client is unavailable.");
			}
			const receipt = await publicClient.waitForTransactionReceipt({ hash });
			if (receipt.status !== "success") {
				throw new Error("The Mantle transaction reverted.");
			}
		},
		[publicClient],
	);

	const deposit = useCallback(
		async (value: string) => {
			if (!account.address) {
				await connect();
				return;
			}

			let assets: bigint;
			try {
				assets = parseUnits(value, USDE_DECIMALS);
			} catch {
				setError("Enter a valid USDe amount.");
				return;
			}
			if (assets <= 0n) {
				setError("Enter a USDe amount greater than zero.");
				return;
			}
			if (walletBalance.data !== undefined && assets > walletBalance.data) {
				setError("The deposit exceeds your USDe wallet balance.");
				return;
			}

			setPendingAction("deposit");
			setError(null);
			setTransactionHash(null);
			try {
				await ensureMantle();
				if ((allowance.data ?? 0n) < assets) {
					const approvalHash = await writeContractAsync({
						address: USDE,
						abi: erc20Abi,
						functionName: "approve",
						args: [MOLQ_VAULT, assets],
						chainId: mantle.id,
					});
					setTransactionHash(approvalHash);
					await waitForReceipt(approvalHash);
				}

				const depositHash = await writeContractAsync({
					address: MOLQ_VAULT,
					abi: molqVaultAbi,
					functionName: "deposit",
					args: [assets, account.address],
					chainId: mantle.id,
				});
				setTransactionHash(depositHash);
				await waitForReceipt(depositHash);
				await refresh();
			} catch (caught) {
				setError(normalizeWalletError(caught));
			} finally {
				setPendingAction(null);
			}
		},
		[
			account.address,
			allowance.data,
			connect,
			ensureMantle,
			refresh,
			waitForReceipt,
			walletBalance.data,
			writeContractAsync,
		],
	);

	const withdrawAll = useCallback(async () => {
		if (!account.address || !shareBalance.data) {
			setError("There is no MolQ position to withdraw.");
			return;
		}

		setPendingAction("withdraw");
		setError(null);
		setTransactionHash(null);
		try {
			await ensureMantle();
			const hash = await writeContractAsync({
				address: MOLQ_VAULT,
				abi: molqVaultAbi,
				functionName: "redeem",
				args: [shareBalance.data, account.address, account.address],
				chainId: mantle.id,
			});
			setTransactionHash(hash);
			await waitForReceipt(hash);
			await refresh();
		} catch (caught) {
			setError(normalizeWalletError(caught));
		} finally {
			setPendingAction(null);
		}
	}, [
		account.address,
		ensureMantle,
		refresh,
		shareBalance.data,
		waitForReceipt,
		writeContractAsync,
	]);

	return useMemo(
		() => ({
			address: account.address,
			isConnected: account.isConnected,
			isWrongChain: account.isConnected && account.chainId !== mantle.id,
			isBusy: isConnecting || isSwitching || pendingAction !== null,
			pendingAction,
			error,
			transactionHash,
			totalAssets: totalAssets.data ?? 0n,
			shieldAssets: shieldAssets.data ?? 0n,
			liquidAssets: liquidAssets.data ?? 0n,
			walletBalance: walletBalance.data ?? 0n,
			shareBalance: shareBalance.data ?? 0n,
			userAssets: userAssets.data ?? 0n,
			connect,
			disconnect,
			switchToMantle: ensureMantle,
			deposit,
			withdrawAll,
			refresh,
			formatUsde: (value: bigint) => formatUnits(value, USDE_DECIMALS),
		}),
		[
			account.address,
			account.isConnected,
			account.chainId,
			connect,
			deposit,
			disconnect,
			ensureMantle,
			error,
			isConnecting,
			isSwitching,
			liquidAssets.data,
			pendingAction,
			refresh,
			shareBalance.data,
			shieldAssets.data,
			totalAssets.data,
			transactionHash,
			userAssets.data,
			walletBalance.data,
			withdrawAll,
		],
	);
}

function normalizeWalletError(error: unknown): string {
	if (!(error instanceof Error)) {
		return "The wallet transaction failed.";
	}
	if (error.message.toLowerCase().includes("user rejected")) {
		return "The wallet request was rejected.";
	}
	return error.message.split("\n")[0] ?? "The wallet transaction failed.";
}
