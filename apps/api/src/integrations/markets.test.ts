import { describe, expect, it } from "vitest";
import { rayRateToApy } from "./aave.js";
import { annualizeEightHourFunding } from "./bybit.js";

describe("protocol market rates", () => {
	it("converts Aave's annualized ray liquidity rate to APY", () => {
		expect(rayRateToApy(50_000_000_000_000_000_000_000_000n)).toBe(5);
	});

	it("annualizes Bybit's eight-hour funding rate", () => {
		expect(annualizeEightHourFunding(0.0001)).toBe(10.95);
	});
});
