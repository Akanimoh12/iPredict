import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCallReadOnly = vi.fn();
const mockParseResponse = vi.fn((v: unknown) => v);
const mockGetBlockInfo = vi.fn().mockResolvedValue({ height: 50, blockTimeSeconds: 23 });

vi.mock("@/services/stacks", () => ({
  callReadOnly: (...args: unknown[]) => mockCallReadOnly(...args),
  parseResponse: (v: unknown) => mockParseResponse(v),
  getBlockInfo: () => mockGetBlockInfo(),
}));

vi.mock("@/services/cache", () => ({
  get: () => null,
  set: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
}));

vi.mock("@/services/referral", () => ({
  getDisplayName: vi.fn().mockResolvedValue(""),
}));

vi.mock("@stacks/connect", () => ({
  openContractCall: vi.fn(),
}));

vi.mock("@stacks/transactions", () => ({
  uintCV: (val: number) => ({ type: "uint", value: val }),
  boolCV: (val: boolean) => ({ type: "bool", value: val }),
  stringUtf8CV: (val: string) => ({ type: "string-utf8", value: val }),
  principalCV: (val: string) => ({ type: "principal", value: val }),
  Pc: {
    principal: () => ({ willSendLte: () => ({ ustx: () => ({}) }) }),
  },
  PostConditionMode: { Allow: 1, Deny: 2 },
}));

vi.mock("@/config/network", () => ({
  DEPLOYER_ADDRESS: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  MARKET_CONTRACT_NAME: "prediction-market",
  STACKS_API_URL: "https://api.testnet.hiro.so",
  NETWORK_NAME: "testnet",
  TOTAL_FEE_BPS: 200,
  PLATFORM_FEE_BPS: 150,
  REFERRAL_FEE_BPS: 50,
}));

import { getMarket, getMarkets, getBet, getOdds } from "@/services/market";

// ── Tests ──────────────────────────────────────────────────────────────────

describe("market service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMarket", () => {
    it("returns parsed Market object on success", async () => {
      mockGetBlockInfo.mockResolvedValueOnce({ height: 50, blockTimeSeconds: 23 });
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce({
        question: "Will ETH flip BTC?",
        "image-url": "/eth.png",
        "end-block": 100000,
        "total-yes": 1000000000,
        "total-no": 500000000,
        resolved: false,
        outcome: false,
        cancelled: false,
        creator: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
        "bet-count": 5,
      });

      const market = await getMarket(1);
      expect(market).not.toBeNull();
      expect(market!.id).toBe(1);
      expect(market!.question).toBe("Will ETH flip BTC?");
      expect(market!.totalYes).toBe(1000);
      expect(market!.totalNo).toBe(500);
      expect(market!.betCount).toBe(5);
      expect(market!.endBlock).toBe(100000);
      // endTime should be a future Unix timestamp (block 100000 - block 50 = 99950 blocks * 600s)
      expect(market!.endTime).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it("returns null on error", async () => {
      mockCallReadOnly.mockRejectedValueOnce(new Error("not found"));
      const market = await getMarket(999);
      expect(market).toBeNull();
    });
  });

  describe("getMarkets", () => {
    it("returns array of markets", async () => {
      // First call: get-market-count => cv
      mockCallReadOnly.mockResolvedValueOnce("count-cv");
      mockParseResponse.mockReturnValueOnce(2);

      // Then two get-market calls
      mockCallReadOnly.mockResolvedValueOnce("m1-cv");
      mockParseResponse.mockReturnValueOnce({
        question: "Q1",
        "image-url": "",
        "end-block": 100,
        "total-yes": 10000000,
        "total-no": 5000000,
        resolved: false,
        outcome: false,
        cancelled: false,
        creator: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
        "bet-count": 2,
      });
      mockCallReadOnly.mockResolvedValueOnce("m2-cv");
      mockParseResponse.mockReturnValueOnce({
        question: "Q2",
        "image-url": "",
        "end-block": 200,
        "total-yes": 20000000,
        "total-no": 15000000,
        resolved: false,
        outcome: false,
        cancelled: false,
        creator: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
        "bet-count": 4,
      });

      const markets = await getMarkets();
      expect(markets).toHaveLength(2);
      expect(markets[0].question).toBe("Q1");
      expect(markets[1].question).toBe("Q2");
    });

    it("returns empty array when count is 0", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce(0);
      const markets = await getMarkets();
      expect(markets).toEqual([]);
    });
  });

  describe("getBet", () => {
    it("returns parsed Bet on success", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce({
        amount: 100000000,
        "is-yes": true,
        claimed: false,
      });

      const bet = await getBet(1, "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(bet).not.toBeNull();
      expect(bet!.amount).toBe(100);
      expect(bet!.isYes).toBe(true);
      expect(bet!.claimed).toBe(false);
    });

    it("returns null on error", async () => {
      mockCallReadOnly.mockRejectedValueOnce(new Error("no bet"));
      const bet = await getBet(1, "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(bet).toBeNull();
    });
  });

  describe("getOdds", () => {
    it("returns odds from contract", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce({
        "yes-percent": 60,
        "no-percent": 40,
      });
      const odds = await getOdds(1);
      expect(odds.yesPercent).toBe(60);
      expect(odds.noPercent).toBe(40);
    });

    it("returns 50/50 on error", async () => {
      mockCallReadOnly.mockRejectedValueOnce(new Error("fail"));
      const odds = await getOdds(1);
      expect(odds).toEqual({ yesPercent: 50, noPercent: 50 });
    });
  });
});
