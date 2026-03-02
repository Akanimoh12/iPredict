import {
  uintCV,
  principalCV,
} from '@stacks/transactions';
import {
  DEPLOYER_ADDRESS,
  LEADERBOARD_CONTRACT_NAME,
} from '@/config/network';
import { callReadOnly, parseResponse } from '@/services/stacks';
import { getDisplayName } from '@/services/referral';
import * as cache from '@/services/cache';
import type { PlayerStats } from '@/types';

// ── Cache keys & TTLs ────────────────────────────────────────────────────────

const CACHE_TOP_PLAYERS = (limit: number) => `lb_top_${limit}`;
const CACHE_STATS = (addr: string) => `lb_stats_${addr}`;
const CACHE_POINTS = (addr: string) => `lb_pts_${addr}`;
const CACHE_RANK = (addr: string) => `lb_rank_${addr}`;

const LEADERBOARD_TTL = 60_000; // 60s
const STATS_TTL = 30_000; // 30s

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely coerce to number, returning 0 for NaN/undefined/null */
function safe(v: unknown): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// ── Concurrency limiter ───────────────────────────────────────────────────────

async function batchAll<T>(
  tasks: (() => Promise<T>)[],
  concurrency = 5,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency).map((fn) => fn());
    results.push(...(await Promise.all(batch)));
  }
  return results;
}

// ── Raw contract return types ─────────────────────────────────────────────────

/** Contract get-top-players returns { limit, result: list<{ address, points }> } */
interface RawTopPlayersResponse {
  limit: number;
  result: Array<{ address: string; points: number }>;
}

/** Contract get-stats returns { points, total-bets, won-bets, lost-bets } */
interface RawContractStats {
  points: number;
  'total-bets': number;
  'won-bets': number;
  'lost-bets': number;
}

// ── Read functions ────────────────────────────────────────────────────────────

/**
 * Get top N players from the leaderboard.
 * Contract returns { limit, result: (list 50 { address: principal, points: uint }) }.
 */
export async function getTopPlayers(limit: number): Promise<PlayerStats[]> {
  const cacheKey = CACHE_TOP_PLAYERS(limit);
  const cached = cache.get<PlayerStats[]>(cacheKey);
  if (cached) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      LEADERBOARD_CONTRACT_NAME,
      'get-top-players',
      [uintCV(limit)],
    );
    const raw = parseResponse(cv) as RawTopPlayersResponse | null;
    if (!raw || !raw.result || raw.result.length === 0) return [];

    const entries = raw.result.map((item) => ({
      addr: String(item.address ?? ''),
      pts: safe(item.points),
    }));

    // Batch-resolve display names with concurrency limit of 5
    const nameMap = new Map<string, string>();
    const nameTasks = entries.map(({ addr }) => async () => {
      try {
        const name = await getDisplayName(addr);
        nameMap.set(addr, name || '');
      } catch {
        nameMap.set(addr, '');
      }
    });
    await batchAll(nameTasks, 5);

    // Batch-fetch full stats for each player
    const statsTasks = entries.map(({ addr, pts }) => async () => {
      try {
        const statsCv = await callReadOnly(
          DEPLOYER_ADDRESS,
          LEADERBOARD_CONTRACT_NAME,
          'get-stats',
          [principalCV(addr)],
        );
        const statsRaw = parseResponse(statsCv) as RawContractStats | null;

        const totalBets = statsRaw ? safe(statsRaw['total-bets']) : 0;
        const wonBets = statsRaw ? safe(statsRaw['won-bets']) : 0;
        const lostBets = statsRaw ? safe(statsRaw['lost-bets']) : 0;

        return {
          address: addr,
          displayName: nameMap.get(addr) || '',
          points: pts,
          totalBets,
          wonBets,
          lostBets,
          winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
        } satisfies PlayerStats;
      } catch {
        return {
          address: addr,
          displayName: nameMap.get(addr) || '',
          points: pts,
          totalBets: 0,
          wonBets: 0,
          lostBets: 0,
          winRate: 0,
        } satisfies PlayerStats;
      }
    });

    const players = await batchAll(statsTasks, 5);

    cache.set(cacheKey, players, LEADERBOARD_TTL);
    return players;
  } catch (err) {
    console.error('[iPredict] getTopPlayers error:', err);
    return [];
  }
}

/** Get stats for a specific user */
export async function getStats(
  userAddress: string,
): Promise<PlayerStats | null> {
  const cacheKey = CACHE_STATS(userAddress);
  const cached = cache.get<PlayerStats>(cacheKey);
  if (cached) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      LEADERBOARD_CONTRACT_NAME,
      'get-stats',
      [principalCV(userAddress)],
    );
    const raw = parseResponse(cv) as RawContractStats | null;
    if (!raw) return null;

    const points = safe(raw.points);
    const totalBets = safe(raw['total-bets']);
    const wonBets = safe(raw['won-bets']);
    const lostBets = safe(raw['lost-bets']);

    // Also resolve display name
    let displayName = '';
    try {
      displayName = await getDisplayName(userAddress);
    } catch {
      // silently fail
    }

    const stats: PlayerStats = {
      address: userAddress,
      displayName,
      points,
      totalBets,
      wonBets,
      lostBets,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
    };
    cache.set(cacheKey, stats, STATS_TTL);
    return stats;
  } catch {
    return null;
  }
}

/** Get total points for a user */
export async function getPoints(userAddress: string): Promise<number> {
  const cacheKey = CACHE_POINTS(userAddress);
  const cached = cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      LEADERBOARD_CONTRACT_NAME,
      'get-points',
      [principalCV(userAddress)],
    );
    const pts = Number(parseResponse(cv));
    cache.set(cacheKey, pts, STATS_TTL);
    return pts;
  } catch {
    return 0;
  }
}

/** Get rank for a user (position in top players, or 0 if unranked) */
export async function getRank(userAddress: string): Promise<number> {
  const cacheKey = CACHE_RANK(userAddress);
  const cached = cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const cv = await callReadOnly(
      DEPLOYER_ADDRESS,
      LEADERBOARD_CONTRACT_NAME,
      'get-rank',
      [principalCV(userAddress)],
    );
    const rank = Number(parseResponse(cv));
    cache.set(cacheKey, rank, LEADERBOARD_TTL);
    return rank;
  } catch {
    return 0;
  }
}
