import "dotenv/config";
import { AgentRuntime } from "./agent/runtime.js";
import { createMolqServer } from "./app.js";
import { BybitHedgeExecutor } from "./execution/hedge-executor.js";
import { VaultKeeper } from "./execution/vault-keeper.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
const hedgeExecutor = BybitHedgeExecutor.fromEnv();
const vaultKeeper = VaultKeeper.fromEnv();
const agentRuntime = AgentRuntime.fromEnv(hedgeExecutor, vaultKeeper);
const server = createMolqServer(hedgeExecutor, vaultKeeper, agentRuntime);

agentRuntime.start();

server.listen(port, host, () => {
	console.log(`MolQ API listening on http://${host}:${port}`);
});
