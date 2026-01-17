import { createClient, abi } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";
import { createPublicClient, http, encodeFunctionData, parseEventLogs, type Address, type Hex } from "viem";
import { GENLAYER_CONFIG } from "./config";

const { calldata, transactions } = abi;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

// Consensus contract ABI (minimal - just what we need)
const CONSENSUS_ABI = [
  {
    inputs: [
      { name: "_sender", type: "address" },
      { name: "_recipient", type: "address" },
      { name: "_numOfInitialValidators", type: "uint256" },
      { name: "_maxRotations", type: "uint256" },
      { name: "_txData", type: "bytes" },
    ],
    name: "addTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "txId", type: "bytes32" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: true, name: "activator", type: "address" },
    ],
    name: "NewTransaction",
    type: "event",
  },
] as const;

// StudioNet consensus contract address
const CONSENSUS_CONTRACT = "0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575";

// Create a read-only client
export function createReadClient() {
  return createClient({
    chain: studionet,
  });
}

// Direct RPC call for reading contract state (bypasses genlayer-js potential issues)
async function directReadContract<T>(
  functionName: string,
  args: CalldataEncodable[] = []
): Promise<T> {
  const calldataObj = calldata.makeCalldataObject(functionName, args, undefined);
  const encodedCalldata = calldata.encode(calldataObj);

  // Ensure data is a hex string with 0x prefix
  const hexData = typeof encodedCalldata === 'string'
    ? (encodedCalldata.startsWith('0x') ? encodedCalldata : `0x${encodedCalldata}`)
    : `0x${Buffer.from(encodedCalldata).toString('hex')}`;

  const requestBody = {
    jsonrpc: "2.0",
    method: "gen_call",
    params: [{
      to: GENLAYER_CONFIG.contractAddress,
      data: hexData,
    }],
    id: Date.now(),
  };

  console.log(`[RPC] Calling ${functionName}:`, { ...requestBody, params: [{ to: requestBody.params[0].to, dataLength: hexData.length }] });

  const response = await fetch(GENLAYER_CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();
  console.log(`[RPC] Response for ${functionName}:`, result);

  if (result.error) {
    console.error(`[RPC] Error details:`, JSON.stringify(result.error, null, 2));
    throw new Error(result.error.message || JSON.stringify(result.error) || "RPC call failed");
  }

  return result.result as T;
}

// Create a viem public client for waiting on receipts
function createViemPublicClient() {
  return createPublicClient({
    chain: studionet,
    transport: http(GENLAYER_CONFIG.rpcUrl),
  });
}

// Helper to send write transactions via MetaMask
// This bypasses genlayer-js's prepareTransactionRequest which calls unsupported eth_fillTransaction
async function sendWriteTransaction(
  contractAddress: Address,
  functionName: string,
  args: CalldataEncodable[]
): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_accounts",
  })) as Address[];

  if (!accounts || accounts.length === 0) {
    throw new Error("Wallet not connected");
  }

  const senderAddress = accounts[0];

  // Encode the contract call data using genlayer-js encoding
  const calldataObj = calldata.makeCalldataObject(functionName, args, undefined);
  const encodedCalldata = calldata.encode(calldataObj);
  const serializedData = transactions.serialize([encodedCalldata, false]) as Hex;

  // Encode the addTransaction call to the consensus contract
  const txData = encodeFunctionData({
    abi: CONSENSUS_ABI,
    functionName: "addTransaction",
    args: [
      senderAddress,
      contractAddress,
      BigInt(5), // numOfInitialValidators
      BigInt(3), // maxRotations
      serializedData,
    ],
  });

  // Send transaction via MetaMask
  const txHash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: senderAddress,
        to: CONSENSUS_CONTRACT,
        data: txData,
        gas: "0x7A120", // 500000
      },
    ],
  })) as Hex;

  // Wait for the transaction receipt
  const publicClient = createViemPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status === "reverted") {
    throw new Error("Transaction reverted");
  }

  // Parse the NewTransaction event to get the GenLayer transaction ID
  const logs = parseEventLogs({
    abi: CONSENSUS_ABI,
    eventName: "NewTransaction",
    logs: receipt.logs,
  });

  if (logs.length === 0) {
    throw new Error("Transaction not processed by consensus");
  }

  return logs[0].args.txId;
}

// Add GenLayer StudioNet to wallet
async function addGenLayerNetwork(): Promise<void> {
  const chainIdHex = `0x${GENLAYER_CONFIG.chainId.toString(16)}`;

  await window.ethereum!.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: chainIdHex,
        chainName: "GenLayer StudioNet",
        rpcUrls: [GENLAYER_CONFIG.rpcUrl],
        nativeCurrency: {
          name: "GEN",
          symbol: "GEN",
          decimals: 18,
        },
        blockExplorerUrls: ["https://genlayer-explorer.vercel.app"],
      },
    ],
  });
}

// Connect to MetaMask and get the account
export async function connectWallet(): Promise<Address> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as Address[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found");
  }

  const chainIdHex = `0x${GENLAYER_CONFIG.chainId.toString(16)}`;

  // Try to switch to GenLayer StudioNet
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: unknown) {
    const error = switchError as { code?: number; message?: string };

    // Chain not added (4902) or unrecognized chain (various codes)
    if (error.code === 4902 || error.message?.includes("Unrecognized chain")) {
      await addGenLayerNetwork();

      // Try switching again after adding
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } else {
      throw switchError;
    }
  }

  return accounts[0];
}

// Create a round on the contract
export async function createRound(roundId: string, imageUrl: string, category: string): Promise<string> {
  return sendWriteTransaction(
    GENLAYER_CONFIG.contractAddress as Address,
    "create_round",
    [roundId, imageUrl, category]
  );
}

// Helper to convert Map to plain object recursively
function mapToObject(value: unknown): unknown {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    value.forEach((v, k) => {
      obj[k] = mapToObject(v);
    });
    return obj;
  }
  if (Array.isArray(value)) {
    return value.map(mapToObject);
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
}

// Read contract state
export async function readContract<T>(
  functionName: string,
  args: CalldataEncodable[] = []
): Promise<T> {
  const client = createReadClient();

  console.log(`[readContract] Calling ${functionName} with args:`, args);

  const result = await client.readContract({
    address: GENLAYER_CONFIG.contractAddress as Address,
    functionName,
    args,
  });

  // Convert Map objects to plain objects
  const converted = mapToObject(result);

  console.log(`[readContract] Result for ${functionName}:`, converted);
  return converted as T;
}

// Submit a caption to a round
export async function submitCaption(roundId: string, caption: string): Promise<string> {
  return sendWriteTransaction(
    GENLAYER_CONFIG.contractAddress as Address,
    "submit_caption",
    [roundId, caption]
  );
}

// Resolve a round (trigger AI judging)
export async function resolveRound(roundId: string): Promise<string> {
  return sendWriteTransaction(
    GENLAYER_CONFIG.contractAddress as Address,
    "resolve_round",
    [roundId]
  );
}

// Cancel a round (only creator can cancel)
export async function cancelRound(roundId: string): Promise<string> {
  return sendWriteTransaction(
    GENLAYER_CONFIG.contractAddress as Address,
    "cancel_round",
    [roundId]
  );
}

// Get result for a resolved round (works after round data is cleared)
export async function getResult<T>(roundId: string): Promise<T> {
  const client = createReadClient();

  const result = await client.readContract({
    address: GENLAYER_CONFIG.contractAddress as Address,
    functionName: "get_result",
    args: [roundId],
  });

  // Convert Map objects to plain objects
  const converted = mapToObject(result);
  console.log(`[getResult] Result for ${roundId}:`, converted);

  return converted as T;
}
