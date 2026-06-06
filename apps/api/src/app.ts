import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { BybitHedgeExecutor } from "./execution/hedge-executor.js";
import { enrichDashboard, getProtocolMarkets } from "./integrations/markets.js";
import { MolqStrategyEngine } from "./strategy.js";

const depositSchema = z.object({
	amount: z.number().positive().max(10_000_000),
	riskMode: z.enum(["conservative", "balanced", "growth"]),
});

const reconcileSchema = z.object({
	targetNotionalUsd: z.number().nonnegative(),
	idempotencyKey: z.string().min(8).max(128),
});

export function createMolqServer(
	engine = new MolqStrategyEngine(),
	hedgeExecutor = BybitHedgeExecutor.fromEnv(),
) {
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
				sendJson(response, 200, await withExecution(engine.getDashboard(), hedgeExecutor));
				return;
			}

			if (request.method === "GET" && request.url === "/api/integrations/markets") {
				sendJson(response, 200, await getProtocolMarkets());
				return;
			}

			if (request.method === "GET" && request.url?.startsWith("/api/execution/hedge")) {
				const target = Number(
					new URL(request.url, "http://localhost").searchParams.get(
						"targetNotionalUsd",
					) ?? 0,
				);
				sendJson(response, 200, await hedgeExecutor.status(target));
				return;
			}

			if (request.method === "POST" && request.url === "/api/execution/hedge/reconcile") {
				assertOperator(request);
				const body = reconcileSchema.parse(await readJson(request));
				sendJson(
					response,
					200,
					await hedgeExecutor.reconcile(body.targetNotionalUsd, body.idempotencyKey),
				);
				return;
			}

			if (request.method === "POST" && request.url === "/api/deposit") {
				const body = depositSchema.parse(await readJson(request));
				sendJson(
					response,
					200,
					await withExecution(engine.deposit(body.amount, body.riskMode), hedgeExecutor),
				);
				return;
			}

			if (request.method === "POST" && request.url === "/api/cycle") {
				sendJson(response, 200, await withExecution(engine.runCycle(), hedgeExecutor));
				return;
			}

			if (request.method === "POST" && request.url === "/api/reset") {
				sendJson(response, 200, await withExecution(engine.reset(), hedgeExecutor));
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
	response.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Molq-Operator-Key");
	response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

async function withExecution(
	dashboard: ReturnType<MolqStrategyEngine["getDashboard"]>,
	hedgeExecutor: BybitHedgeExecutor,
) {
	const enriched = await enrichDashboard(dashboard);
	return {
		...enriched,
		hedgeExecution: await hedgeExecutor.status(enriched.portfolio.alphaBalance),
	};
}

function assertOperator(request: IncomingMessage) {
	const expected = process.env.MOLQ_OPERATOR_API_KEY;
	const provided = request.headers["x-molq-operator-key"];
	if (!expected || typeof provided !== "string") {
		throw new Error("Operator execution is disabled");
	}

	const expectedBuffer = Buffer.from(expected);
	const providedBuffer = Buffer.from(provided);
	if (
		expectedBuffer.length !== providedBuffer.length ||
		!timingSafeEqual(expectedBuffer, providedBuffer)
	) {
		throw new Error("Invalid operator credentials");
	}
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
