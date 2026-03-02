// ── Pure Utility Functions ────────────────────────────────────────────────────

const MICRO_STX = 1_000_000n;

/**
 * Convert micro-STX (bigint) to human-readable STX string.
 * Example: 1234567890n → "1234.56789 STX"
 */
export function formatSTX(microStx: bigint): string {
  const isNegative = microStx < 0n;
  const abs = isNegative ? -microStx : microStx;
  const whole = abs / MICRO_STX;
  const fractional = abs % MICRO_STX;
  const fracStr = fractional.toString().padStart(6, "0").replace(/0+$/, "");
  const sign = isNegative ? "-" : "";

  if (fracStr.length === 0) {
    return `${sign}${whole} STX`;
  }
  return `${sign}${whole}.${fracStr} STX`;
}

/**
 * Format a number (already in STX units) to a display string.
 * Example: 12.5 → "12.50 STX", 0 → "0 STX"
 */
export function displaySTX(stx: number): string {
  if (stx === 0) return "0 STX";
  // Show up to 2 decimal places, trim trailing zeros
  const formatted = stx.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted} STX`;
}

/**
 * Truncate a Stacks address for display.
 * Example: "SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" → "SP1P...GZGM"
 */
export function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/**
 * Validate a bet amount string against constraints.
 * - Must be a valid positive number
 * - Must be >= 1 (STX minimum)
 * - Must not exceed the user's balance
 */
export function isValidAmount(amount: string, balance: number): boolean {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 1) return false;
  return parsed <= balance;
}

/**
 * Return a human-readable "time until" string from a Unix timestamp.
 * Example: timestamp 2 days from now → "2d 14h 32m"
 */
export function timeUntil(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;

  const seconds = diff;
  return `${seconds}s`;
}

/**
 * Format a Unix timestamp to a locale-aware date string.
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate a winner's payout from a prediction market.
 *
 * payout = (userNetBet / winningSideTotal) × totalPool
 *
 * All values in STX (not micro-STX).
 */
export function calculatePayout(
  userNetBet: number,
  winningSideTotal: number,
  totalPool: number
): number {
  if (winningSideTotal <= 0) return 0;
  return (userNetBet / winningSideTotal) * totalPool;
}

/**
 * Calculate YES/NO odds percentages from net totals.
 * Returns { yesPercent, noPercent } — each 0-100.
 */
export function calculateOdds(
  totalYes: number,
  totalNo: number
): { yesPercent: number; noPercent: number } {
  const total = totalYes + totalNo;
  if (total <= 0) return { yesPercent: 50, noPercent: 50 };

  const yesPercent = Math.round((totalYes / total) * 100);
  return { yesPercent, noPercent: 100 - yesPercent };
}

/**
 * Convert basis points to a percentage string.
 * Example: 200 → "2%", 150 → "1.5%"
 */
export function bpsToPercent(bps: number): string {
  const pct = bps / 100;
  return pct % 1 === 0 ? `${pct}%` : `${pct}%`;
}

/**
 * Build a Stacks Explorer URL (Hiro Explorer).
 */
export function explorerUrl(
  type: "tx" | "address" | "contract",
  id: string
): string {
  const chain = "testnet";
  const base = "https://explorer.hiro.so";
  switch (type) {
    case "tx":
      return `${base}/txid/${id}?chain=${chain}`;
    case "address":
      return `${base}/address/${id}?chain=${chain}`;
    case "contract":
      return `${base}/address/${id}?chain=${chain}`;
    default:
      return `${base}?chain=${chain}`;
  }
}
