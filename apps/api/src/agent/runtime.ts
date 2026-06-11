import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type {
	AgentDecision,
	AgentPolicyDecision,
	AgentPolicySnapshot,
	DashboardResponse,
} from "@molq/shared";
import { formatUnits } from "viem";
import { getLiveDashboard } from "../dashboard.js";
import { BybitHedgeExecutor } from "../execution/hedge-executor.js";
import { VaultKeeper } from "../execution/vault-keeper.js";
import { DecisionLoggerClient, type DecisionLoggerStatus } from "./decision-logger.js";
import { AgentPolicy } from "./policy.js";

export interface AgentExecutionReport {
	decision: AgentPolicyDecision;
	vaultTransactionHash?: string;
	hedgeOrderId?: string;
	decisionTransactionHash?: string;
	errors: string[];
	completedAt: string;
}

export interface AgentRuntimeStatus {
	enabled: boolean;
	running: boolean;
	intervalMs: number;
	modelConfigured: boolean;
	logger: DecisionLoggerStatus;
	lastRun?: AgentExecutionReport;
	history: AgentExecutionReport[];
}

export class AgentRuntime {
	private running = false;
	private readonly history: AgentExecutionReport[] = [];
	private readonly historyPath = resolve(
		process.env.MOLQ_AGENT_HISTORY_PATH ?? "data/agent-history.json",
	);

	constructor(
		private readonly enabled: boolean,
		private readonly intervalMs: number,
		private readonly policy: AgentPolicy,
		private readonly hedgeExecutor: BybitHedgeExecutor,
		private readonly vaultKeeper: VaultKeeper,
		private readonly logger: DecisionLoggerClient,
		private readonly dashboardLoader: () => Promise<DashboardResponse> = getLiveDashboard,
	) {}

	static fromEnv(
		hedgeExecutor = BybitHedgeExecutor.fromEnv(),
		vaultKeeper = VaultKeeper.fromEnv(),
	): AgentRuntime {
		return new AgentRuntime(
			process.env.MOLQ_AGENT_ENABLED === "true",
			Number(process.env.MOLQ_AGENT_INTERVAL_MS ?? 300_000),
			AgentPolicy.fromEnv(),
			hedgeExecutor,
			vaultKeeper,
			DecisionLoggerClient.fromEnv(),
		);
	}

	start(keepAlive = false): NodeJS.Timeout | undefined {
		if (!this.enabled || this.intervalMs <= 0) return undefined;
		void this.run().catch((error) => {
			console.error("MolQ initial agent cycle failed:", error);
		});
		const timer = setInterval(() => {
			void this.run().catch((error) => {
				console.error("MolQ agent cycle failed:", error);
			});
		}, this.intervalMs);
		if (!keepAlive) timer.unref();
		return timer;
	}

	async status(): Promise<AgentRuntimeStatus> {
		await this.refreshHistory();
		return {
			enabled: this.enabled,
			running: this.running,
			intervalMs: this.intervalMs,
			modelConfigured: Boolean(process.env.OPENAI_API_KEY),
			logger: await this.logger.status(),
			lastRun: this.history[0],
			history: this.history.slice(0, 20),
		};
	}

	async recentDecisions(): Promise<AgentDecision[]> {
		await this.refreshHistory();
		return this.history.map(({ decision, decisionTransactionHash }) => ({
			id: decision.id,
			action: decision.action,
			amount: decision.targetHedgeNotionalUsd,
			riskScore: decision.riskScore,
			reason: decision.reason,
			createdAt: decision.createdAt,
			txHash: decisionTransactionHash,
		}));
	}

	async run(): Promise<AgentExecutionReport> {
		if (!this.enabled) throw new Error("Autonomous agent is disabled");
		if (this.running) throw new Error("An agent cycle is already running");
		this.running = true;

		try {
			const dashboard = await this.dashboardLoader();
			const [hedgeStatus, keeperStatus] = await Promise.all([
				this.hedgeExecutor.status(dashboard.portfolio.alphaBalance),
				this.vaultKeeper.status(),
			]);
			const decision = await this.policy.decide(
				toPolicySnapshot(dashboard, hedgeStatus.currentShortNotionalUsd, keeperStatus),
			);
			const report: AgentExecutionReport = {
				decision,
				errors: [],
				completedAt: new Date().toISOString(),
			};

			if (decision.action === "rebalance" || decision.action === "rebalance_and_hedge") {
				try {
					const result = await this.vaultKeeper.rebalance();
					report.vaultTransactionHash = result.lastTransactionHash;
				} catch (error) {
					report.errors.push(errorMessage("Vault", error));
				}
			}

			if (decision.action === "hedge" || decision.action === "rebalance_and_hedge") {
				try {
					const result = await this.hedgeExecutor.reconcile(
						decision.targetHedgeNotionalUsd,
						decision.id,
					);
					report.hedgeOrderId = result.lastOrderId;
				} catch (error) {
					report.errors.push(errorMessage("Bybit", error));
				}
			}

			try {
				report.decisionTransactionHash = await this.logger.log(decision, {
					vaultTransactionHash: report.vaultTransactionHash,
					hedgeOrderId: report.hedgeOrderId,
					errors: report.errors,
				});
			} catch (error) {
				report.errors.push(errorMessage("Logger", error));
			}

			report.completedAt = new Date().toISOString();
			this.history.unshift(report);
			this.history.splice(50);
			await this.persistHistory();
			return report;
		} finally {
			this.running = false;
		}
	}

	private async persistHistory(): Promise<void> {
		await mkdir(dirname(this.historyPath), { recursive: true });
		const temporaryPath = `${this.historyPath}.${process.pid}.tmp`;
		await writeFile(temporaryPath, JSON.stringify(this.history), "utf8");
		await rename(temporaryPath, this.historyPath);
	}

	private async readHistory(): Promise<AgentExecutionReport[]> {
		try {
			const value = JSON.parse(await readFile(this.historyPath, "utf8")) as unknown;
			return Array.isArray(value) ? (value as AgentExecutionReport[]).slice(0, 50) : [];
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
			console.error("Failed to read agent history:", error);
			return [];
		}
	}

	private async refreshHistory(): Promise<void> {
		const persisted = await this.readHistory();
		if (persisted.length > 0) this.history.splice(0, this.history.length, ...persisted);
	}
}

function toPolicySnapshot(
	dashboard: DashboardResponse,
	currentHedgeNotionalUsd: number,
	keeper: Awaited<ReturnType<VaultKeeper["status"]>>,
): AgentPolicySnapshot {
	return {
		totalAssetsUsd: dashboard.portfolio.balance,
		shieldAssetsUsd: dashboard.portfolio.shieldBalance,
		liquidAssetsUsd: dashboard.portfolio.alphaBalance,
		targetShieldAssetsUsd: Number(formatUnits(BigInt(keeper.targetShieldAssets), 18)),
		currentHedgeNotionalUsd,
		aaveSupplyApy: dashboard.market.mantleYieldApy,
		bybitFundingApy: dashboard.market.fundingApy,
		liquidityScore: dashboard.market.liquidityScore,
		marketRiskScore: dashboard.market.riskScore,
		shieldMarketLive: dashboard.shieldMarket?.status === "live",
		alphaMarketLive: dashboard.alphaMarket?.status === "live",
	};
}

function errorMessage(component: string, error: unknown): string {
	return `${component}: ${error instanceof Error ? error.message : "execution failed"}`;
}
