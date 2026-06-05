export const MolqVaultAbi = [
	{
		type: "event",
		name: "Deposited",
		inputs: [
			{ name: "user", type: "address", indexed: true },
			{ name: "assets", type: "uint256", indexed: false },
			{ name: "shares", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "Withdrawn",
		inputs: [
			{ name: "user", type: "address", indexed: true },
			{ name: "assets", type: "uint256", indexed: false },
			{ name: "shares", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "ProfitRecorded",
		inputs: [{ name: "amount", type: "uint256", indexed: false }],
		anonymous: false,
	},
	{
		type: "event",
		name: "BucketsUpdated",
		inputs: [
			{ name: "shieldBalance", type: "uint256", indexed: false },
			{ name: "alphaBalance", type: "uint256", indexed: false },
		],
		anonymous: false,
	},
] as const;
