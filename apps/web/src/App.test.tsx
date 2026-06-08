import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import App from "./App";

vi.mock("@/molq/use-molq-vault", () => ({
	useMolqVault: () => ({
		address: undefined,
		isConnected: false,
		isWrongChain: false,
		isBusy: false,
		pendingAction: null,
		error: null,
		transactionHash: null,
		totalAssets: 0n,
		shieldAssets: 0n,
		liquidAssets: 0n,
		walletBalance: 0n,
		shareBalance: 0n,
		userAssets: 0n,
		connect: vi.fn(),
		disconnect: vi.fn(),
		switchToMantle: vi.fn(),
		deposit: vi.fn(),
		withdrawAll: vi.fn(),
		refresh: vi.fn().mockResolvedValue(undefined),
		formatUsde: (value: bigint) => String(value),
	}),
}));

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
					protocol: "Aave V3",
					market: "USDe",
					poolAddress: "0x458F293454fE0d67EC0655f3672301301DD51422",
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
				hedgeExecution: {
					configured: false,
					tradingEnabled: false,
					venue: "Bybit",
					symbol: "ETHUSDT",
					targetNotionalUsd: 0,
					currentShortQuantity: 0,
					currentShortNotionalUsd: 0,
					accountEquityUsd: 0,
					unrealizedPnlUsd: 0,
					message: "Bybit credentials are not configured.",
				},
				decisions: [],
			}),
		}),
	);
});

test("renders the MolQ portfolio and deposit workflow", async () => {
	render(<App />);
	expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
	expect(screen.getByRole("link", { name: /open deposit/i })).toBeInTheDocument();
	expect((await screen.findAllByText("0.00%")).length).toBeGreaterThan(0);

	fireEvent.click(screen.getAllByRole("link", { name: "Deposit" })[0]);
	expect(screen.getByRole("heading", { name: "Deposit" })).toBeInTheDocument();
	expect(screen.getAllByRole("button", { name: /connect wallet/i })).toHaveLength(2);
	expect(screen.getByRole("button", { name: /withdraw full position/i })).toBeDisabled();
});
