import type { AlphaMarket, ShieldMarket } from "@molq/shared";
import { getAaveFallbackMarket, getAaveUsdeMarket } from "./aave.js";
import { getBybitEthMarket, getBybitFallbackMarket } from "./bybit.js";

export interface ProtocolMarkets {
	shieldMarket: ShieldMarket;
	alphaMarket: AlphaMarket;
}

export async function getProtocolMarkets(): Promise<ProtocolMarkets> {
	const [shieldMarket, alphaMarket] = await Promise.all([
		getAaveUsdeMarket().catch(() => getAaveFallbackMarket()),
		getBybitEthMarket().catch(() => getBybitFallbackMarket()),
	]);

	return { shieldMarket, alphaMarket };
}
