import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  boolCV,
  stringUtf8CV,
  principalCV,
  Pc,
} from '@stacks/transactions';
import {
  DEPLOYER_ADDRESS,
  MARKET_CONTRACT_NAME,
  STACKS_API_URL,
  NETWORK_NAME,
  BLOCK_TIME_SECONDS,
} from '@/config/network';
import { callReadOnly, parseResponse, getCurrentBlockHeight } from '@/services/stacks';
import * as cache from '@/services/cache';
import { getDisplayName } from '@/services/referral';
import type { Market, Bet, TransactionResult } from '@/types';

// ── Cache keys & TTLs ────────────────────────────────────────────────────────

const CACHE_MARKETS = 'markets';
const CACHE_MARKET = (id: number) => `market_${id}`;
const CACHE_BET = (mId: number, addr: string) => `bet_${mId}_${addr}`;
const CACHE_ODDS = (id: number) => `odds_${id}`;
const CACHE_BETTORS = (id: number) => `bettors_${id}`;
const CACHE_FEES = 'accumulated_fees';

const MARKET_TTL = 30_000; // 30s
const BET_TTL = 15_000; // 15s — refreshes faster for active bets

// ── Micro-STX conversion ──────────────────────────────────────────────────────
const MICRO_STX_PER_STX = 1_000_000;

/** Convert micro-STX (raw contract value) to human-readable STX */
function microStxToStx(microStx: number): number {
  return microStx / MICRO_STX_PER_STX;
}

/** Convert human-readable STX to micro-STX for contract calls */
function stxToMicroStx(stx: number): number {
  return Math.round(stx * MICRO_STX_PER_STX);
}

// ── Concurrency limiter ───────────────────────────────────────────────────────

async function batchAll<T>(
  tasks: (() => Promise<T>)[],
  concurrency = 5
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency).map((fn) => fn());
    results.push(...(await Promise.all(batch)));
  }
  return results;
}

// ── Parse raw contract data into TS types ─────────────────────────────────────

interface RawMarket {
  question: string;
  'image-url': string;
  'end-block': number;
  'total-yes': number;
  'total-no': number;
  resolved: boolean;
  outcome: boolean;
  cancelled: boolean;
  creator: string;
  'bet-count': number;
}

function parseMarket(raw: RawMarket, id: number, currentBlockHeight: number): Market {
  // Convert block height to estimated Unix timestamp (seconds)
  const blocksRemaining = Math.max(0, Number(raw['end-block']) - currentBlockHeight);
  const estimatedEndTime = Math.floor(Date.now() / 1000) + blocksRemaining * BLOCK_TIME_SECONDS;

  return {
    id,
    question: raw.question,
    imageUrl: raw['image-url'],
    endBlock: Number(raw['end-block']),
    endTime: estimatedEndTime,
    totalYes: microStxToStx(Number(raw['total-yes'])),
    totalNo: microStxToStx(Number(raw['total-no'])),
    resolved: raw.resolved,
    outcome: raw.outcome,
    cancelled: raw.cancelled,
    creator: typeof raw.creator === 'string' ? raw.creator : String(raw.creator),
    betCount: Number(raw['bet-count']),
  };
}

interface RawBet {
  amount: number;
  'is-yes': boolean;
  claimed: boolean;
}

function parseBet(raw: RawBet): Bet {
  return {
    amount: microStxToStx(Number(raw.amount)),
    isYes: raw['is-yes'],
    claimed: raw.claimed,
  };
}

// ── Read functions ────────────────────────────────────────────────────────────

/** Fetch single market by ID */
export async function getMarket(marketId: number): Promise<Market | null> {
  const cached = cache.get<Market>(CACHE_MARKET(marketId));
  if (cached) return cached;

  try {
    const [cv, currentBlockHeight] = await Promise.all([
      callReadOnly(
        DEPLOYER_ADDRESS,
        MARKET_CONTRACT_NAME,
        'get-market',
        [uintCV(marketId)]
      ),
      getCurrentBlockHeight(),
    ]);
    const raw = parseResponse(cv) as RawMarket | null;
    if (!raw) return null;
    const market = parseMarket(raw, marketId, currentBlockHeight);
    cache.set(CACHE_MARKET(marketId), market, MARKET_TTL);
    return market;
  } catch {
    return null;
  }
}

/** Fetch all markets — iterate 1..marketCount, batch-resolve */
export async function getMarkets(): Promise<Market[]> {
  const cached = cache.get<Market[]>(CACHE_MARKETS);
  if (cached) return cached;

  try {
    // Get total count + current block height in parallel
    const [countCv, currentBlockHeight] = await Promise.all([
      callReadOnly(
        DEPLOYER_ADDRESS,
        MARKET_CONTRACT_NAME,
        'get-market-count',
        []
      ),
      getCurrentBlockHeight(),
    ]);
    const total = Number(parseResponse(countCv));
    if (total === 0) return [];

    // Fetch markets in batches of 5
    const tasks = Array.from({ length: total }, (_, i) => {
      const id = i + 1;
      return async () => {
        try {
          const cv = await callReadOnly(
            DEPLOYER_ADDRESS,
            MARKET_CONTRACT_NAME,
            'get-market',
            [uintCV(id)]
          );
          const raw = parseResponse(cv) as RawMarket | null;
          if (!raw) return null;
          return parseMarket(raw, id, currentBlockHeight);
        } catch {
          return null;
        }
      };
    });

    const results = await batchAll(tasks, 5);
    const markets = results.filter((m): m is Market => m !== null);

    // Cache individual markets too
    for (const m of markets) {
      cache.set(CACHE_MARKET(m.id), m, MARKET_TTL);
    }
    cache.set(CACHE_MARKETS, markets, MARKET_TTL);
    return markets;
  } catch {
    return [];
  }
}

/** Fetch a user's bet on a specific market */
export async function getBet(
  marketId: number,
  userAddress: string
): Promise<Bet | null> {
  const cacheKey = CACHE_BET(marketId, userAddress);
  const cached = cache.get<Bet>(cacheKey);
  if (cached) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      MARKET_CONTRACT_NAME,
      'get-bet',
      [uintCV(marketId), principalCV(userAddress)]
    );
    const raw = parseResponse(cv) as RawBet | null;
    if (!raw) return null;
    const bet = parseBet(raw);
    cache.set(cacheKey, bet, BET_TTL);
    return bet;
  } catch {
    return null;
  }
}

/** Get odds for a market (YES% / NO%) */
export async function getOdds(
  marketId: number
): Promise<{ yesPercent: number; noPercent: number }> {
  const cacheKey = CACHE_ODDS(marketId);
  const cached = cache.get<{ yesPercent: number; noPercent: number }>(cacheKey);
  if (cached) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      MARKET_CONTRACT_NAME,
      'get-odds',
      [uintCV(marketId)]
    );
    const raw = parseResponse(cv) as {
      'yes-percent': number;
      'no-percent': number;
    } | null;
    if (!raw) return { yesPercent: 50, noPercent: 50 };
    const odds = {
      yesPercent: Number(raw['yes-percent']),
      noPercent: Number(raw['no-percent']),
    };
    cache.set(cacheKey, odds, MARKET_TTL);
    return odds;
  } catch {
    return { yesPercent: 50, noPercent: 50 };
  }
}

/** Get list of bettor addresses for a market */
export async function getMarketBettors(marketId: number): Promise<string[]> {
  const cacheKey = CACHE_BETTORS(marketId);
  const cached = cache.get<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      MARKET_CONTRACT_NAME,
      'get-market-bettors',
      [uintCV(marketId)]
    );
    const raw = parseResponse(cv) as string[];
    const bettors = raw || [];
    cache.set(cacheKey, bettors, MARKET_TTL);
    return bettors;
  } catch {
    return [];
  }
}

/** Get accumulated platform fees (in micro-STX) */
export async function getAccumulatedFees(): Promise<number> {
  const cached = cache.get<number>(CACHE_FEES);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      MARKET_CONTRACT_NAME,
      'get-accumulated-fees',
      []
    );
    const fees = Number(parseResponse(cv));
    cache.set(CACHE_FEES, fees, MARKET_TTL);
    return fees;
  } catch {
    return 0;
  }
}

/**
 * Batch-resolve display names for an array of addresses.
 * Used on market detail pages to show bettor names.
 */
export async function resolveDisplayNames(
  addresses: string[]
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  const tasks = addresses.map((addr) => async () => {
    try {
      const name = await getDisplayName(addr);
      nameMap.set(addr, name || addr);
    } catch {
      nameMap.set(addr, addr);
    }
  });
  await batchAll(tasks, 5);
  return nameMap;
}

// ── Write functions ───────────────────────────────────────────────────────────

/**
 * Wait for a Stacks transaction to confirm by polling the API.
 * Resolves with TransactionResult once status is terminal.
 */
async function waitForTx(txId: string): Promise<TransactionResult> {
  const maxAttempts = 60;
  const interval = 3_000; // 3s between polls

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${STACKS_API_URL}/extended/v1/tx/${txId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.tx_status === 'success') {
          return { success: true, hash: txId };
        }
        if (
          data.tx_status === 'abort_by_response' ||
          data.tx_status === 'abort_by_post_condition'
        ) {
          return {
            success: false,
            hash: txId,
            error: `Transaction failed: ${data.tx_status}`,
          };
        }
      }
    } catch {
      // continue polling
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return { success: false, hash: txId, error: 'Transaction confirmation timeout' };
}

/** Create a new market (admin only) */
export async function createMarket(
  senderAddress: string,
  question: string,
  imageUrl: string,
  durationBlocks: number
): Promise<TransactionResult> {
  return new Promise((resolve) => {
    openContractCall({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: MARKET_CONTRACT_NAME,
      functionName: 'create-market',
      functionArgs: [
        stringUtf8CV(question),
        stringUtf8CV(imageUrl),
        uintCV(durationBlocks),
      ],
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      onFinish: async (data) => {
        cache.invalidate(CACHE_MARKETS);
        const result = await waitForTx(data.txId);
        resolve(result);
      },
      onCancel: () => {
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}

/** Place a bet on a market */
export async function placeBet(
  senderAddress: string,
  marketId: number,
  isYes: boolean,
  amount: number
): Promise<TransactionResult> {
  const amountMicroStx = stxToMicroStx(amount);

  return new Promise((resolve) => {
    openContractCall({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: MARKET_CONTRACT_NAME,
      functionName: 'place-bet',
      functionArgs: [uintCV(marketId), boolCV(isYes), uintCV(amountMicroStx)],
      postConditions: [
        Pc.principal(senderAddress).willSendEq(amountMicroStx).ustx(),
      ],
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      onFinish: async (data) => {
        cache.invalidate(CACHE_MARKETS);
        cache.invalidate(CACHE_MARKET(marketId));
        cache.invalidate(CACHE_BET(marketId, senderAddress));
        cache.invalidate(CACHE_ODDS(marketId));
        cache.invalidate(CACHE_BETTORS(marketId));
        const result = await waitForTx(data.txId);
        resolve(result);
      },
      onCancel: () => {
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}

/** Resolve a market (admin only) */
export async function resolveMarket(
  senderAddress: string,
  marketId: number,
  outcome: boolean
): Promise<TransactionResult> {
  return new Promise((resolve) => {
    openContractCall({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: MARKET_CONTRACT_NAME,
      functionName: 'resolve-market',
      functionArgs: [uintCV(marketId), boolCV(outcome)],
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      onFinish: async (data) => {
        cache.invalidate(CACHE_MARKETS);
        cache.invalidate(CACHE_MARKET(marketId));
        const result = await waitForTx(data.txId);
        resolve(result);
      },
      onCancel: () => {
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}

/** Cancel a market (admin only) */
export async function cancelMarket(
  senderAddress: string,
  marketId: number
): Promise<TransactionResult> {
  return new Promise((resolve) => {
    openContractCall({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: MARKET_CONTRACT_NAME,
      functionName: 'cancel-market',
      functionArgs: [uintCV(marketId)],
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      onFinish: async (data) => {
        cache.invalidate(CACHE_MARKETS);
        cache.invalidate(CACHE_MARKET(marketId));
        cache.invalidate(CACHE_BETTORS(marketId));
        const result = await waitForTx(data.txId);
        resolve(result);
      },
      onCancel: () => {
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}

/** Claim rewards for a resolved market */
export async function claim(
  senderAddress: string,
  marketId: number
): Promise<TransactionResult> {
  return new Promise((resolve) => {
    openContractCall({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: MARKET_CONTRACT_NAME,
      functionName: 'claim',
      functionArgs: [uintCV(marketId)],
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      onFinish: async (data) => {
        cache.invalidate(CACHE_BET(marketId, senderAddress));
        cache.invalidate(CACHE_MARKET(marketId));
        cache.invalidate(CACHE_FEES);
        const result = await waitForTx(data.txId);
        resolve(result);
      },
      onCancel: () => {
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}

/** Withdraw accumulated platform fees (admin only) */
export async function withdrawFees(
  senderAddress: string
): Promise<TransactionResult> {
  return new Promise((resolve) => {
    openContractCall({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: MARKET_CONTRACT_NAME,
      functionName: 'withdraw-fees',
      functionArgs: [],
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      onFinish: async (data) => {
        cache.invalidate(CACHE_FEES);
        const result = await waitForTx(data.txId);
        resolve(result);
      },
      onCancel: () => {
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}
