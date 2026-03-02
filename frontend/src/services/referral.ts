import { openContractCall } from '@stacks/connect';
import {
  principalCV,
  stringUtf8CV,
  someCV,
  noneCV,
} from '@stacks/transactions';
import {
  DEPLOYER_ADDRESS,
  REFERRAL_CONTRACT_NAME,
  STACKS_API_URL,
  NETWORK_NAME,
} from '@/config/network';
import { callReadOnly, parseResponse } from '@/services/stacks';
import * as cache from '@/services/cache';
import type { TransactionResult } from '@/types';

// ── Cache keys & TTLs ────────────────────────────────────────────────────────

const CACHE_REFERRER = (addr: string) => `ref_referrer_${addr}`;
const CACHE_DISPLAY_NAME = (addr: string) => `ref_name_${addr}`;
const CACHE_REF_COUNT = (addr: string) => `ref_count_${addr}`;
const CACHE_EARNINGS = (addr: string) => `ref_earnings_${addr}`;
const CACHE_HAS_REF = (addr: string) => `ref_has_${addr}`;
const CACHE_REGISTERED = (addr: string) => `ref_reg_${addr}`;

const REF_TTL = 60_000; // 60s — referral data changes infrequently

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wait for a Stacks transaction to confirm by polling the API. */
async function waitForTx(txId: string): Promise<TransactionResult> {
  const maxAttempts = 60;
  const interval = 3_000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${STACKS_API_URL}/extended/v1/tx/${txId}`,
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

// ── Write functions ───────────────────────────────────────────────────────────

/**
 * Register referral for the current user.
 * Contract signature: (register-referral (display-name (string-utf8 64)) (referrer (optional principal)))
 * Note: In Clarity, tx-sender is the user — no need to pass the user address explicitly.
 */
export async function registerReferral(
  senderAddress: string,
  displayName: string,
  referrer: string | null,
): Promise<TransactionResult> {
  return new Promise((resolve) => {
    openContractCall({
      contractAddress: DEPLOYER_ADDRESS,
      contractName: REFERRAL_CONTRACT_NAME,
      functionName: 'register-referral',
      functionArgs: [
        stringUtf8CV(displayName),
        referrer ? someCV(principalCV(referrer)) : noneCV(),
      ],
      network: NETWORK_NAME === 'mainnet' ? 'mainnet' : 'testnet',
      onFinish: async (data) => {
        // Invalidate caches
        cache.invalidate(CACHE_REGISTERED(senderAddress));
        cache.invalidate(CACHE_DISPLAY_NAME(senderAddress));
        cache.invalidate(CACHE_HAS_REF(senderAddress));
        cache.invalidate(CACHE_REFERRER(senderAddress));
        if (referrer) {
          cache.invalidate(CACHE_REF_COUNT(referrer));
        }
        const result = await waitForTx(data.txId);
        resolve(result);
      },
      onCancel: () => {
        resolve({ success: false, error: 'Transaction cancelled by user' });
      },
    });
  });
}

// ── Read functions ────────────────────────────────────────────────────────────

/** Get the referrer address for a user (or null if none) */
export async function getReferrer(
  userAddress: string,
): Promise<string | null> {
  const cacheKey = CACHE_REFERRER(userAddress);
  const cached = cache.get<string | null>(cacheKey);
  if (cached !== undefined && cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      REFERRAL_CONTRACT_NAME,
      'get-referrer',
      [principalCV(userAddress)],
    );
    const result = (parseResponse(cv) as string) || null;
    cache.set(cacheKey, result, REF_TTL);
    return result;
  } catch {
    return null;
  }
}

/** Get display name for a user (empty string if not registered) */
export async function getDisplayName(
  userAddress: string,
): Promise<string> {
  const cacheKey = CACHE_DISPLAY_NAME(userAddress);
  const cached = cache.get<string>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      REFERRAL_CONTRACT_NAME,
      'get-display-name',
      [principalCV(userAddress)],
    );
    const name = (parseResponse(cv) as string) || '';
    cache.set(cacheKey, name, REF_TTL);
    return name;
  } catch {
    return '';
  }
}

/** Get referral count for a user */
export async function getReferralCount(
  userAddress: string,
): Promise<number> {
  const cacheKey = CACHE_REF_COUNT(userAddress);
  const cached = cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      REFERRAL_CONTRACT_NAME,
      'get-referral-count',
      [principalCV(userAddress)],
    );
    const count = Number(parseResponse(cv));
    cache.set(cacheKey, count, REF_TTL);
    return count;
  } catch {
    return 0;
  }
}

/** Get total referral earnings for a user (in micro-STX) */
export async function getEarnings(userAddress: string): Promise<number> {
  const cacheKey = CACHE_EARNINGS(userAddress);
  const cached = cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      REFERRAL_CONTRACT_NAME,
      'get-earnings',
      [principalCV(userAddress)],
    );
    const earnings = Number(parseResponse(cv));
    cache.set(cacheKey, earnings, REF_TTL);
    return earnings;
  } catch {
    return 0;
  }
}

/** Check if user has a custom referrer */
export async function hasReferrer(userAddress: string): Promise<boolean> {
  const cacheKey = CACHE_HAS_REF(userAddress);
  const cached = cache.get<boolean>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      REFERRAL_CONTRACT_NAME,
      'has-referrer',
      [principalCV(userAddress)],
    );
    const result = parseResponse(cv) as boolean;
    cache.set(cacheKey, result, REF_TTL);
    return result;
  } catch {
    return false;
  }
}

/** Check if user is registered */
export async function isRegistered(userAddress: string): Promise<boolean> {
  const cacheKey = CACHE_REGISTERED(userAddress);
  const cached = cache.get<boolean>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      REFERRAL_CONTRACT_NAME,
      'is-registered',
      [principalCV(userAddress)],
    );
    const result = parseResponse(cv) as boolean;
    cache.set(cacheKey, result, REF_TTL);
    return result;
  } catch {
    return false;
  }
}

// ── Name-to-Address resolution ────────────────────────────────────────────────

/**
 * Resolve a display name to a Stacks address by scanning all known bettors.
 * Returns the matching address or null if not found.
 * Case-insensitive, exact match.
 */
export async function resolveAddressByName(
  name: string,
): Promise<string | null> {
  const cacheKey = `ref_name_resolve_${name.toLowerCase()}`;
  const cached = cache.get<string | null>(cacheKey);
  if (cached !== null) return cached;

  try {
    // Import dynamically to avoid circular dependency
    const { getMarkets, getMarketBettors } = await import('@/services/market');
    const markets = await getMarkets();
    if (markets.length === 0) return null;

    // Collect unique bettor addresses
    const addressSet = new Set<string>();
    const bettorResults = await Promise.allSettled(
      markets.map((m) => getMarketBettors(m.id)),
    );
    for (const r of bettorResults) {
      if (r.status === 'fulfilled') {
        for (const addr of r.value) addressSet.add(addr);
      }
    }

    // Check each bettor's display name
    const needle = name.toLowerCase().trim();
    for (const addr of addressSet) {
      try {
        const dName = await getDisplayName(addr);
        if (dName && dName.toLowerCase().trim() === needle) {
          cache.set(cacheKey, addr, REF_TTL);
          return addr;
        }
      } catch {
        // skip
      }
    }

    return null;
  } catch {
    return null;
  }
}
