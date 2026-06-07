import { createConfig } from "ponder";
import { MolqDecisionLoggerAbi } from "./abis/MolqDecisionLoggerAbi";
import { MolqVaultAbi } from "./abis/MolqVaultAbi";

const decisionLogger = "0xb6e5499C97138Ee6E25d1E904b6714BD0E60f139";
const vault = "0x71711F35c200fDabE75F2e82F0146c35f32eBAA5";
const startBlock = Number(process.env.PONDER_START_BLOCK ?? 96392436);

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
			address: (process.env.PONDER_MOLQ_DECISION_LOGGER ?? decisionLogger) as `0x${string}`,
			startBlock,
		},
		MolqVault: {
			chain: "mantle",
			abi: MolqVaultAbi,
			address: (process.env.PONDER_MOLQ_VAULT ?? vault) as `0x${string}`,
			startBlock,
		},
	},
});
