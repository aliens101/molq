import { randomUUID } from "node:crypto";
import type { AgentAction, AgentPolicyDecision, AgentPolicySnapshot } from "@molq/shared";
import { z } from "zod";

const proposalSchema = z.object({
	action: z.enum(["hold", "rebalance", "hedge", "rebalance_and_hedge"]),
	targetHedgeNotionalUsd: z.number().finite().nonnegative(),
	confidence: z.number().finite().min(0).max(1),
	riskScore: z.number().finite().min(0).max(100),
	reason: z.string().trim().min(1).max(280),
});

export type AgentProposal = z.infer<typeof proposalSchema>;

export interface AgentModel {
	readonly name: string;
	propose(snapshot: AgentPolicySnapshot): Promise<AgentProposal>;
}

export interface AgentPolicyConfig {
	maxHedgeNotionalUsd: number;
	maxMarketRiskScore: number;
	minFundingApy: number;
	rebalanceDriftPercent: number;
}

const defaultConfig: AgentPolicyConfig = {
	maxHedgeNotionalUsd: 10_000,
	maxMarketRiskScore: 65,
	minFundingApy: 1,
	rebalanceDriftPercent: 1,
};

export class AgentPolicy {
	constructor(
		private readonly model?: AgentModel,
		private readonly config: AgentPolicyConfig = defaultConfig,
	) {
		if (config.maxHedgeNotionalUsd <= 0) {
			throw new Error("Maximum hedge notional must be positive");
		}
	}

	static fromEnv(): AgentPolicy {
		const model = OpenAIResponsesModel.fromEnv();
		return new AgentPolicy(model, {
			maxHedgeNotionalUsd: Number(process.env.BYBIT_MAX_NOTIONAL_USD ?? 10_000),
			maxMarketRiskScore: Number(process.env.MOLQ_AGENT_MAX_RISK_SCORE ?? 65),
			minFundingApy: Number(process.env.MOLQ_AGENT_MIN_FUNDING_APY ?? 1),
			rebalanceDriftPercent: Number(process.env.MOLQ_AGENT_REBALANCE_DRIFT_PERCENT ?? 1),
		});
	}

	async decide(snapshot: AgentPolicySnapshot): Promise<AgentPolicyDecision> {
		const fallback = deterministicProposal(snapshot, this.config);
		let proposal = fallback;
		let source: AgentPolicyDecision["source"] = "deterministic";
		const safetyChecks: string[] = [];

		if (this.model) {
			try {
				proposal = proposalSchema.parse(await this.model.propose(snapshot));
				source = "model";
			} catch {
				safetyChecks.push("Model unavailable or invalid; deterministic policy used.");
			}
		}

		const constrained = constrainProposal(proposal, snapshot, this.config, safetyChecks);
		return {
			id: randomUUID(),
			...constrained,
			source,
			model: source === "model" ? this.model?.name : undefined,
			safetyChecks,
			createdAt: new Date().toISOString(),
		};
	}
}

export class OpenAIResponsesModel implements AgentModel {
	constructor(
		private readonly apiKey: string,
		readonly name = "gpt-5.4-mini",
		private readonly baseUrl = "https://api.openai.com/v1",
	) {}

	static fromEnv(): OpenAIResponsesModel | undefined {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) return undefined;
		return new OpenAIResponsesModel(
			apiKey,
			process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
			process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
		);
	}

	async propose(snapshot: AgentPolicySnapshot): Promise<AgentProposal> {
		const response = await fetch(`${this.baseUrl}/responses`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: this.name,
				instructions:
					"You are MolQ's portfolio strategist. Return only JSON. Preserve principal, prefer positive carry, and choose one action: hold, rebalance, hedge, or rebalance_and_hedge.",
				input: `Evaluate this live portfolio snapshot: ${JSON.stringify(snapshot)}. Return {action,targetHedgeNotionalUsd,confidence,riskScore,reason}.`,
			}),
			signal: AbortSignal.timeout(20_000),
		});
		if (!response.ok) {
			throw new Error(`OpenAI request failed with ${response.status}`);
		}

		const body = (await response.json()) as OpenAIResponse;
		const text = extractOutputText(body);
		return proposalSchema.parse(JSON.parse(stripCodeFence(text)));
	}
}

interface OpenAIResponse {
	output_text?: string;
	output?: Array<{
		content?: Array<{ type?: string; text?: string }>;
	}>;
}

function extractOutputText(response: OpenAIResponse): string {
	if (response.output_text) return response.output_text;
	for (const item of response.output ?? []) {
		for (const content of item.content ?? []) {
			if (content.type === "output_text" && content.text) return content.text;
		}
	}
	throw new Error("Model returned no text");
}

function stripCodeFence(value: string): string {
	return value
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/, "");
}

function deterministicProposal(
	snapshot: AgentPolicySnapshot,
	config: AgentPolicyConfig,
): AgentProposal {
	const rebalance = needsRebalance(snapshot, config);
	const hedge =
		snapshot.alphaMarketLive &&
		snapshot.bybitFundingApy >= config.minFundingApy &&
		snapshot.marketRiskScore <= config.maxMarketRiskScore &&
		snapshot.liquidAssetsUsd > 0;
	const action: AgentAction =
		rebalance && hedge
			? "rebalance_and_hedge"
			: rebalance
				? "rebalance"
				: hedge
					? "hedge"
					: "hold";

	return {
		action,
		targetHedgeNotionalUsd: hedge ? snapshot.liquidAssetsUsd : 0,
		confidence: snapshot.shieldMarketLive && snapshot.alphaMarketLive ? 0.8 : 0.55,
		riskScore: snapshot.marketRiskScore,
		reason: hedge
			? "Positive funding supports a capped short hedge against the liquid allocation."
			: rebalance
				? "Vault allocation drift exceeds policy tolerance."
				: "Carry or market quality does not justify an execution.",
	};
}

function constrainProposal(
	proposal: AgentProposal,
	snapshot: AgentPolicySnapshot,
	config: AgentPolicyConfig,
	safetyChecks: string[],
): AgentProposal {
	const canRebalance = needsRebalance(snapshot, config);
	const canHedge =
		snapshot.shieldMarketLive &&
		snapshot.alphaMarketLive &&
		snapshot.bybitFundingApy >= config.minFundingApy &&
		snapshot.marketRiskScore <= config.maxMarketRiskScore &&
		snapshot.liquidityScore >= 50;
	const wantsRebalance =
		proposal.action === "rebalance" || proposal.action === "rebalance_and_hedge";
	const wantsHedge = proposal.action === "hedge" || proposal.action === "rebalance_and_hedge";

	if (wantsRebalance && !canRebalance) {
		safetyChecks.push("Rebalance removed because allocation drift is below tolerance.");
	}
	if (wantsHedge && !canHedge) {
		safetyChecks.push("Hedge removed because carry, risk, or market freshness failed.");
	}

	const rebalance = wantsRebalance && canRebalance;
	const hedge = wantsHedge && canHedge;
	const action: AgentAction =
		rebalance && hedge
			? "rebalance_and_hedge"
			: rebalance
				? "rebalance"
				: hedge
					? "hedge"
					: "hold";
	const hedgeLimit = Math.max(0, Math.min(snapshot.liquidAssetsUsd, config.maxHedgeNotionalUsd));
	const targetHedgeNotionalUsd = hedge
		? Math.min(proposal.targetHedgeNotionalUsd, hedgeLimit)
		: 0;
	if (targetHedgeNotionalUsd < proposal.targetHedgeNotionalUsd) {
		safetyChecks.push("Hedge notional capped by liquid assets and operator limit.");
	}

	return {
		...proposal,
		action,
		targetHedgeNotionalUsd,
		riskScore: snapshot.marketRiskScore,
		reason:
			action === proposal.action
				? proposal.reason
				: `${proposal.reason} Safety policy reduced the action to ${action}.`,
	};
}

function needsRebalance(snapshot: AgentPolicySnapshot, config: AgentPolicyConfig): boolean {
	const drift = Math.abs(snapshot.shieldAssetsUsd - snapshot.targetShieldAssetsUsd);
	const threshold = Math.max(1, (snapshot.totalAssetsUsd * config.rebalanceDriftPercent) / 100);
	return snapshot.shieldMarketLive && drift >= threshold;
}
