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
});
