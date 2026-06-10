import { ponder } from "ponder:registry";
import {
	agent,
	agentIdentity,
	decision,
	vaultAccount,
	vaultEvent,
	vaultSnapshot,
	vaultState,
} from "ponder:schema";
import { MolqVaultAbi } from "../abis/MolqVaultAbi";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const molqAgentId = 112n;

ponder.on("IdentityRegistry:Registered", async ({ event, context }) => {
	if (event.args.agentId !== molqAgentId) return;

	await context.db.insert(agentIdentity).values({
		agentId: event.args.agentId,
		owner: event.args.owner,
		agentUri: event.args.agentURI,
		registeredAt: event.block.timestamp,
		updatedAt: event.block.timestamp,
		transactionHash: event.transaction.hash,
	});
});

ponder.on("IdentityRegistry:URIUpdated", async ({ event, context }) => {
	if (event.args.agentId !== molqAgentId) return;

	await context.db
		.insert(agentIdentity)
		.values({
			agentId: event.args.agentId,
			owner: event.args.updatedBy,
			agentUri: event.args.newURI,
			registeredAt: event.block.timestamp,
			updatedAt: event.block.timestamp,
			transactionHash: event.transaction.hash,
		})
		.onConflictDoUpdate((row) => ({
			...row,
			agentUri: event.args.newURI,
			updatedAt: event.block.timestamp,
			transactionHash: event.transaction.hash,
		}));
});

ponder.on("LegacyMolqDecisionLogger:AgentSet", async ({ event, context }) => {
	await context.db
		.insert(agent)
		.values({
			address: event.args.agent,
			allowed: event.args.allowed,
			decisionCount: 0n,
			totalAmount: 0n,
			lastDecisionId: null,
			updatedAt: event.block.timestamp,
		})
		.onConflictDoUpdate((row) => ({
			...row,
			allowed: event.args.allowed,
			updatedAt: event.block.timestamp,
		}));
});

ponder.on("LegacyMolqDecisionLogger:DecisionLogged", async ({ event, context }) => {
	await context.db.insert(decision).values({
		id: eventKey(event),
		decisionId: event.args.id,
		agent: event.args.agent,
		actionType: event.args.actionType,
		amount: event.args.amount,
		riskScoreBps: event.args.riskScoreBps,
		reasonHash: event.args.reasonHash,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
		logIndex: event.log.logIndex,
	});

	await context.db
		.insert(agent)
		.values({
			address: event.args.agent,
			allowed: true,
			decisionCount: 1n,
			totalAmount: event.args.amount,
			lastDecisionId: event.args.id,
			updatedAt: event.block.timestamp,
		})
		.onConflictDoUpdate((row) => ({
			decisionCount: row.decisionCount + 1n,
			totalAmount: row.totalAmount + event.args.amount,
			lastDecisionId: event.args.id,
			updatedAt: event.block.timestamp,
		}));
});

ponder.on("MolqDecisionLogger:AgentSet", async ({ event, context }) => {
	await context.db
		.insert(agent)
		.values({
			address: event.args.agent,
			allowed: event.args.allowed,
			decisionCount: 0n,
			totalAmount: 0n,
			lastDecisionId: null,
			updatedAt: event.block.timestamp,
		})
		.onConflictDoUpdate((row) => ({
			...row,
			allowed: event.args.allowed,
			updatedAt: event.block.timestamp,
		}));
});

ponder.on("MolqDecisionLogger:DecisionLogged", async ({ event, context }) => {
	await context.db.insert(decision).values({
		id: eventKey(event),
		decisionId: event.args.id,
		agent: event.args.agent,
		actionType: event.args.actionType,
		amount: event.args.amount,
		riskScoreBps: event.args.riskScoreBps,
		reasonHash: event.args.reasonHash,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
		logIndex: event.log.logIndex,
	});

	await context.db
		.insert(agent)
		.values({
			address: event.args.agent,
			allowed: true,
			decisionCount: 1n,
			totalAmount: event.args.amount,
			lastDecisionId: event.args.id,
			updatedAt: event.block.timestamp,
		})
		.onConflictDoUpdate((row) => ({
			decisionCount: row.decisionCount + 1n,
			totalAmount: row.totalAmount + event.args.amount,
			lastDecisionId: event.args.id,
			updatedAt: event.block.timestamp,
		}));
});

ponder.on("MolqVault:Deposit", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "deposit",
		user: event.args.owner,
		assets: event.args.assets,
		shares: event.args.shares,
	});
	await recordVaultSnapshot(context, event, "deposit");
});

ponder.on("MolqVault:Withdraw", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "withdraw",
		user: event.args.owner,
		assets: event.args.assets,
		shares: event.args.shares,
	});
	await recordVaultSnapshot(context, event, "withdraw");
});

ponder.on("MolqVault:Transfer", async ({ event, context }) => {
	if (event.args.from !== zeroAddress) {
		await context.db
			.insert(vaultAccount)
			.values({
				address: event.args.from,
				shares: 0n,
				updatedAt: event.block.timestamp,
			})
			.onConflictDoUpdate((row) => ({
				shares: row.shares - event.args.value,
				updatedAt: event.block.timestamp,
			}));
	}

	if (event.args.to !== zeroAddress) {
		await context.db
			.insert(vaultAccount)
			.values({
				address: event.args.to,
				shares: event.args.value,
				updatedAt: event.block.timestamp,
			})
			.onConflictDoUpdate((row) => ({
				shares: row.shares + event.args.value,
				updatedAt: event.block.timestamp,
			}));
	}
});

ponder.on("MolqVault:ShieldInvested", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "shield_invested",
		amount: event.args.assets,
	});
});

ponder.on("MolqVault:ShieldRedeemed", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "shield_redeemed",
		amount: event.args.assets,
	});
});

ponder.on("MolqVault:Rebalanced", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "rebalanced",
		shieldBalance: event.args.shieldAssets,
		alphaBalance: event.args.liquidAssets,
	});
	await recordVaultSnapshot(context, event, "rebalance");
});

ponder.on("MolqVault:ProfitHardened", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "profit_hardened",
		assets: event.args.grossProfit,
		amount: event.args.feeAssets,
		alphaBalance: event.args.netProfit,
	});
	await recordVaultSnapshot(context, event, "profit_hardened");
});

ponder.on("MolqVault:EmergencyExit", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "emergency_exit",
		assets: event.args.assets,
		shares: event.args.shares,
	});
	await recordVaultSnapshot(context, event, "emergency_exit");
});

ponder.on("MolqVault:KeeperUpdated", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "keeper_updated",
		user: event.args.newKeeper,
	});
});

ponder.on("MolqVault:ShieldTargetUpdated", async ({ event, context }) => {
	await insertVaultEvent(context, event, {
		type: "shield_target_updated",
		amount: event.args.newTargetBps,
	});
});

async function insertVaultEvent(
	context: Parameters<Parameters<typeof ponder.on>[1]>[0]["context"],
	event: Parameters<Parameters<typeof ponder.on>[1]>[0]["event"],
	values: {
		type: string;
		user?: `0x${string}`;
		assets?: bigint;
		shares?: bigint;
		amount?: bigint;
		shieldBalance?: bigint;
		alphaBalance?: bigint;
	},
) {
	await context.db.insert(vaultEvent).values({
		id: eventKey(event),
		type: values.type,
		user: values.user ?? null,
		assets: values.assets ?? null,
		shares: values.shares ?? null,
		amount: values.amount ?? null,
		shieldBalance: values.shieldBalance ?? null,
		alphaBalance: values.alphaBalance ?? null,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
		logIndex: event.log.logIndex,
	});
}

async function recordVaultSnapshot(
	context: Parameters<Parameters<typeof ponder.on>[1]>[0]["context"],
	event: Parameters<Parameters<typeof ponder.on>[1]>[0]["event"],
	trigger: string,
) {
	const address = event.log.address;
	const [totalAssets, shieldBalance, alphaBalance] = await Promise.all([
		context.client.readContract({
			address,
			abi: MolqVaultAbi,
			functionName: "totalAssets",
		}),
		context.client.readContract({
			address,
			abi: MolqVaultAbi,
			functionName: "shieldAssets",
		}),
		context.client.readContract({
			address,
			abi: MolqVaultAbi,
			functionName: "liquidAssets",
		}),
	]);
	const snapshot = {
		shieldBalance,
		alphaBalance,
		totalAssets,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
	};

	await context.db.insert(vaultSnapshot).values({
		id: eventKey(event),
		trigger,
		...snapshot,
	});
	await context.db
		.insert(vaultState)
		.values({ id: "latest", ...snapshot })
		.onConflictDoUpdate(snapshot);
}

function eventKey(event: { transaction: { hash: string }; log: { logIndex: number } }) {
	return `${event.transaction.hash}-${event.log.logIndex}`;
}
