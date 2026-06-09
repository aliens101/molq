import { AAVE_MANTLE_USDE_ATOKEN, MANTLE_USDE } from "@molq/shared";

export const MOLQ_VAULT = "0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9";
export const USDE = MANTLE_USDE;
export const AAVE_USDE = AAVE_MANTLE_USDE_ATOKEN;

export const erc20Abi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "allowance",
		stateMutability: "view",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
] as const;

export const molqVaultAbi = [
	...erc20Abi,
	{
		type: "function",
		name: "deposit",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "assets", type: "uint256" },
			{ name: "receiver", type: "address" },
		],
		outputs: [{ name: "shares", type: "uint256" }],
	},
	{
		type: "function",
		name: "redeem",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "shares", type: "uint256" },
			{ name: "receiver", type: "address" },
			{ name: "owner", type: "address" },
		],
		outputs: [{ name: "assets", type: "uint256" }],
	},
	{
		type: "function",
		name: "convertToAssets",
		stateMutability: "view",
		inputs: [{ name: "shares", type: "uint256" }],
		outputs: [{ name: "assets", type: "uint256" }],
	},
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
] as const;
