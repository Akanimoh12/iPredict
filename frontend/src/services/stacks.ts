// ── Stacks Integration Service ─────────────────────────────────────────────────
// Core service for interacting with Stacks blockchain: read-only calls,
// balance fetching, and ClarityValue parsing.

import {
  fetchCallReadOnlyFunction,
  ClarityValue,
  ClarityType,
  cvToJSON,
  uintCV,
  intCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  bufferCV,
  boolCV,
  noneCV,
  someCV,
  listCV,
  tupleCV,
} from '@stacks/transactions';
import {
  STACKS_API_URL,
  DEPLOYER_ADDRESS,
  NETWORK_NAME,
} from '@/config/network';
import { AppErrorType } from '@/types';
import type { AppError } from '@/types';

// ── Read-Only Contract Calls ──────────────────────────────────────────────────

/**
 * Call a read-only Clarity function on a deployed contract.
 * Uses `fetchCallReadOnlyFunction` from @stacks/transactions.
 *
 * @param contractAddress — The deployer's STX address (e.g. SP...)
 * @param contractName — Contract name (e.g. "prediction-market")
 * @param functionName — Read-only function name (e.g. "get-market")
 * @param functionArgs — Array of ClarityValue arguments
 * @returns Parsed ClarityValue result
 */
export async function callReadOnly(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = []
): Promise<ClarityValue> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      senderAddress: contractAddress,
    });
    return result;
  } catch (err) {
    throw classifyError(err);
  }
}

// ── STX Balance ───────────────────────────────────────────────────────────────

/**
 * Block info: current chain tip height + estimated block time.
 * Cached for 60 seconds to avoid excessive API calls.
 */
export interface BlockInfo {
  height: number;
  blockTimeSeconds: number;
}

let _cachedBlockInfo: { data: BlockInfo; fetchedAt: number } | null = null;
const BLOCK_INFO_TTL = 60_000; // 60 s

/**
 * Fetch block info from the Stacks API.
 * Dynamically computes block time using tenure_height and stacks_tip_height
 * to handle Nakamoto's fast block production (~23s on testnet vs ~600s pre-Nakamoto).
 */
export async function getBlockInfo(): Promise<BlockInfo> {
  if (_cachedBlockInfo && Date.now() - _cachedBlockInfo.fetchedAt < BLOCK_INFO_TTL) {
    return _cachedBlockInfo.data;
  }
  try {
    const response = await fetch(`${STACKS_API_URL}/v2/info`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const data = await response.json();

    const stacksTipHeight = Number(data.stacks_tip_height);
    const tenureHeight = Number(data.tenure_height);

    // Estimate Stacks block time from tenure data.
    // tenure_height ≈ Bitcoin blocks (~600s each on mainnet).
    // Stacks blocks per tenure = stacksTipHeight / tenureHeight.
    const BITCOIN_BLOCK_TIME = 600; // ~10 minutes
    let blockTimeSeconds: number;
    if (tenureHeight > 0 && stacksTipHeight > 0) {
      const blocksPerTenure = stacksTipHeight / tenureHeight;
      blockTimeSeconds = Math.max(1, Math.round(BITCOIN_BLOCK_TIME / blocksPerTenure));
    } else {
      blockTimeSeconds = BITCOIN_BLOCK_TIME; // fallback to ~10 min
    }

    const blockInfo: BlockInfo = { height: stacksTipHeight, blockTimeSeconds };
    _cachedBlockInfo = { data: blockInfo, fetchedAt: Date.now() };
    return blockInfo;
  } catch (err) {
    console.error('[iPredict] Failed to fetch block info:', err);
    return _cachedBlockInfo?.data ?? { height: 0, blockTimeSeconds: 600 };
  }
}

/**
 * Convenience wrapper — returns just the block height.
 */
export async function getCurrentBlockHeight(): Promise<number> {
  const info = await getBlockInfo();
  return info.height;
}

/**
 * Fetch native STX balance for an address via Stacks API.
 * Returns balance in STX (human-readable units, e.g. 100.5).
 */
export async function getStxBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${STACKS_API_URL}/v2/accounts/${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }
    const data = await response.json();
    // balance is in micro-STX (string), convert to STX
    const microStx = BigInt(data.balance);
    return Number(microStx) / 1_000_000;
  } catch (err) {
    console.error('[iPredict] Failed to fetch STX balance:', err);
    return 0;
  }
}

// ── ClarityValue Parsing ──────────────────────────────────────────────────────

/**
 * Parse a ClarityValue into a plain JavaScript value.
 * Handles: uint, int, bool, principal, string, buffer, none, some, tuple, list,
 * and (response ok/err) wrappers.
 */
export function parseResponse(cv: ClarityValue): unknown {
  switch (cv.type) {
    case ClarityType.UInt:
      return Number(cv.value);

    case ClarityType.Int:
      return Number(cv.value);

    case ClarityType.BoolTrue:
      return true;

    case ClarityType.BoolFalse:
      return false;

    case ClarityType.PrincipalStandard:
    case ClarityType.PrincipalContract:
      return cvToJSON(cv).value;

    case ClarityType.StringASCII:
    case ClarityType.StringUTF8:
      return cv.value;

    case ClarityType.Buffer:
      return cv.value;

    case ClarityType.OptionalNone:
      return null;

    case ClarityType.OptionalSome:
      return parseResponse(cv.value);

    case ClarityType.ResponseOk:
      return parseResponse(cv.value);

    case ClarityType.ResponseErr:
      return { error: parseResponse(cv.value) };

    case ClarityType.Tuple: {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(cv.value)) {
        result[key] = parseResponse(val as ClarityValue);
      }
      return result;
    }

    case ClarityType.List:
      return (cv.value as ClarityValue[]).map(parseResponse);

    default:
      // Fallback to cvToJSON for any unhandled types
      return cvToJSON(cv);
  }
}

// ── Error Handling ────────────────────────────────────────────────────────────

/**
 * Classify an unknown error into a structured AppError.
 */
function classifyError(err: unknown): AppError {
  const message = extractErrorMessage(err);
  const lower = message.toLowerCase();

  // Network errors
  if (
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('timeout') ||
    lower.includes('aborted')
  ) {
    return createAppError(
      AppErrorType.NETWORK,
      'Network request failed — check your connection',
      message
    );
  }

  // Wallet / signing errors
  if (
    lower.includes('rejected') ||
    lower.includes('denied') ||
    lower.includes('cancelled') ||
    lower.includes('wallet') ||
    lower.includes('sign')
  ) {
    return createAppError(
      AppErrorType.WALLET,
      'Wallet operation cancelled',
      message
    );
  }

  // Contract errors
  if (
    lower.includes('contract') ||
    lower.includes('clarity') ||
    lower.includes('invoke')
  ) {
    return createAppError(
      AppErrorType.CONTRACT,
      'Contract call failed',
      message
    );
  }

  // Default
  return createAppError(
    AppErrorType.NETWORK,
    message || 'Request failed',
    message
  );
}

/**
 * Extract a useful error message from various error types.
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      const msg = (err as { message: string }).message;
      const details = 'details' in err ? (err as { details: string }).details : '';
      return details ? `${msg}: ${details}` : msg;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function createAppError(
  type: AppErrorType,
  message: string,
  details?: string
): AppError {
  return { type, message, details };
}

export function isAppError(err: unknown): err is AppError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'message' in err
  );
}

// Re-export commonly used CV constructors for convenience
export {
  uintCV,
  intCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  bufferCV,
  boolCV,
  noneCV,
  someCV,
  listCV,
  tupleCV,
};
