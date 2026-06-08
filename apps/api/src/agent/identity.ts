import {
	ERC8004_IDENTITY_REGISTRY,
	MANTLE_RPC_URL,
	MOLQ_AGENT_ID,
	type AgentIdentity,
} from "@molq/shared";
import { createPublicClient, http, type PublicClient } from "viem";
import { mantle } from "viem/chains";

const identityRegistryAbi = [
	{
		type: "function",
		name: "ownerOf",
		stateMutability: "view",
		inputs: [{ name: "agentId", type: "uint256" }],
		outputs: [{ type: "address" }],
	},
	{
		type: "function",
		name: "tokenURI",
		stateMutability: "view",
		inputs: [{ name: "agentId", type: "uint256" }],
		outputs: [{ type: "string" }],
	},
	{
		type: "function",
		name: "getAgentWallet",
		stateMutability: "view",
		inputs: [{ name: "agentId", type: "uint256" }],
		outputs: [{ type: "address" }],
	},
] as const;

interface RegistrationFile {
	name?: string;
	description?: string;
	active?: boolean;
}

export async function getAgentIdentity(
	client: PublicClient = createPublicClient({
		chain: mantle,
		transport: http(process.env.MANTLE_RPC_URL ?? MANTLE_RPC_URL),
	}),
): Promise<AgentIdentity> {
	const agentId = BigInt(process.env.MOLQ_AGENT_ID ?? MOLQ_AGENT_ID);
	const [owner, agentWallet, agentUri] = await Promise.all([
		client.readContract({
			address: ERC8004_IDENTITY_REGISTRY,
			abi: identityRegistryAbi,
			functionName: "ownerOf",
			args: [agentId],
		}),
		client.readContract({
			address: ERC8004_IDENTITY_REGISTRY,
			abi: identityRegistryAbi,
			functionName: "getAgentWallet",
			args: [agentId],
		}),
		client.readContract({
			address: ERC8004_IDENTITY_REGISTRY,
			abi: identityRegistryAbi,
			functionName: "tokenURI",
			args: [agentId],
		}),
	]);
	const registration = decodeRegistrationFile(agentUri);

	return {
		agentId: agentId.toString(),
		registry: ERC8004_IDENTITY_REGISTRY,
		owner,
		agentWallet,
		agentUri,
		name: registration.name ?? "MolQ",
		description: registration.description ?? "",
		active: registration.active ?? true,
		registered: true,
	};
}

function decodeRegistrationFile(agentUri: string): RegistrationFile {
	const prefix = "data:application/json;base64,";
	if (!agentUri.startsWith(prefix)) return {};

	try {
		return JSON.parse(Buffer.from(agentUri.slice(prefix.length), "base64").toString("utf8"));
	} catch {
		return {};
	}
}
