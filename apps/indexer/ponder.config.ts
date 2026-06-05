import { createConfig } from "ponder";
import { MolqDecisionLoggerAbi } from "./abis/MolqDecisionLoggerAbi";
import { MolqVaultAbi } from "./abis/MolqVaultAbi";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const startBlock = Number(process.env.PONDER_START_BLOCK ?? 0);

export default createConfig({
	chains: {
		mantle: {
			id: 5000,
			rpc: process.env.PONDER_RPC_URL_5000 ?? "https://rpc.mantle.xyz",
		},
	},
	contracts: {
		MolqDecisionLogger: {
			chain: "mantle",
			abi: MolqDecisionLoggerAbi,
			address: (process.env.PONDER_MOLQ_DECISION_LOGGER ?? zeroAddress) as `0x${string}`,
			startBlock,
		},
		MolqVault: {
			chain: "mantle",
			abi: MolqVaultAbi,
			address: (process.env.PONDER_MOLQ_VAULT ?? zeroAddress) as `0x${string}`,
			startBlock,
		},
	},
});
