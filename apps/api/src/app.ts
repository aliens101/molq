import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { MolqStrategyEngine } from "./strategy.js";

const depositSchema = z.object({
	amount: z.number().positive().max(10_000_000),
	riskMode: z.enum(["conservative", "balanced", "growth"]),
});

export function createMolqServer(engine = new MolqStrategyEngine()) {
	return createServer(async (request, response) => {
		setCors(response);

		if (request.method === "OPTIONS") {
			response.writeHead(204).end();
			return;
		}

		try {
			if (request.method === "GET" && request.url === "/api/health") {
				sendJson(response, 200, { status: "ok", service: "molq-api" });
				return;
			}

			if (request.method === "GET" && request.url === "/api/dashboard") {
				sendJson(response, 200, engine.getDashboard());
				return;
			}

			if (request.method === "POST" && request.url === "/api/deposit") {
				const body = depositSchema.parse(await readJson(request));
				sendJson(response, 200, engine.deposit(body.amount, body.riskMode));
				return;
			}

			if (request.method === "POST" && request.url === "/api/cycle") {
				sendJson(response, 200, engine.runCycle());
				return;
			}

			if (request.method === "POST" && request.url === "/api/reset") {
				sendJson(response, 200, engine.reset());
				return;
			}

			sendJson(response, 404, { error: "Not found" });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unexpected error";
			sendJson(response, 400, { error: message });
		}
	});
}

function setCors(response: ServerResponse) {
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Access-Control-Allow-Headers", "Content-Type");
	response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
	response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
	response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of request) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}

	const body = Buffer.concat(chunks).toString("utf8");
	return body ? JSON.parse(body) : {};
}
