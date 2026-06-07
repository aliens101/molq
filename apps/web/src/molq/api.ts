import type { DashboardResponse } from "@molq/shared";

export async function getDashboard(): Promise<DashboardResponse> {
	return request("/api/dashboard");
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
