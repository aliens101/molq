import { MANTLE_RPC_URL } from "@molq/shared";
import { createConfig, http } from "wagmi";
import { mantle } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const web3Config = createConfig({
	chains: [mantle],
	connectors: [injected()],
	transports: {
		[mantle.id]: http(import.meta.env.VITE_MANTLE_RPC_URL ?? MANTLE_RPC_URL),
	},
});
