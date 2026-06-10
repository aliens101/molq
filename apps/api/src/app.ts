import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { AgentRuntime } from "./agent/runtime.js";
import { getAgentIdentity } from "./agent/identity.js";
import { applyHedgeProjection, getLiveDashboard } from "./dashboard.js";
import { BybitHedgeExecutor } from "./execution/hedge-executor.js";
import { VaultKeeper } from "./execution/vault-keeper.js";
import { getDeepHealth } from "./health.js";
import { getProtocolMarkets } from "./integrations/markets.js";
import { TelemetryStore } from "./telemetry.js";

const reconcileSchema = z.object({
	targetNotionalUsd: z.number().nonnegative(),
	idempotencyKey: z.string().min(8).max(128),
});
const hardenProfitSchema = z.object({
	grossProfitUsd: z.number().positive(),
	idempotencyKey: z.string().min(8).max(128),
});
const operatorAttempts = new Map<string, { count: number; resetAt: number }>();
const completedOperations = new Map<string, unknown>();

export function createMolqServer(
	hedgeExecutor = BybitHedgeExecutor.fromEnv(),
	vaultKeeper = VaultKeeper.fromEnv(),
	agentRuntime = AgentRuntime.fromEnv(hedgeExecutor, vaultKeeper),
	telemetry = TelemetryStore.fromEnv(),
) {
	return createServer(async (request, response) => {
		setSecurityHeaders(request, response);

		if (request.method === "OPTIONS") {
			response.writeHead(204).end();
			return;
		}

		try {
			const url = new URL(request.url ?? "/", "http://localhost");
			const path = url.pathname;

			if (request.method === "GET" && path === "/api/health") {
				sendJson(response, 200, { status: "ok", service: "molq-api" });
				return;
			}

			if (request.method === "GET" && path === "/api/health/deep") {
				const health = await getDeepHealth(hedgeExecutor, vaultKeeper, agentRuntime);
				sendJson(response, health.healthy ? 200 : 503, health);
				return;
			}

			if (request.method === "GET" && path === "/api/dashboard") {
				const [dashboard, realizedProfit] = await Promise.all([
					withExecution(hedgeExecutor),
					telemetry.realizedProfitUsd(),
				]);
				dashboard.portfolio.realizedProfit = realizedProfit;
				void telemetry.record(dashboard).catch((error) => {
					console.error("Failed to persist performance telemetry:", error);
				});
				sendJson(response, 200, {
					...dashboard,
					decisions: agentRuntime.recentDecisions(),
				});
				return;
			}

			if (request.method === "GET" && path === "/api/history") {
				sendJson(response, 200, await telemetry.history());
				return;
			}

			if (request.method === "GET" && path === "/api/agent/status") {
				const [runtime, identity] = await Promise.all([
					agentRuntime.status(),
					getAgentIdentity(),
				]);
				sendJson(response, 200, { ...runtime, identity });
				return;
			}

			if (request.method === "GET" && path === "/api/integrations/markets") {
				sendJson(response, 200, await getProtocolMarkets());
				return;
			}

			if (request.method === "GET" && path === "/api/execution/hedge") {
				const target = Number(url.searchParams.get("targetNotionalUsd") ?? 0);
				sendJson(response, 200, await hedgeExecutor.status(target));
				return;
			}

			if (request.method === "GET" && path === "/api/execution/vault") {
				sendJson(response, 200, await vaultKeeper.status());
				return;
			}

			if (request.method === "POST" && path === "/api/execution/hedge/reconcile") {
				assertOperator(request);
				const body = reconcileSchema.parse(await readJson(request));
				const cached = completedOperations.get(body.idempotencyKey);
				if (cached) {
					sendJson(response, 200, cached);
					return;
				}
				const result = await hedgeExecutor.reconcile(
					body.targetNotionalUsd,
					body.idempotencyKey,
				);
				completedOperations.set(body.idempotencyKey, result);
				sendJson(response, 200, result);
				return;
			}

			if (request.method === "POST" && path === "/api/execution/vault/rebalance") {
				assertOperator(request);
				sendJson(response, 200, await vaultKeeper.rebalance());
				return;
			}

			if (request.method === "POST" && path === "/api/execution/vault/harden") {
				assertOperator(request);
				const body = hardenProfitSchema.parse(await readJson(request));
				const cached = completedOperations.get(body.idempotencyKey);
				if (cached) {
					sendJson(response, 200, cached);
					return;
				}
				const result = await vaultKeeper.hardenProfit(body.grossProfitUsd);
				completedOperations.set(body.idempotencyKey, result);
				sendJson(response, 200, result);
				return;
			}

			if (request.method === "POST" && path === "/api/agent/run") {
				assertOperator(request);
				sendJson(response, 200, await agentRuntime.run());
				return;
			}

			sendJson(response, 404, { error: "Not found" });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unexpected error";
			sendJson(response, 400, { error: message });
		}
	});
}

function setSecurityHeaders(request: IncomingMessage, response: ServerResponse) {
	const allowedOrigins = new Set(
		(process.env.MOLQ_ALLOWED_ORIGINS ?? "https://molq.site,https://app.molq.site")
			.split(",")
			.map((origin) => origin.trim()),
	);
	const origin = request.headers.origin;
	if (origin && allowedOrigins.has(origin)) {
		response.setHeader("Access-Control-Allow-Origin", origin);
		response.setHeader("Vary", "Origin");
	}
	response.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Molq-Operator-Key");
	response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	response.setHeader("X-Content-Type-Options", "nosniff");
	response.setHeader("X-Frame-Options", "DENY");
	response.setHeader("Referrer-Policy", "no-referrer");
	response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
	response.setHeader("Cache-Control", "no-store");
}

async function withExecution(hedgeExecutor: BybitHedgeExecutor) {
	const dashboard = await getLiveDashboard();
	const hedgeExecution = await hedgeExecutor.status(dashboard.portfolio.alphaBalance);
	return {
		...applyHedgeProjection(dashboard, hedgeExecution.currentShortNotionalUsd),
		hedgeExecution,
	};
}

function assertOperator(request: IncomingMessage) {
	const expected = process.env.MOLQ_OPERATOR_API_KEY;
	const provided = request.headers["x-molq-operator-key"];
	if (!expected || typeof provided !== "string") {
		throw new Error("Operator execution is disabled");
	}
	const now = Date.now();
	const key = request.socket.remoteAddress ?? "unknown";
	const attempt = operatorAttempts.get(key);
	if (!attempt || attempt.resetAt <= now) {
		operatorAttempts.set(key, { count: 1, resetAt: now + 60_000 });
	} else {
		attempt.count += 1;
		if (attempt.count > Number(process.env.MOLQ_OPERATOR_RATE_LIMIT_PER_MINUTE ?? 10)) {
			throw new Error("Operator rate limit exceeded");
		}
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
	let total = 0;
	const maxBytes = Number(process.env.MOLQ_MAX_REQUEST_BODY_BYTES ?? 16_384);
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		total += buffer.length;
		if (total > maxBytes) throw new Error("Request body is too large");
		chunks.push(buffer);
	}

	const body = Buffer.concat(chunks).toString("utf8");
	return body ? JSON.parse(body) : {};
}
