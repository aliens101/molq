import type { AgentPolicySnapshot } from "@molq/shared";
import { describe, expect, it, vi } from "vitest";
import { AgentPolicy, type AgentModel, OpenAIResponsesModel } from "./policy.js";

const snapshot: AgentPolicySnapshot = {
	totalAssetsUsd: 10_000,
	shieldAssetsUsd: 8_000,
	liquidAssetsUsd: 2_000,
	targetShieldAssetsUsd: 8_500,
	currentHedgeNotionalUsd: 0,
	aaveSupplyApy: 4,
	bybitFundingApy: 8,
	liquidityScore: 100,
	marketRiskScore: 25,
	shieldMarketLive: true,
	alphaMarketLive: true,
};

const config = {
	maxHedgeNotionalUsd: 1_500,
	maxMarketRiskScore: 65,
	minFundingApy: 1,
	rebalanceDriftPercent: 1,
};

describe("AgentPolicy", () => {
	it("uses a deterministic policy when no model is configured", async () => {
		const decision = await new AgentPolicy(undefined, config).decide(snapshot);

		expect(decision.action).toBe("rebalance_and_hedge");
		expect(decision.targetHedgeNotionalUsd).toBe(1_500);
		expect(decision.source).toBe("deterministic");
	});

	it("caps a model hedge to the configured capital limit", async () => {
		const model: AgentModel = {
			name: "test-model",
			propose: vi.fn().mockResolvedValue({
				action: "hedge",
				targetHedgeNotionalUsd: 50_000,
				confidence: 0.99,
				riskScore: 1,
				reason: "Maximize positive carry.",
			}),
		};

		const decision = await new AgentPolicy(model, config).decide(snapshot);

		expect(decision.action).toBe("hedge");
		expect(decision.targetHedgeNotionalUsd).toBe(1_500);
		expect(decision.riskScore).toBe(25);
		expect(decision.safetyChecks).toContain(
			"Hedge notional capped by liquid assets and operator limit.",
		);
	});

	it("blocks hedging when funding carry is negative", async () => {
		const model: AgentModel = {
			name: "test-model",
			propose: vi.fn().mockResolvedValue({
				action: "hedge",
				targetHedgeNotionalUsd: 1_000,
				confidence: 0.9,
				riskScore: 20,
				reason: "Open a hedge.",
			}),
		};

		const decision = await new AgentPolicy(model, config).decide({
			...snapshot,
			bybitFundingApy: -5,
		});

		expect(decision.action).toBe("hold");
		expect(decision.targetHedgeNotionalUsd).toBe(0);
	});

	it("falls back when model output is invalid", async () => {
		const model: AgentModel = {
			name: "test-model",
			propose: vi.fn().mockRejectedValue(new Error("timeout")),
		};

		const decision = await new AgentPolicy(model, config).decide(snapshot);

		expect(decision.source).toBe("deterministic");
		expect(decision.safetyChecks[0]).toContain("timeout");
	});

	it("requests a strict structured proposal from OpenAI", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					output: [
						{
							content: [
								{
									type: "output_text",
									text: JSON.stringify({
										action: "hold",
										targetHedgeNotionalUsd: 0,
										confidence: 0.9,
										riskScore: 25,
										reason: "Funding is negative.",
									}),
								},
							],
						},
					],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);

		const model = new OpenAIResponsesModel("test-key", "test-model", "https://example.com/v1");
		const proposal = await model.propose(snapshot);
		const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
			store: boolean;
			text: { format: { type: string; strict: boolean } };
		};

		expect(proposal.action).toBe("hold");
		expect(request.store).toBe(false);
		expect(request.text.format).toMatchObject({ type: "json_schema", strict: true });
		fetchMock.mockRestore();
	});
});
