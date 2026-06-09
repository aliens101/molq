import { createConfig } from "ponder";
import { IdentityRegistryAbi } from "./abis/IdentityRegistryAbi";
import { MolqDecisionLoggerAbi } from "./abis/MolqDecisionLoggerAbi";
import { MolqVaultAbi } from "./abis/MolqVaultAbi";

const decisionLogger = "0xb6e5499C97138Ee6E25d1E904b6714BD0E60f139";
const vault = "0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9";
const startBlock = Number(process.env.PONDER_START_BLOCK ?? 96392436);
const identityRegistry = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const identityStartBlock = Number(process.env.PONDER_IDENTITY_START_BLOCK ?? 96423301);

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
		IdentityRegistry: {
			chain: "mantle",
			abi: IdentityRegistryAbi,
			address: (process.env.PONDER_IDENTITY_REGISTRY ?? identityRegistry) as `0x${string}`,
			startBlock: identityStartBlock,
		},
	},
});
