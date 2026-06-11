import "dotenv/config";
import { AgentRuntime } from "./agent/runtime.js";
import { BybitHedgeExecutor } from "./execution/hedge-executor.js";
import { VaultKeeper } from "./execution/vault-keeper.js";

const hedgeExecutor = BybitHedgeExecutor.fromEnv();
const vaultKeeper = VaultKeeper.fromEnv();
const agentRuntime = AgentRuntime.fromEnv(hedgeExecutor, vaultKeeper);
const timer = agentRuntime.start(true);

if (!timer) {
	console.error("MolQ agent worker is disabled");
	process.exit(1);
}

console.log("MolQ agent worker started");

for (const signal of ["SIGTERM", "SIGINT"] as const) {
	process.on(signal, () => {
		clearInterval(timer);
		console.log(`MolQ agent worker received ${signal}, shutting down`);
		process.exit();
	});
}
