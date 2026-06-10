import {
	createPublicClient,
	createWalletClient,
	encodeFunctionData,
	zeroAddress,
	type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantle } from "viem/chains";
import { mantleTransport } from "../apps/api/src/mantle-client.js";

const safeAbi = [
	{
		type: "function",
		name: "nonce",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "execTransaction",
		stateMutability: "payable",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "data", type: "bytes" },
			{ name: "operation", type: "uint8" },
			{ name: "safeTxGas", type: "uint256" },
			{ name: "baseGas", type: "uint256" },
			{ name: "gasPrice", type: "uint256" },
			{ name: "gasToken", type: "address" },
			{ name: "refundReceiver", type: "address" },
			{ name: "signatures", type: "bytes" },
		],
		outputs: [{ name: "success", type: "bool" }],
	},
] as const;
const acceptOwnershipAbi = [
	{
		type: "function",
		name: "acceptOwnership",
		stateMutability: "nonpayable",
		inputs: [],
		outputs: [],
	},
] as const;

async function main() {
	const safe = requiredAddress("MOLQ_SAFE_ADDRESS");
	const target = requiredAddress("MOLQ_OWNABLE_TARGET");
	const privateKey = requiredHex("MOLQ_SAFE_OWNER_PRIVATE_KEY");
	const account = privateKeyToAccount(privateKey);
	const transport = mantleTransport();
	const publicClient = createPublicClient({ chain: mantle, transport });
	const walletClient = createWalletClient({ account, chain: mantle, transport });
	const nonce = await publicClient.readContract({
		address: safe,
		abi: safeAbi,
		functionName: "nonce",
	});
	const data = encodeFunctionData({
		abi: acceptOwnershipAbi,
		functionName: "acceptOwnership",
	});
	const message = {
		to: target,
		value: 0n,
		data,
		operation: 0,
		safeTxGas: 0n,
		baseGas: 0n,
		gasPrice: 0n,
		gasToken: zeroAddress,
		refundReceiver: zeroAddress,
		nonce,
	};
	const signature = await account.signTypedData({
		domain: {
			chainId: mantle.id,
			verifyingContract: safe,
		},
		types: {
			SafeTx: [
				{ name: "to", type: "address" },
				{ name: "value", type: "uint256" },
				{ name: "data", type: "bytes" },
				{ name: "operation", type: "uint8" },
				{ name: "safeTxGas", type: "uint256" },
				{ name: "baseGas", type: "uint256" },
				{ name: "gasPrice", type: "uint256" },
				{ name: "gasToken", type: "address" },
				{ name: "refundReceiver", type: "address" },
				{ name: "nonce", type: "uint256" },
			],
		},
		primaryType: "SafeTx",
		message,
	});
	const { request } = await publicClient.simulateContract({
		account,
		address: safe,
		abi: safeAbi,
		functionName: "execTransaction",
		args: [
			message.to,
			message.value,
			message.data,
			message.operation,
			message.safeTxGas,
			message.baseGas,
			message.gasPrice,
			message.gasToken,
			message.refundReceiver,
			signature,
		],
	});
	const hash = await walletClient.writeContract(request);
	const receipt = await publicClient.waitForTransactionReceipt({ hash });
	if (receipt.status !== "success") throw new Error("Safe ownership acceptance reverted");
	console.log(hash);
	process.exit(0);
}

function requiredAddress(name: string): `0x${string}` {
	const value = process.env[name];
	if (!value?.match(/^0x[0-9a-fA-F]{40}$/)) throw new Error(`${name} is invalid`);
	return value as `0x${string}`;
}

function requiredHex(name: string): Hex {
	const value = process.env[name];
	if (!value?.match(/^0x[0-9a-fA-F]{64}$/)) throw new Error(`${name} is invalid`);
	return value as Hex;
}

void main();
