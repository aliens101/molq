import type { AgentRuntime } from "./agent/runtime.js";
import type { BybitHedgeExecutor } from "./execution/hedge-executor.js";
import type { VaultKeeper } from "./execution/vault-keeper.js";
import { applyHedgeProjection, getLiveDashboard } from "./dashboard.js";

export async function getDeepHealth(
	hedgeExecutor: BybitHedgeExecutor,
	vaultKeeper: VaultKeeper,
	agentRuntime: AgentRuntime,
) {
	const checks: Record<string, { ok: boolean; message: string }> = {};
	try {
		const dashboard = await getLiveDashboard();
		const hedge = await hedgeExecutor.status(dashboard.portfolio.alphaBalance);
		const projected = applyHedgeProjection(dashboard, hedge.currentShortNotionalUsd);
		checks.vault = {
			ok: projected.portfolio.balance >= 0,
			message: `${projected.portfolio.balance.toFixed(6)} USDe tracked`,
		};
		checks.aave = {
			ok: projected.shieldMarket?.status === "live",
			message: `${projected.shieldMarket?.estimatedSupplyApy.toFixed(4) ?? "0"}% APY`,
		};
		checks.bybitMarket = {
			ok: projected.alphaMarket?.status === "live",
			message: hedge.tradingEnabled ? "Trading armed" : "Read-only",
		};
	} catch (error) {
		checks.vault = {
			ok: false,
			message: error instanceof Error ? error.message : "Vault check failed",
		};
	}

	const [keeper, agent, indexer] = await Promise.all([
		vaultKeeper.status().catch((error) => ({
			enabled: false,
			authorized: false,
			message: error instanceof Error ? error.message : "Keeper check failed",
		})),
		agentRuntime.status(),
		checkUrl(process.env.MOLQ_INDEXER_HEALTH_URL ?? "http://127.0.0.1:8071/health"),
	]);
	checks.keeper = {
		ok: !keeper.enabled || keeper.authorized,
		message: keeper.message,
	};
	checks.agent = {
		ok: agent.enabled && (!agent.logger.enabled || agent.logger.authorized),
		message: agent.enabled ? agent.logger.message : "Agent disabled",
	};
	checks.indexer = indexer;

	const healthy = Object.values(checks).every((check) => check.ok);
	return {
		status: healthy ? "ok" : "degraded",
		service: "molq-api",
		healthy,
		checkedAt: new Date().toISOString(),
		checks,
	};
}

async function checkUrl(url: string) {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
		return {
			ok: response.ok,
			message: response.ok ? "Indexer healthy" : `Indexer returned ${response.status}`,
		};
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Indexer check failed",
		};
	}
}
