import "dotenv/config";

const intervalMs = Number(process.env.MOLQ_MONITOR_INTERVAL_MS ?? 60_000);
const deepHealthUrl =
	process.env.MOLQ_MONITOR_HEALTH_URL ?? "http://127.0.0.1:8070/api/health/deep";
const webhookUrl = process.env.MOLQ_ALERT_WEBHOOK_URL;
let lastState: "healthy" | "degraded" | undefined;

async function check() {
	let state: "healthy" | "degraded" = "degraded";
	let detail = "Health request failed";
	try {
		const response = await fetch(deepHealthUrl, { signal: AbortSignal.timeout(15_000) });
		const payload = (await response.json()) as {
			healthy?: boolean;
			checks?: Record<string, { ok: boolean; message: string }>;
		};
		state = response.ok && payload.healthy ? "healthy" : "degraded";
		detail = Object.entries(payload.checks ?? {})
			.map(([name, value]) => `${name}: ${value.ok ? "ok" : value.message}`)
			.join(", ");
	} catch (error) {
		detail = error instanceof Error ? error.message : detail;
	}

	if (state !== lastState) {
		console.log(`[monitor] ${state}: ${detail}`);
		if (lastState !== undefined || state === "degraded") {
			await alertWebhook(state, detail);
		}
		lastState = state;
	}
}

async function alertWebhook(state: "healthy" | "degraded", detail: string) {
	if (!webhookUrl) return;
	try {
		await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: `MolQ production is ${state}: ${detail}`,
				text: `MolQ production is ${state}: ${detail}`,
			}),
			signal: AbortSignal.timeout(8_000),
		});
	} catch (error) {
		console.error("[monitor] webhook failed", error);
	}
}

void check();
setInterval(() => void check(), intervalMs);
