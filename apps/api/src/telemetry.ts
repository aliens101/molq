import { mkdir, readFile, appendFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type {
	DashboardResponse,
	PerformanceHistory,
	PerformancePoint,
	VaultHistoryEvent,
	VaultHistorySnapshot,
} from "@molq/shared";
import { formatUnits } from "viem";

export class TelemetryStore {
	private lastRecordedAt = 0;

	constructor(
		private readonly path: string,
		private readonly intervalMs = 60_000,
		private readonly maxPoints = 2_016,
		private readonly indexerUrl = "https://indexer.molq.site/graphql",
	) {}

	static fromEnv() {
		return new TelemetryStore(
			resolve(process.env.MOLQ_TELEMETRY_PATH ?? "data/performance.jsonl"),
			Number(process.env.MOLQ_TELEMETRY_INTERVAL_MS ?? 60_000),
			Number(process.env.MOLQ_TELEMETRY_MAX_POINTS ?? 2_016),
			process.env.MOLQ_INDEXER_GRAPHQL_URL ?? "https://indexer.molq.site/graphql",
		);
	}

	async record(dashboard: DashboardResponse): Promise<void> {
		const now = Date.now();
		if (now - this.lastRecordedAt < this.intervalMs) return;
		this.lastRecordedAt = now;
		const point: PerformancePoint = {
			timestamp: dashboard.market.updatedAt,
			totalAssets: dashboard.portfolio.balance,
			shieldAssets: dashboard.portfolio.shieldBalance,
			liquidAssets: dashboard.portfolio.alphaBalance,
			activeProjectedApy: dashboard.market.estimatedNetApy,
			targetScenarioApy: dashboard.market.targetNetApy,
			aaveSupplyApy: dashboard.market.mantleYieldApy,
			fundingApy: dashboard.market.fundingApy,
			riskScore: dashboard.market.riskScore,
		};
		await mkdir(dirname(this.path), { recursive: true });
		await appendFile(this.path, `${JSON.stringify(point)}\n`, "utf8");
	}

	async history(): Promise<PerformanceHistory> {
		const [performance, indexed] = await Promise.all([
			this.readPoints(),
			this.readIndexerHistory(),
		]);
		return { performance, ...indexed };
	}

	async realizedProfitUsd(): Promise<number> {
		const { vaultEvents } = await this.readIndexerHistory();
		return vaultEvents
			.filter((event) => event.type === "profit_hardened" && event.alphaBalance)
			.reduce(
				(total, event) => total + Number(formatUnits(BigInt(event.alphaBalance!), 18)),
				0,
			);
	}

	private async readPoints(): Promise<PerformancePoint[]> {
		try {
			const content = await readFile(this.path, "utf8");
			return content
				.trim()
				.split("\n")
				.filter(Boolean)
				.slice(-this.maxPoints)
				.map((line) => JSON.parse(line) as PerformancePoint);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
			throw error;
		}
	}

	private async readIndexerHistory(): Promise<
		Pick<PerformanceHistory, "vaultEvents" | "vaultSnapshots" | "indexerAvailable">
	> {
		try {
			const response = await fetch(this.indexerUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: `query MolqHistory {
						vaultEvents(orderBy: "blockTimestamp", orderDirection: "desc", limit: 100) {
							items { id type assets shares amount alphaBalance blockTimestamp transactionHash }
						}
						vaultSnapshots(orderBy: "blockTimestamp", orderDirection: "desc", limit: 100) {
							items { id trigger totalAssets shieldBalance alphaBalance blockTimestamp transactionHash }
						}
					}`,
				}),
				signal: AbortSignal.timeout(8_000),
			});
			if (!response.ok) throw new Error(`Indexer returned ${response.status}`);
			const payload = (await response.json()) as {
				data?: {
					vaultEvents?: { items: VaultHistoryEvent[] };
					vaultSnapshots?: { items: VaultHistorySnapshot[] };
				};
				errors?: unknown[];
			};
			if (payload.errors?.length) throw new Error("Indexer GraphQL query failed");
			return {
				vaultEvents: payload.data?.vaultEvents?.items ?? [],
				vaultSnapshots: payload.data?.vaultSnapshots?.items ?? [],
				indexerAvailable: true,
			};
		} catch {
			return { vaultEvents: [], vaultSnapshots: [], indexerAvailable: false };
		}
	}
}
