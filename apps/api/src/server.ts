import "dotenv/config";
import { createMolqServer } from "./app.js";
import { BybitHedgeExecutor } from "./execution/hedge-executor.js";
import { VaultKeeper } from "./execution/vault-keeper.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
const hedgeExecutor = BybitHedgeExecutor.fromEnv();
const vaultKeeper = VaultKeeper.fromEnv();
const server = createMolqServer(hedgeExecutor, vaultKeeper);

server.listen(port, host, () => {
	console.log(`MolQ API listening on http://${host}:${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
	process.on(signal, () => {
		console.log(`MolQ API received ${signal}, shutting down`);
		server.close((error) => {
			if (error) {
				console.error("MolQ API shutdown failed:", error);
				process.exitCode = 1;
			}
			process.exit();
		});
		setTimeout(() => process.exit(1), 10_000).unref();
	});
}
