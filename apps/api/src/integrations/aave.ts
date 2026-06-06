import {
	AAVE_MANTLE_DATA_PROVIDER,
	AAVE_MANTLE_USDE_ATOKEN,
	MANTLE_RPC_URL,
	MANTLE_USDE,
	type ShieldMarket,
} from "@molq/shared";
import { createPublicClient, formatUnits, http, type PublicClient } from "viem";
import { mantle } from "viem/chains";

const RAY = 1e27;

const reserveDataAbi = [
	{
		type: "function",
		name: "getReserveData",
		stateMutability: "view",
		inputs: [{ name: "asset", type: "address" }],
		outputs: [
			{ name: "unbacked", type: "uint256" },
			{ name: "accruedToTreasuryScaled", type: "uint256" },
			{ name: "totalAToken", type: "uint256" },
			{ name: "totalStableDebt", type: "uint256" },
			{ name: "totalVariableDebt", type: "uint256" },
			{ name: "liquidityRate", type: "uint256" },
			{ name: "variableBorrowRate", type: "uint256" },
			{ name: "stableBorrowRate", type: "uint256" },
			{ name: "averageStableBorrowRate", type: "uint256" },
			{ name: "liquidityIndex", type: "uint256" },
			{ name: "variableBorrowIndex", type: "uint256" },
			{ name: "lastUpdateTimestamp", type: "uint40" },
		],
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
] as const;

export function rayRateToApy(liquidityRate: bigint): number {
	return round((Number(liquidityRate) / RAY) * 100, 4);
}

export async function getAaveUsdeMarket(
	client: PublicClient = createPublicClient({
		chain: mantle,
		transport: http(process.env.MANTLE_RPC_URL ?? MANTLE_RPC_URL, {
			timeout: 5_000,
		}),
	}),
): Promise<ShieldMarket> {
	const [reserveData, availableLiquidity] = await Promise.all([
		client.readContract({
			address: AAVE_MANTLE_DATA_PROVIDER,
			abi: reserveDataAbi,
			functionName: "getReserveData",
			args: [MANTLE_USDE],
		}),
		client.readContract({
			address: MANTLE_USDE,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [AAVE_MANTLE_USDE_ATOKEN],
		}),
	]);
	const totalAToken = reserveData[2];
	const liquidityRate = reserveData[5];

	return {
		protocol: "Aave V3",
		market: "USDe",
		poolAddress: AAVE_MANTLE_USDE_ATOKEN,
		underlyingToken: MANTLE_USDE,
		supplyRateE18: liquidityRate.toString(),
		estimatedSupplyApy: rayRateToApy(liquidityRate),
		availableLiquidity: formatUnits(availableLiquidity, 18),
		totalAssets: formatUnits(totalAToken, 18),
		status: "live",
		updatedAt: new Date().toISOString(),
	};
}

export function getAaveFallbackMarket(): ShieldMarket {
	return {
		protocol: "Aave V3",
		market: "USDe",
		poolAddress: AAVE_MANTLE_USDE_ATOKEN,
		underlyingToken: MANTLE_USDE,
		supplyRateE18: "0",
		estimatedSupplyApy: 0,
		availableLiquidity: "0",
		totalAssets: "0",
		status: "fallback",
		updatedAt: new Date().toISOString(),
	};
}

function round(value: number, digits: number): number {
	const scale = 10 ** digits;
	return Math.round(value * scale) / scale;
}
