import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCallReadOnly = vi.fn();
const mockParseResponse = vi.fn((v: unknown) => v);

vi.mock("@/services/stacks", () => ({
  callReadOnly: (...args: unknown[]) => mockCallReadOnly(...args),
  parseResponse: (v: unknown) => mockParseResponse(v),
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

vi.mock("@stacks/transactions", () => ({
  uintCV: (val: number) => ({ type: "uint", value: val }),
  principalCV: (val: string) => ({ type: "principal", value: val }),
}));

vi.mock("@/config/network", () => ({
  DEPLOYER_ADDRESS: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  LEADERBOARD_CONTRACT_NAME: "leaderboard",
}));

import { getTopPlayers, getStats, getPoints, getRank } from "@/services/leaderboard";

// ── Tests ──────────────────────────────────────────────────────────────────

describe("leaderboard service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTopPlayers", () => {
    it("returns sorted array of PlayerStats", async () => {
      // get-top-players returns { limit, result: [{ address, points }] }
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce({
        limit: 10,
        result: [
          { address: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5", points: 1000 },
          { address: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", points: 500 },
        ],
      });
      // get-stats for Alice
      mockCallReadOnly.mockResolvedValueOnce("stats-cv-1");
      mockParseResponse.mockReturnValueOnce({
        points: 1000,
        "total-bets": 15,
        "won-bets": 10,
        "lost-bets": 5,
      });
      // get-stats for Bob
      mockCallReadOnly.mockResolvedValueOnce("stats-cv-2");
      mockParseResponse.mockReturnValueOnce({
        points: 500,
        "total-bets": 10,
        "won-bets": 6,
        "lost-bets": 4,
      });

      const players = await getTopPlayers(10);
      expect(players).toHaveLength(2);
      expect(players[0].address).toBe("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(players[0].points).toBe(1000);
      expect(players[0].totalBets).toBe(15);
      expect(players[0].wonBets).toBe(10);
      expect(players[0].winRate).toBeCloseTo(66.67, 1);
      expect(players[1].address).toBe("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG");
      expect(players[1].points).toBe(500);
    });

    it("returns empty array when no players", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce({ limit: 10, result: [] });
      const players = await getTopPlayers(10);
      expect(players).toEqual([]);
    });

    it("returns empty array on error", async () => {
      mockCallReadOnly.mockRejectedValueOnce(new Error("network"));
      const players = await getTopPlayers(10);
      expect(players).toEqual([]);
    });

    it("handles stats fetch failure gracefully", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce({
        limit: 10,
        result: [
          { address: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5", points: 100 },
        ],
      });
      // stats call fails
      mockCallReadOnly.mockRejectedValueOnce(new Error("fail"));

      const players = await getTopPlayers(10);
      expect(players).toHaveLength(1);
      expect(players[0].points).toBe(100);
      expect(players[0].totalBets).toBe(0); // fallback
      expect(players[0].winRate).toBe(0);
    });
  });

  describe("getStats", () => {
    it("returns player stats for a user", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce({
        points: 800,
        "total-bets": 20,
        "won-bets": 12,
        "lost-bets": 8,
      });

      const stats = await getStats("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(stats).not.toBeNull();
      expect(stats!.points).toBe(800);
      expect(stats!.totalBets).toBe(20);
      expect(stats!.wonBets).toBe(12);
      expect(stats!.lostBets).toBe(8);
      expect(stats!.winRate).toBe(60);
    });

    it("returns null on error", async () => {
      mockCallReadOnly.mockRejectedValueOnce(new Error("fail"));
      const stats = await getStats("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(stats).toBeNull();
    });
  });

  describe("getPoints", () => {
    it("returns numeric points", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce(1234);
      const pts = await getPoints("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(pts).toBe(1234);
    });

    it("returns 0 on error", async () => {
      mockCallReadOnly.mockRejectedValueOnce(new Error("fail"));
      const pts = await getPoints("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(pts).toBe(0);
    });
  });

  describe("getRank", () => {
    it("returns numeric rank", async () => {
      mockCallReadOnly.mockResolvedValueOnce("cv");
      mockParseResponse.mockReturnValueOnce(3);
      const rank = await getRank("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(rank).toBe(3);
    });

    it("returns 0 on error", async () => {
      mockCallReadOnly.mockRejectedValueOnce(new Error("fail"));
      const rank = await getRank("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5");
      expect(rank).toBe(0);
    });
  });
});
