import type {
	AgentIdentity,
	AgentPolicyDecision,
	DashboardResponse,
	PerformanceHistory,
} from "@molq/shared";

export interface AgentStatusResponse {
	enabled: boolean;
	running: boolean;
	intervalMs: number;
	modelConfigured: boolean;
	logger: {
		configured: boolean;
		enabled: boolean;
		authorized: boolean;
		agentAddress?: `0x${string}`;
		lastTransactionHash?: `0x${string}`;
		message: string;
	};
	identity: AgentIdentity;
	lastRun?: {
		decision: AgentPolicyDecision;
		vaultTransactionHash?: string;
		hedgeOrderId?: string;
		decisionTransactionHash?: string;
		errors: string[];
		completedAt: string;
	};
	history: Array<{
		decision: AgentPolicyDecision;
		vaultTransactionHash?: string;
		hedgeOrderId?: string;
		decisionTransactionHash?: string;
		errors: string[];
		completedAt: string;
	}>;
}

export async function getDashboard(): Promise<DashboardResponse> {
	return request<DashboardResponse>("/api/dashboard");
}

export async function getAgentStatus(): Promise<AgentStatusResponse> {
	return request<AgentStatusResponse>("/api/agent/status");
}

export async function getPerformanceHistory(): Promise<PerformanceHistory> {
	return request<PerformanceHistory>("/api/history");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		headers: { "Content-Type": "application/json" },
		...init,
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { error?: string } | null;
		throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
	}

	return response.json() as Promise<T>;
}
