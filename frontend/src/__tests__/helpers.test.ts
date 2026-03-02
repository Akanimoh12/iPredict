import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatSTX,
  truncateAddress,
  isValidAmount,
  timeUntil,
  calculatePayout,
  calculateOdds,
  bpsToPercent,
  explorerUrl,
} from "@/utils/helpers";

// ── formatSTX ─────────────────────────────────────────────────────────────────

describe("formatSTX", () => {
  it("formats whole STX correctly", () => {
    expect(formatSTX(100_000000n)).toBe("100 STX");
  });

  it("formats fractional STX correctly", () => {
    expect(formatSTX(123_456789n)).toBe("123.456789 STX");
  });

  it("handles zero", () => {
    expect(formatSTX(0n)).toBe("0 STX");
  });

  it("handles negative values", () => {
    expect(formatSTX(-50_000000n)).toBe("-50 STX");
  });

  it("handles small micro-STX (less than 1 STX)", () => {
    expect(formatSTX(1n)).toBe("0.000001 STX");
  });

  it("handles very large amounts", () => {
    // 1 billion STX
    expect(formatSTX(1_000_000_000_000000n)).toBe("1000000000 STX");
  });

  it("handles negative fractional values", () => {
    expect(formatSTX(-5_500000n)).toBe("-5.5 STX");
  });

  it("strips trailing zeros from fractional part", () => {
    // 10.1 STX = 10_100000 micro-STX
    expect(formatSTX(10_100000n)).toBe("10.1 STX");
  });

  it("handles exactly 1 micro-STX", () => {
    expect(formatSTX(1n)).toBe("0.000001 STX");
  });
});

// ── truncateAddress ───────────────────────────────────────────────────────────

describe("truncateAddress", () => {
  it("truncates a standard Stacks address", () => {
    const addr = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    expect(truncateAddress(addr)).toBe("ST1P...GZGM");
  });

  it("truncates long addresses", () => {
    expect(truncateAddress("SP1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5")).toBe(
      "SP1S...YPD5"
    );
  });

  it("returns short strings as-is", () => {
    expect(truncateAddress("SHORT")).toBe("SHORT");
  });

  it("returns empty string as-is", () => {
    expect(truncateAddress("")).toBe("");
  });

  it("returns exactly 10-char string as-is", () => {
    expect(truncateAddress("ABCDEFGHIJ")).toBe("ABCDEFGHIJ");
  });

  it("truncates 11-char string", () => {
    expect(truncateAddress("ABCDEFGHIJK")).toBe("ABCD...HIJK");
  });
});

// ── isValidAmount ─────────────────────────────────────────────────────────────

describe("isValidAmount", () => {
  it("accepts valid amount within balance", () => {
    expect(isValidAmount("50", 100)).toBe(true);
  });

  it("accepts minimum 1 STX", () => {
    expect(isValidAmount("1", 100)).toBe(true);
  });

  it("accepts amount equal to balance", () => {
    expect(isValidAmount("100", 100)).toBe(true);
  });

  it("rejects amount below 1 STX minimum", () => {
    expect(isValidAmount("0.5", 100)).toBe(false);
  });

  it("rejects zero", () => {
    expect(isValidAmount("0", 100)).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(isValidAmount("-5", 100)).toBe(false);
  });

  it("rejects amount exceeding balance", () => {
    expect(isValidAmount("150", 100)).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(isValidAmount("abc", 100)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidAmount("", 100)).toBe(false);
  });
});

// ── timeUntil ─────────────────────────────────────────────────────────────────

describe("timeUntil", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin "now" to a known Unix time: 2026-02-26T00:00:00Z = 1771977600
    vi.setSystemTime(new Date("2026-02-26T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Ended" for past timestamps', () => {
    expect(timeUntil(0)).toBe("Ended");
  });

  it('returns "Ended" for timestamp equal to now', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(timeUntil(now)).toBe("Ended");
  });

  it("returns days/hours/minutes for future timestamp", () => {
    const now = Math.floor(Date.now() / 1000);
    // 2 days, 3 hours, 45 minutes from now
    const future = now + 2 * 86400 + 3 * 3600 + 45 * 60;
    expect(timeUntil(future)).toBe("2d 3h 45m");
  });

  it("returns hours/minutes when less than a day", () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 5 * 3600 + 30 * 60;
    expect(timeUntil(future)).toBe("5h 30m");
  });

  it("returns minutes only when less than an hour", () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 42 * 60;
    expect(timeUntil(future)).toBe("42m");
  });

  it("returns seconds when less than a minute", () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 30;
    expect(timeUntil(future)).toBe("30s");
  });
});

// ── calculatePayout ───────────────────────────────────────────────────────────

describe("calculatePayout", () => {
  it("calculates correct payout for sole winner (100% of winning side)", () => {
    // User bet 100, winning side total 100, pool 300 → gets entire pool
    expect(calculatePayout(100, 100, 300)).toBe(300);
  });

  it("calculates proportional payout for multiple winners", () => {
    // User bet 50, winning side total 200, pool 500
    expect(calculatePayout(50, 200, 500)).toBe(125);
  });

  it("calculates equal split payout", () => {
    // 2 equal winners: user bet 50, winning side 100, pool 200
    expect(calculatePayout(50, 100, 200)).toBe(100);
  });

  it("returns 0 if winning side total is 0", () => {
    expect(calculatePayout(100, 0, 500)).toBe(0);
  });

  it("returns 0 if winning side total is negative", () => {
    expect(calculatePayout(100, -1, 500)).toBe(0);
  });

  it("handles small fractional bets", () => {
    // User bet 1, winning side 3, pool 10 → ~3.333
    const payout = calculatePayout(1, 3, 10);
    expect(payout).toBeCloseTo(3.333, 2);
  });
});

// ── calculateOdds ─────────────────────────────────────────────────────────────

describe("calculateOdds", () => {
  it("returns 50/50 when no bets", () => {
    expect(calculateOdds(0, 0)).toEqual({ yesPercent: 50, noPercent: 50 });
  });

  it("returns correct percentages for clear split", () => {
    expect(calculateOdds(75, 25)).toEqual({ yesPercent: 75, noPercent: 25 });
  });

  it("returns 100/0 when all bets on YES", () => {
    expect(calculateOdds(500, 0)).toEqual({ yesPercent: 100, noPercent: 0 });
  });

  it("returns 0/100 when all bets on NO", () => {
    expect(calculateOdds(0, 300)).toEqual({ yesPercent: 0, noPercent: 100 });
  });

  it("rounds percentages and always totals 100", () => {
    const result = calculateOdds(1, 2);
    expect(result.yesPercent + result.noPercent).toBe(100);
    expect(result.yesPercent).toBe(33);
    expect(result.noPercent).toBe(67);
  });
});

// ── bpsToPercent ──────────────────────────────────────────────────────────────

describe("bpsToPercent", () => {
  it("converts 200 bps to 2%", () => {
    expect(bpsToPercent(200)).toBe("2%");
  });

  it("converts 150 bps to 1.5%", () => {
    expect(bpsToPercent(150)).toBe("1.5%");
  });

  it("converts 50 bps to 0.5%", () => {
    expect(bpsToPercent(50)).toBe("0.5%");
  });

  it("converts 10000 bps to 100%", () => {
    expect(bpsToPercent(10000)).toBe("100%");
  });

  it("converts 0 bps to 0%", () => {
    expect(bpsToPercent(0)).toBe("0%");
  });
});

// ── explorerUrl ───────────────────────────────────────────────────────────────

describe("explorerUrl", () => {
  it("builds transaction URL", () => {
    expect(explorerUrl("tx", "0xabc123")).toBe(
      "https://explorer.hiro.so/txid/0xabc123?chain=testnet"
    );
  });

  it("builds address URL", () => {
    expect(explorerUrl("address", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")).toBe(
      "https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM?chain=testnet"
    );
  });

  it("builds contract URL", () => {
    expect(explorerUrl("contract", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.prediction-market")).toBe(
      "https://explorer.hiro.so/address/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.prediction-market?chain=testnet"
    );
  });
});
