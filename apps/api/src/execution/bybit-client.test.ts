import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { BybitClient } from "./bybit-client.js";

describe("BybitClient", () => {
	it("signs authenticated requests with the V5 HMAC scheme", () => {
		const client = new BybitClient({
			apiKey: "key",
			apiSecret: "secret",
			now: () => 1_700_000_000_000,
		});
		const payload = "category=linear&symbol=ETHUSDT";
		const expected = createHmac("sha256", "secret")
			.update(`1700000000000key5000${payload}`)
			.digest("hex");

		expect(client.sign("1700000000000", payload)).toBe(expected);
	});

	it("sends signed private GET requests", async () => {
		const fetcher = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				retCode: 0,
				retMsg: "OK",
				result: { list: [] },
				time: 1_700_000_000_000,
			}),
		});
		const client = new BybitClient({
			apiKey: "key",
			apiSecret: "secret",
			fetcher,
			now: () => 1_700_000_000_000,
		});

		await client.getPosition("ETHUSDT");

		expect(fetcher).toHaveBeenCalledOnce();
		const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
		expect(init.headers).toMatchObject({
			"X-BAPI-API-KEY": "key",
			"X-BAPI-TIMESTAMP": "1700000000000",
		});
	});
});
