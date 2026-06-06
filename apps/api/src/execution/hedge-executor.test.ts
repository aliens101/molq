import { describe, expect, it, vi } from "vitest";
import { BybitClient } from "./bybit-client.js";
import { BybitHedgeExecutor, roundDown } from "./hedge-executor.js";

describe("BybitHedgeExecutor", () => {
	it("rounds order quantities down to the instrument step", () => {
		expect(roundDown(1.237, 0.01)).toBeCloseTo(1.23);
	});

	it("refuses to trade while execution is disabled", async () => {
		const executor = new BybitHedgeExecutor({
			client: {} as BybitClient,
			tradingEnabled: false,
			maxNotionalUsd: 10_000,
			leverage: 1,
			slippagePercent: 0.5,
		});

		await expect(executor.reconcile(1_000, "cycle-1")).rejects.toThrow(
			"Bybit trading is disabled",
		);
	});

	it("submits only the short position delta", async () => {
		const client = {
			getInstrument: vi.fn().mockResolvedValue({
				symbol: "ETHUSDT",
				status: "Trading",
				lotSizeFilter: {
					minNotionalValue: "5",
					maxMktOrderQty: "100",
					minOrderQty: "0.01",
					qtyStep: "0.01",
				},
				leverageFilter: {
					minLeverage: "1",
					maxLeverage: "100",
					leverageStep: "0.01",
				},
			}),
			getTicker: vi.fn().mockResolvedValue({
				symbol: "ETHUSDT",
				markPrice: "2500",
				fundingRate: "0.0001",
			}),
			getPosition: vi
				.fn()
				.mockResolvedValueOnce({
					symbol: "ETHUSDT",
					side: "Sell",
					size: "0.10",
					avgPrice: "2500",
					markPrice: "2500",
					unrealisedPnl: "0",
					leverage: "1",
				})
				.mockResolvedValue({
					symbol: "ETHUSDT",
					side: "Sell",
					size: "0.40",
					avgPrice: "2500",
					markPrice: "2500",
					unrealisedPnl: "0",
					leverage: "1",
				}),
			getWalletBalance: vi.fn().mockResolvedValue({
				totalEquity: "1000",
				totalAvailableBalance: "900",
				totalPerpUPL: "0",
			}),
			setLeverage: vi.fn().mockResolvedValue(undefined),
			createOrder: vi.fn().mockResolvedValue({
				orderId: "order-1",
				orderLinkId: "molq-test",
			}),
		};
		const executor = new BybitHedgeExecutor({
			client: client as unknown as BybitClient,
			tradingEnabled: true,
			maxNotionalUsd: 10_000,
			leverage: 1,
			slippagePercent: 0.5,
		});

		const status = await executor.reconcile(1_000, "cycle-1");

		expect(client.createOrder).toHaveBeenCalledWith(
			expect.objectContaining({ side: "Sell", qty: "0.30", reduceOnly: false }),
		);
		expect(status.lastOrderId).toBe("order-1");
	});
});
