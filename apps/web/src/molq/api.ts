import type { DashboardResponse, MolqRiskMode } from "@molq/shared";

export async function getDashboard(): Promise<DashboardResponse> {
	return request("/api/dashboard");
}

export async function deposit(amount: number, riskMode: MolqRiskMode): Promise<DashboardResponse> {
	return request("/api/deposit", {
		method: "POST",
		body: JSON.stringify({ amount, riskMode }),
	});
}

export async function runAgentCycle(): Promise<DashboardResponse> {
	return request("/api/cycle", { method: "POST" });
}

export async function resetSimulation(): Promise<DashboardResponse> {
	return request("/api/reset", { method: "POST" });
}

async function request(path: string, init?: RequestInit): Promise<DashboardResponse> {
	const response = await fetch(path, {
		headers: { "Content-Type": "application/json" },
		...init,
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { error?: string } | null;
		throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
	}

	return response.json() as Promise<DashboardResponse>;
}
