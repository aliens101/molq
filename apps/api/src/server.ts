import { createMolqServer } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
const server = createMolqServer();

server.listen(port, host, () => {
	console.log(`MolQ API listening on http://${host}:${port}`);
});
