import { describe, expect, test } from "vitest";
import { MolqStrategyEngine } from "./strategy.js";

describe("MolqStrategyEngine", () => {
	test("allocates a balanced deposit and hardens cycle profit", () => {
		const engine = new MolqStrategyEngine();
		const deposited = engine.deposit(1_000, "balanced");

		expect(deposited.portfolio.shieldBalance).toBe(850);
		expect(deposited.portfolio.alphaBalance).toBe(150);

		const cycled = engine.runCycle();
		expect(cycled.portfolio.balance).toBeGreaterThan(1_000);
		expect(cycled.portfolio.realizedProfit).toBeGreaterThan(0);
		expect(cycled.portfolio.shieldBalance).toBeGreaterThan(850);
		expect(cycled.decisions[0].action).toBe("harden");
	});

	test("resets portfolio state", () => {
		const engine = new MolqStrategyEngine();
		engine.deposit(250, "growth");
		const reset = engine.reset();

		expect(reset.portfolio.balance).toBe(0);
		expect(reset.portfolio.riskMode).toBe("balanced");
	});
});
