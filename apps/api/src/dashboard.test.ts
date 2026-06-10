import { describe, expect, it } from "vitest";
import { projectStrategyApy } from "./dashboard.js";

describe("strategy APY projection", () => {
	it("does not charge funding carry when no hedge is open", () => {
		expect(projectStrategyApy(0.61, -5.71, 0.2, 0.17, 0.03, 0)).toEqual({
			estimatedNetApy: 0.52,
			targetNetApy: -0.34,
			shieldContributionApy: 0.52,
			hedgeContributionApy: 0,
			hedgeRatio: 0,
		});
	});

	it("includes funding carry only for actual short exposure", () => {
		expect(projectStrategyApy(0.61, 8, 0.2, 0.17, 0.03, 0.015)).toEqual({
			estimatedNetApy: 1.12,
			targetNetApy: 1.72,
			shieldContributionApy: 0.52,
			hedgeContributionApy: 0.6,
			hedgeRatio: 50,
		});
	});
});
