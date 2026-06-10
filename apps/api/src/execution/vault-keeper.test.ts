import { describe, expect, it } from "vitest";
import { calculateProfitDistribution } from "./vault-keeper.js";

describe("vault profit hardening", () => {
	it("charges the configured fee only on gross realized profit", () => {
		expect(calculateProfitDistribution(100, 1_000)).toEqual({
			grossProfitUsd: 100,
			feeUsd: 10,
			netProfitUsd: 90,
		});
	});

	it("does not apply a principal-based fee", () => {
		const distribution = calculateProfitDistribution(0.2, 1_000);
		expect(distribution.feeUsd).toBeCloseTo(0.02);
		expect(distribution.netProfitUsd).toBeCloseTo(0.18);
	});
});
