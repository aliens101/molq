export const MolqVaultAbi = [
	{
		type: "function",
		name: "totalAssets",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "shieldAssets",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "liquidAssets",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "event",
		name: "Deposit",
		inputs: [
			{ name: "sender", type: "address", indexed: true },
			{ name: "owner", type: "address", indexed: true },
			{ name: "assets", type: "uint256", indexed: false },
			{ name: "shares", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "Withdraw",
		inputs: [
			{ name: "sender", type: "address", indexed: true },
			{ name: "receiver", type: "address", indexed: true },
			{ name: "owner", type: "address", indexed: true },
			{ name: "assets", type: "uint256", indexed: false },
			{ name: "shares", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "ShieldInvested",
		inputs: [{ name: "assets", type: "uint256", indexed: false }],
		anonymous: false,
	},
	{
		type: "event",
		name: "ShieldRedeemed",
		inputs: [{ name: "assets", type: "uint256", indexed: false }],
		anonymous: false,
	},
	{
		type: "event",
		name: "Rebalanced",
		inputs: [
			{ name: "shieldAssets", type: "uint256", indexed: false },
			{ name: "liquidAssets", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "ProfitHardened",
		inputs: [
			{ name: "grossProfit", type: "uint256", indexed: false },
			{ name: "feeAssets", type: "uint256", indexed: false },
			{ name: "netProfit", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "EmergencyExit",
		inputs: [
			{ name: "shares", type: "uint256", indexed: false },
			{ name: "assets", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "KeeperUpdated",
		inputs: [
			{ name: "previousKeeper", type: "address", indexed: true },
			{ name: "newKeeper", type: "address", indexed: true },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "ShieldTargetUpdated",
		inputs: [
			{ name: "previousTargetBps", type: "uint256", indexed: false },
			{ name: "newTargetBps", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
] as const;
