import { ponder } from "ponder:registry";
import { agent, decision, vaultEvent, vaultSnapshot } from "ponder:schema";

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

ponder.on("MolqVault:Deposited", async ({ event, context }) => {
	await context.db.insert(vaultEvent).values({
		id: eventKey(event),
		type: "deposit",
		user: event.args.user,
		assets: event.args.assets,
		shares: event.args.shares,
		amount: null,
		shieldBalance: null,
		alphaBalance: null,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
		logIndex: event.log.logIndex,
	});
});

ponder.on("MolqVault:Withdrawn", async ({ event, context }) => {
	await context.db.insert(vaultEvent).values({
		id: eventKey(event),
		type: "withdraw",
		user: event.args.user,
		assets: event.args.assets,
		shares: event.args.shares,
		amount: null,
		shieldBalance: null,
		alphaBalance: null,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
		logIndex: event.log.logIndex,
	});
});

ponder.on("MolqVault:ProfitRecorded", async ({ event, context }) => {
	await context.db.insert(vaultEvent).values({
		id: eventKey(event),
		type: "profit_recorded",
		user: null,
		assets: null,
		shares: null,
		amount: event.args.amount,
		shieldBalance: null,
		alphaBalance: null,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
		logIndex: event.log.logIndex,
	});
});

ponder.on("MolqVault:BucketsUpdated", async ({ event, context }) => {
	const totalAssets = event.args.shieldBalance + event.args.alphaBalance;

	await context.db.insert(vaultEvent).values({
		id: eventKey(event),
		type: "buckets_updated",
		user: null,
		assets: null,
		shares: null,
		amount: null,
		shieldBalance: event.args.shieldBalance,
		alphaBalance: event.args.alphaBalance,
		blockNumber: event.block.number,
		blockTimestamp: event.block.timestamp,
		transactionHash: event.transaction.hash,
		logIndex: event.log.logIndex,
	});

	await context.db
		.insert(vaultSnapshot)
		.values({
			id: "latest",
			shieldBalance: event.args.shieldBalance,
			alphaBalance: event.args.alphaBalance,
			totalAssets,
			blockNumber: event.block.number,
			blockTimestamp: event.block.timestamp,
			transactionHash: event.transaction.hash,
		})
		.onConflictDoUpdate({
			shieldBalance: event.args.shieldBalance,
			alphaBalance: event.args.alphaBalance,
			totalAssets,
			blockNumber: event.block.number,
			blockTimestamp: event.block.timestamp,
			transactionHash: event.transaction.hash,
		});
});

function eventKey(event: { transaction: { hash: string }; log: { logIndex: number } }) {
	return `${event.transaction.hash}-${event.log.logIndex}`;
}
