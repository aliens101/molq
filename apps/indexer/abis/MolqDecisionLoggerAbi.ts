export const MolqDecisionLoggerAbi = [
	{
		type: "event",
		name: "AgentSet",
		inputs: [
			{ name: "agent", type: "address", indexed: true },
			{ name: "allowed", type: "bool", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "DecisionLogged",
		inputs: [
			{ name: "id", type: "uint256", indexed: true },
			{ name: "agent", type: "address", indexed: true },
			{ name: "actionType", type: "uint8", indexed: false },
			{ name: "amount", type: "uint256", indexed: false },
			{ name: "riskScoreBps", type: "uint256", indexed: false },
			{ name: "reasonHash", type: "bytes32", indexed: false },
		],
		anonymous: false,
	},
] as const;
