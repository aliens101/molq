import { describe, expect, it } from "vitest";
import { annualizeEightHourFunding } from "./bybit.js";
import { annualizePerSecondRate } from "./init.js";

describe("protocol market rates", () => {
	it("annualizes INIT's per-second e18 supply rate", () => {
		expect(annualizePerSecondRate(1_000_000_000n)).toBe(3.1536);
	});

	it("annualizes Bybit's eight-hour funding rate", () => {
		expect(annualizeEightHourFunding(0.0001)).toBe(10.95);
	});
});
