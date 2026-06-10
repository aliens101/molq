import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DashboardResponse } from "@molq/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TelemetryStore } from "./telemetry.js";

const directories: string[] = [];

afterEach(async () => {
	vi.unstubAllGlobals();
	await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("TelemetryStore", () => {
	it("persists strategy observations and returns indexed history", async () => {
		const directory = await mkdtemp(join(tmpdir(), "molq-telemetry-"));
		directories.push(directory);
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					data: {
						vaultEvents: { items: [{ id: "event-1", type: "deposit" }] },
						vaultSnapshots: { items: [{ id: "snapshot-1", trigger: "deposit" }] },
					},
				}),
			}),
		);
		const store = new TelemetryStore(join(directory, "performance.jsonl"), 0);

		await store.record(dashboard());
		const history = await store.history();

		expect(history.performance).toHaveLength(1);
		expect(history.performance[0]?.activeProjectedApy).toBe(0.52);
		expect(history.vaultEvents[0]?.type).toBe("deposit");
		expect(history.vaultSnapshots[0]?.trigger).toBe("deposit");
		expect(history.indexerAvailable).toBe(true);
	});
});

function dashboard(): DashboardResponse {
	return {
		portfolio: {
			balance: 0.2,
			deposited: 0.2,
			realizedProfit: 0,
			shieldBalance: 0.17,
			alphaBalance: 0.03,
			allocation: { shieldPercent: 85, alphaPercent: 15 },
			riskMode: "balanced",
		},
		market: {
			mantleYieldApy: 0.61,
			fundingApy: -9,
			estimatedNetApy: 0.52,
			targetNetApy: -0.83,
			shieldContributionApy: 0.52,
			hedgeContributionApy: 0,
			hedgeRatio: 0,
			liquidityScore: 100,
			riskScore: 25,
			updatedAt: "2026-06-10T00:00:00.000Z",
		},
		decisions: [],
	};
}
