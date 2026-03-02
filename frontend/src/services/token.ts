import { principalCV } from '@stacks/transactions';
import {
  DEPLOYER_ADDRESS,
  TOKEN_CONTRACT_NAME,
} from '@/config/network';
import { callReadOnly, parseResponse } from '@/services/stacks';
import * as cache from '@/services/cache';
import type { TokenInfo } from '@/types';

// ── Cache keys & TTLs ────────────────────────────────────────────────────────

const CACHE_BALANCE = (addr: string) => `token_bal_${addr}`;
const CACHE_TOKEN_INFO = 'token_info';
const CACHE_TOTAL_SUPPLY = 'token_supply';

const TOKEN_TTL = 30_000; // 30s
const INFO_TTL = 300_000; // 5 min — metadata rarely changes

// ── Token decimals ────────────────────────────────────────────────────────────

/** IPREDICT token has 6 decimals */
const TOKEN_DECIMALS = 6;
const TOKEN_UNIT = 10 ** TOKEN_DECIMALS; // 1_000_000

// ── Read functions ────────────────────────────────────────────────────────────

/** Fetch IPREDICT token balance for an account (in human-readable units) */
export async function getBalance(account: string): Promise<number> {
  const cacheKey = CACHE_BALANCE(account);
  const cached = cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      TOKEN_CONTRACT_NAME,
      'get-balance',
      [principalCV(account)],
    );
    const raw = Number(parseResponse(cv));
    const balance = raw / TOKEN_UNIT;
    cache.set(cacheKey, balance, TOKEN_TTL);
    return balance;
  } catch {
    return 0;
  }
}

/** Fetch token metadata (name, symbol, decimals, totalSupply) */
export async function getTokenInfo(): Promise<TokenInfo> {
  const cached = cache.get<TokenInfo>(CACHE_TOKEN_INFO);
  if (cached) return cached;

  try {
    const [nameCv, symbolCv, decimalsCv, supplyCv] = await Promise.all([
      callReadOnly(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, 'get-name', []),
      callReadOnly(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, 'get-symbol', []),
      callReadOnly(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, 'get-decimals', []),
      callReadOnly(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, 'get-total-supply', []),
    ]);

    const info: TokenInfo = {
      name: parseResponse(nameCv) as string,
      symbol: parseResponse(symbolCv) as string,
      decimals: Number(parseResponse(decimalsCv)),
      totalSupply: Number(parseResponse(supplyCv)),
    };
    cache.set(CACHE_TOKEN_INFO, info, INFO_TTL);
    return info;
  } catch {
    // Return defaults if contract not yet deployed
    return { name: 'IPREDICT', symbol: 'IPRED', decimals: 6, totalSupply: 0 };
  }
}

/** Fetch total supply */
export async function getTotalSupply(): Promise<number> {
  const cached = cache.get<number>(CACHE_TOTAL_SUPPLY);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      TOKEN_CONTRACT_NAME,
      'get-total-supply',
      [],
    );
    const supply = Number(parseResponse(cv));
    cache.set(CACHE_TOTAL_SUPPLY, supply, TOKEN_TTL);
    return supply;
  } catch {
    return 0;
  }
}
