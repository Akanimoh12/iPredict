import {
  DEPLOYER_ADDRESS,
  MARKET_CONTRACT_NAME,
  STACKS_API_URL,
} from '@/config/network';
import type { MarketEvent } from '@/types';

// ── Event type names emitted by the PredictionMarket contract ─────────────────

const EVENT_TYPES = [
  'bet_placed',
  'market_resolved',
  'market_cancelled',
  'reward_claimed',
  'fees_withdrawn',
] as const;

type ContractEventType = (typeof EVENT_TYPES)[number];

function isKnownEventType(s: string): s is ContractEventType {
  return (EVENT_TYPES as readonly string[]).includes(s);
}

// ── Stacks API event types ────────────────────────────────────────────────────

interface StacksContractEvent {
  event_index: number;
  event_type: string;
  tx_id: string;
  contract_log?: {
    contract_id: string;
    topic: string;
    value: {
      hex: string;
      repr: string;
    };
  };
  block_height: number;
  block_time?: number;
  block_time_iso?: string;
}

// ── Parse Clarity print event repr into a MarketEvent ─────────────────────────

/**
 * Parse a Clarity `(print ...)` value repr string into a MarketEvent.
 * 
 * The contract emits structured tuples via `(print { type: "bet_placed", ... })`.
 * The Stacks API returns a repr like:
 *   (tuple (type "bet_placed") (market-id u1) (user SP...) (amount u100000))
 * or in newer API versions:
 *   {type: "bet_placed", market-id: u1, user: SP..., amount: u100000}
 */
function parseEventRepr(
  repr: string,
  txHash: string,
  blockTime: number,
): MarketEvent | null {
  try {
    // Extract the event type
    const typeMatch = repr.match(/type[":]\s*"([^"]+)"/);
    if (!typeMatch) return null;

    const eventType = typeMatch[1];
    if (!isKnownEventType(eventType)) return null;

    // Extract market-id
    const marketIdMatch = repr.match(/market-id[":]\s*u(\d+)/);
    const marketId = marketIdMatch ? Number(marketIdMatch[1]) : 0;

    // Extract user principal
    const userMatch = repr.match(/user[":]\s*(S[A-Z0-9]+)/);
    const user = userMatch ? userMatch[1] : '';

    // Extract amount
    const amountMatch = repr.match(/amount[":]\s*u(\d+)/);
    const amount = amountMatch ? Number(amountMatch[1]) : undefined;

    return {
      type: eventType,
      marketId,
      user,
      amount,
      timestamp: blockTime,
      txHash,
    };
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Poll for market events from the Stacks API.
 * Uses the contract events endpoint to fetch `smart_contract_log` events
 * (Clarity `print` statements) from the prediction-market contract.
 *
 * @param offset — Pagination offset (default: 0)
 * @param limit — Number of events to fetch (default: 50, max: 50)
 * @returns Array of parsed MarketEvent objects, newest first.
 */
export async function pollMarketEvents(
  offset = 0,
  limit = 50,
): Promise<MarketEvent[]> {
  const contractId = `${DEPLOYER_ADDRESS}.${MARKET_CONTRACT_NAME}`;

  try {
    const response = await fetch(
      `${STACKS_API_URL}/extended/v1/contract/${contractId}/events?offset=${offset}&limit=${limit}`,
    );

    if (!response.ok) {
      console.error('[iPredict] Failed to fetch events:', response.statusText);
      return [];
    }

    const data = await response.json();
    const rawEvents: StacksContractEvent[] = data.results || data.events || [];

    const events: MarketEvent[] = [];
    for (const raw of rawEvents) {
      // Only process smart_contract_log events (Clarity print statements)
      if (raw.event_type !== 'smart_contract_log') continue;
      if (!raw.contract_log?.value?.repr) continue;

      // Determine timestamp
      const blockTime = raw.block_time
        ? raw.block_time * 1000 // Unix seconds -> milliseconds
        : raw.block_time_iso
          ? new Date(raw.block_time_iso).getTime()
          : Date.now();

      const parsed = parseEventRepr(
        raw.contract_log.value.repr,
        raw.tx_id,
        blockTime,
      );
      if (parsed) events.push(parsed);
    }

    // Already newest first from API, but ensure ordering
    return events;
  } catch (err) {
    console.error('[iPredict] pollMarketEvents error:', err);
    return [];
  }
}
