import { INIT_USDE_LENDING_POOL, MANTLE_RPC_URL, type ShieldMarket } from "@molq/shared";
import { createPublicClient, formatUnits, http, type PublicClient } from "viem";
import { mantle } from "viem/chains";

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

const lendingPoolAbi = [
	{
		type: "function",
		name: "underlyingToken",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "address" }],
	},
	{
		type: "function",
		name: "getSupplyRate_e18",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "cash",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "totalAssets",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
] as const;

export function annualizePerSecondRate(rateE18: bigint): number {
	return round((Number(rateE18) / 1e18) * SECONDS_PER_YEAR * 100, 4);
}

export async function getInitUsdeMarket(
	client: PublicClient = createPublicClient({
		chain: mantle,
		transport: http(process.env.MANTLE_RPC_URL ?? MANTLE_RPC_URL, {
			timeout: 5_000,
		}),
	}),
): Promise<ShieldMarket> {
	const [underlyingToken, supplyRateE18, availableLiquidity, totalAssets] = await Promise.all([
		client.readContract({
			address: INIT_USDE_LENDING_POOL,
			abi: lendingPoolAbi,
			functionName: "underlyingToken",
		}),
		client.readContract({
			address: INIT_USDE_LENDING_POOL,
			abi: lendingPoolAbi,
			functionName: "getSupplyRate_e18",
		}),
		client.readContract({
			address: INIT_USDE_LENDING_POOL,
			abi: lendingPoolAbi,
			functionName: "cash",
		}),
		client.readContract({
			address: INIT_USDE_LENDING_POOL,
			abi: lendingPoolAbi,
			functionName: "totalAssets",
		}),
	]);

	return {
		protocol: "INIT Capital",
		market: "USDe",
		poolAddress: INIT_USDE_LENDING_POOL,
		underlyingToken,
		supplyRateE18: supplyRateE18.toString(),
		estimatedSupplyApy: annualizePerSecondRate(supplyRateE18),
		availableLiquidity: formatUnits(availableLiquidity, 18),
		totalAssets: formatUnits(totalAssets, 18),
		status: "live",
		updatedAt: new Date().toISOString(),
	};
}

export function getInitFallbackMarket(): ShieldMarket {
	return {
		protocol: "INIT Capital",
		market: "USDe",
		poolAddress: INIT_USDE_LENDING_POOL,
		underlyingToken: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
		supplyRateE18: "0",
		estimatedSupplyApy: 5.5,
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
