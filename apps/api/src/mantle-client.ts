import { MANTLE_RPC_URL } from "@molq/shared";
import { fallback, http, type Transport } from "viem";

const DEFAULT_FALLBACK_URLS = [
	"https://mantle-rpc.publicnode.com",
	"https://mantle.drpc.org",
	"https://1rpc.io/mantle",
];

export function mantleTransport(): Transport {
	const configured = [
		process.env.MANTLE_RPC_URL,
		...(process.env.MANTLE_RPC_FALLBACK_URLS?.split(",") ?? []),
		MANTLE_RPC_URL,
		...DEFAULT_FALLBACK_URLS,
	]
		.map((url) => url?.trim())
		.filter((url): url is string => Boolean(url));
	const urls = [...new Set(configured)];

	return fallback(
		urls.map((url) =>
			http(url, {
				retryCount: 2,
				timeout: 8_000,
			}),
		),
		{ rank: true },
	);
}
