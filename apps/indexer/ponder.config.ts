import { createConfig } from "ponder";
import { IdentityRegistryAbi } from "./abis/IdentityRegistryAbi";
import { MolqDecisionLoggerAbi } from "./abis/MolqDecisionLoggerAbi";
import { MolqVaultAbi } from "./abis/MolqVaultAbi";

const legacyDecisionLogger = "0x24df9c33D24D7C84e527D247D25a203490001Be9";
const decisionLogger = "0x0F38FF858fE3974be7c05625281CA6b774Be9E9b";
const vault = "0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9";
const startBlock = Number(process.env.PONDER_START_BLOCK ?? 96423301);
const identityRegistry = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const identityStartBlock = Number(process.env.PONDER_IDENTITY_START_BLOCK ?? 96423301);

export default createConfig({
	chains: {
		mantle: {
			id: 5000,
			rpc: process.env.PONDER_RPC_URL_5000 ?? "https://rpc.mantle.xyz",
			maxRequestsPerSecond: Number(process.env.PONDER_MAX_REQUESTS_PER_SECOND ?? 2),
			ethGetLogsBlockRange: Number(process.env.PONDER_LOG_BLOCK_RANGE ?? 100),
		},
	},
	contracts: {
		LegacyMolqDecisionLogger: {
			chain: "mantle",
			abi: MolqDecisionLoggerAbi,
			address: (process.env.PONDER_MOLQ_LEGACY_DECISION_LOGGER ??
				legacyDecisionLogger) as `0x${string}`,
			startBlock,
		},
		MolqDecisionLogger: {
			chain: "mantle",
			abi: MolqDecisionLoggerAbi,
			address: (process.env.PONDER_MOLQ_DECISION_LOGGER ?? decisionLogger) as `0x${string}`,
			startBlock: Number(process.env.PONDER_DECISION_LOGGER_V2_START_BLOCK ?? 96477427),
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
