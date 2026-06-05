import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import App from "./App";

beforeEach(() => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				portfolio: {
					balance: 0,
					deposited: 0,
					realizedProfit: 0,
					shieldBalance: 0,
					alphaBalance: 0,
					allocation: { shieldPercent: 85, alphaPercent: 15 },
					riskMode: "balanced",
				},
				market: {
					mantleYieldApy: 5.4,
					fundingApy: 8.1,
					estimatedNetApy: 11.4,
					hedgeRatio: 98,
					liquidityScore: 92,
					riskScore: 28,
					updatedAt: new Date().toISOString(),
				},
				shieldMarket: {
					protocol: "INIT Capital",
					market: "USDe",
					poolAddress: "0x3282437C436eE6AA9861a6A46ab0822d82581b1c",
					underlyingToken: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
					supplyRateE18: "1700000000",
					estimatedSupplyApy: 5.36,
					availableLiquidity: "113455",
					totalAssets: "139526",
					status: "live",
					updatedAt: new Date().toISOString(),
				},
				alphaMarket: {
					protocol: "Bybit",
					market: "ETHUSDT",
					fundingRate: 0.00008,
					estimatedFundingApy: 8.76,
					markPrice: 3600,
					status: "live",
					updatedAt: new Date().toISOString(),
				},
				decisions: [],
			}),
		}),
	);
});

test("renders the MolQ portfolio and deposit workflow", async () => {
	render(<App />);
	expect(screen.getByText("Portfolio")).toBeInTheDocument();
	expect(screen.getByRole("button", { name: /deposit and allocate/i })).toBeInTheDocument();
	expect(await screen.findByText("11.40%")).toBeInTheDocument();
	expect(screen.getByText("INIT Capital")).toBeInTheDocument();
	expect(screen.getByText("Bybit")).toBeInTheDocument();
});
