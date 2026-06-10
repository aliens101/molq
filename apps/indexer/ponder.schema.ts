import { onchainTable } from "ponder";

export const agentIdentity = onchainTable("agent_identity", (t) => ({
	agentId: t.bigint().primaryKey(),
	owner: t.hex().notNull(),
	agentUri: t.text().notNull(),
	registeredAt: t.bigint().notNull(),
	updatedAt: t.bigint().notNull(),
	transactionHash: t.hex().notNull(),
}));

export const agent = onchainTable("agent", (t) => ({
	address: t.hex().primaryKey(),
	allowed: t.boolean().notNull(),
	decisionCount: t.bigint().notNull(),
	totalAmount: t.bigint().notNull(),
	lastDecisionId: t.bigint(),
	updatedAt: t.bigint().notNull(),
}));

export const decision = onchainTable("decision", (t) => ({
	id: t.text().primaryKey(),
	decisionId: t.bigint().notNull(),
	agent: t.hex().notNull(),
	actionType: t.integer().notNull(),
	amount: t.bigint().notNull(),
	riskScoreBps: t.bigint().notNull(),
	reasonHash: t.hex().notNull(),
	blockNumber: t.bigint().notNull(),
	blockTimestamp: t.bigint().notNull(),
	transactionHash: t.hex().notNull(),
	logIndex: t.integer().notNull(),
}));

export const vaultEvent = onchainTable("vault_event", (t) => ({
	id: t.text().primaryKey(),
	type: t.text().notNull(),
	user: t.hex(),
	assets: t.bigint(),
	shares: t.bigint(),
	amount: t.bigint(),
	shieldBalance: t.bigint(),
	alphaBalance: t.bigint(),
	blockNumber: t.bigint().notNull(),
	blockTimestamp: t.bigint().notNull(),
	transactionHash: t.hex().notNull(),
	logIndex: t.integer().notNull(),
}));

export const vaultAccount = onchainTable("vault_account", (t) => ({
	address: t.hex().primaryKey(),
	shares: t.bigint().notNull(),
	updatedAt: t.bigint().notNull(),
}));

export const vaultSnapshot = onchainTable("vault_snapshot", (t) => ({
	id: t.text().primaryKey(),
	trigger: t.text().notNull(),
	shieldBalance: t.bigint().notNull(),
	alphaBalance: t.bigint().notNull(),
	totalAssets: t.bigint().notNull(),
	blockNumber: t.bigint().notNull(),
	blockTimestamp: t.bigint().notNull(),
	transactionHash: t.hex().notNull(),
}));

export const vaultState = onchainTable("vault_state", (t) => ({
	id: t.text().primaryKey(),
	shieldBalance: t.bigint().notNull(),
	alphaBalance: t.bigint().notNull(),
	totalAssets: t.bigint().notNull(),
	blockNumber: t.bigint().notNull(),
	blockTimestamp: t.bigint().notNull(),
	transactionHash: t.hex().notNull(),
}));
