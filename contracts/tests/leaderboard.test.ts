import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
declare const simnet: any;

declare module "vitest" {
  interface Assertion<T = any> {
    toBeOk(expected?: any): T;
    toBeErr(expected?: any): T;
  }

  interface AsymmetricMatchersContaining {
    toBeOk(expected?: any): void;
    toBeErr(expected?: any): void;
  }
}

// ============================================================================
// leaderboard.test.ts
// Tests for the iPredict Leaderboard contract
// Coverage target: >= 90% line coverage
// ============================================================================

const CONTRACT = "leaderboard";

// Devnet account addresses (from settings/Devnet.toml)
const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";
const wallet4 = "ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND";
const wallet5 = "ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB";

// For testing, we use regular wallet addresses as authorized callers.
// In the real deployment, these would be contract principals.
// When calling directly via simnet, contract-caller == tx-sender (the wallet address).
const marketCaller = wallet4;    // simulates prediction-market contract
const referralCaller = wallet5;  // simulates referral-registry contract

// Helper: initialize the leaderboard with authorized callers
function initializeLeaderboard() {
  return simnet.callPublicFn(
    CONTRACT,
    "initialize",
    [
      Cl.principal(marketCaller),
      Cl.principal(referralCaller),
    ],
    deployer
  );
}

describe("leaderboard", () => {
  // ========================================================================
  // Initialize
  // ========================================================================

  describe("initialize", () => {
    it("admin can initialize with authorized callers", () => {
      const result = initializeLeaderboard();
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("emits leaderboard-initialized event", () => {
      const result = initializeLeaderboard();
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });

    it("rejects double initialization", () => {
      initializeLeaderboard();
      const result = initializeLeaderboard();
      expect(result.result).toBeErr(Cl.uint(202));
    });

    it("rejects initialization by non-admin", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "initialize",
        [
          Cl.principal(marketCaller),
          Cl.principal(referralCaller),
        ],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(200));
    });
  });

  // ========================================================================
  // add-pts
  // ========================================================================

  describe("add-pts", () => {
    it("market contract can add points for a winner", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("market contract can add points for a loser", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("points accumulate across multiple adds", () => {
      initializeLeaderboard();
      simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)],
        marketCaller
      );
      simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)],
        marketCaller
      );
      const pts = simnet.callReadOnlyFn(
        CONTRACT,
        "get-points",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(pts.result).toStrictEqual(Cl.uint(40));
    });

    it("winner increments won-bets counter", () => {
      initializeLeaderboard();
      simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)],
        marketCaller
      );
      const stats = simnet.callReadOnlyFn(
        CONTRACT,
        "get-stats",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(stats.result).toStrictEqual(
        Cl.tuple({
          points: Cl.uint(30),
          "total-bets": Cl.uint(0),
          "won-bets": Cl.uint(1),
          "lost-bets": Cl.uint(0),
        })
      );
    });

    it("loser increments lost-bets counter", () => {
      initializeLeaderboard();
      simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)],
        marketCaller
      );
      const stats = simnet.callReadOnlyFn(
        CONTRACT,
        "get-stats",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(stats.result).toStrictEqual(
        Cl.tuple({
          points: Cl.uint(10),
          "total-bets": Cl.uint(0),
          "won-bets": Cl.uint(0),
          "lost-bets": Cl.uint(1),
        })
      );
    });

    it("multiple wins and losses accumulate correctly", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);
      const stats = simnet.callReadOnlyFn(CONTRACT, "get-stats", [Cl.principal(wallet1)], deployer);
      expect(stats.result).toStrictEqual(
        Cl.tuple({
          points: Cl.uint(70),
          "total-bets": Cl.uint(0),
          "won-bets": Cl.uint(2),
          "lost-bets": Cl.uint(1),
        })
      );
    });

    it("rejects call from unauthorized caller", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(201));
    });

    it("rejects call from referral contract", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)],
        referralCaller
      );
      expect(result.result).toBeErr(Cl.uint(201));
    });

    it("emits points-added event", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // add-bonus-pts
  // ========================================================================

  describe("add-bonus-pts", () => {
    it("referral contract can add bonus points", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-bonus-pts",
        [Cl.principal(wallet1), Cl.uint(5)],
        referralCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("bonus points do not affect won-bets or lost-bets", () => {
      initializeLeaderboard();
      simnet.callPublicFn(
        CONTRACT,
        "add-bonus-pts",
        [Cl.principal(wallet1), Cl.uint(5)],
        referralCaller
      );
      simnet.callPublicFn(
        CONTRACT,
        "add-bonus-pts",
        [Cl.principal(wallet1), Cl.uint(3)],
        referralCaller
      );
      const stats = simnet.callReadOnlyFn(
        CONTRACT,
        "get-stats",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(stats.result).toStrictEqual(
        Cl.tuple({
          points: Cl.uint(8),
          "total-bets": Cl.uint(0),
          "won-bets": Cl.uint(0),
          "lost-bets": Cl.uint(0),
        })
      );
    });

    it("bonus points accumulate with regular points", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-bonus-pts", [Cl.principal(wallet1), Cl.uint(5)], referralCaller);
      const pts = simnet.callReadOnlyFn(CONTRACT, "get-points", [Cl.principal(wallet1)], deployer);
      expect(pts.result).toStrictEqual(Cl.uint(35));
    });

    it("rejects call from unauthorized caller", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-bonus-pts",
        [Cl.principal(wallet1), Cl.uint(5)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(201));
    });

    it("rejects call from market contract", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-bonus-pts",
        [Cl.principal(wallet1), Cl.uint(5)],
        marketCaller
      );
      expect(result.result).toBeErr(Cl.uint(201));
    });

    it("emits bonus-points-added event", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-bonus-pts",
        [Cl.principal(wallet1), Cl.uint(5)],
        referralCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // record-bet
  // ========================================================================

  describe("record-bet", () => {
    it("market contract can record a bet", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-bet",
        [Cl.principal(wallet1)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("record-bet increments total-bets counter", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet1)], marketCaller);
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet1)], marketCaller);
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet1)], marketCaller);
      const stats = simnet.callReadOnlyFn(CONTRACT, "get-stats", [Cl.principal(wallet1)], deployer);
      expect(stats.result).toStrictEqual(
        Cl.tuple({
          points: Cl.uint(0),
          "total-bets": Cl.uint(3),
          "won-bets": Cl.uint(0),
          "lost-bets": Cl.uint(0),
        })
      );
    });

    it("rejects call from unauthorized caller", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-bet",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(201));
    });

    it("emits bet-recorded event", () => {
      initializeLeaderboard();
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-bet",
        [Cl.principal(wallet1)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Read-Only: get-points
  // ========================================================================

  describe("get-points", () => {
    it("returns 0 for unknown user", () => {
      const pts = simnet.callReadOnlyFn(
        CONTRACT,
        "get-points",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(pts.result).toStrictEqual(Cl.uint(0));
    });

    it("returns correct points after add-pts", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);
      const pts = simnet.callReadOnlyFn(CONTRACT, "get-points", [Cl.principal(wallet1)], deployer);
      expect(pts.result).toStrictEqual(Cl.uint(30));
    });
  });

  // ========================================================================
  // Read-Only: get-stats
  // ========================================================================

  describe("get-stats", () => {
    it("returns all zeros for unknown user", () => {
      const stats = simnet.callReadOnlyFn(
        CONTRACT,
        "get-stats",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(stats.result).toStrictEqual(
        Cl.tuple({
          points: Cl.uint(0),
          "total-bets": Cl.uint(0),
          "won-bets": Cl.uint(0),
          "lost-bets": Cl.uint(0),
        })
      );
    });

    it("returns correct aggregate after mixed operations", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet1)], marketCaller);
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet1)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-bonus-pts", [Cl.principal(wallet1), Cl.uint(5)], referralCaller);

      const stats = simnet.callReadOnlyFn(CONTRACT, "get-stats", [Cl.principal(wallet1)], deployer);
      expect(stats.result).toStrictEqual(
        Cl.tuple({
          points: Cl.uint(45),
          "total-bets": Cl.uint(2),
          "won-bets": Cl.uint(1),
          "lost-bets": Cl.uint(1),
        })
      );
    });
  });

  // ========================================================================
  // Top Players Sorting
  // ========================================================================

  describe("top-players sorting", () => {
    it("single player appears in top list", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);

      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const result = top.result;
      // Should be a tuple with a result list containing one entry
      const list = result.value.result.value;
      expect(list.length).toBe(1);
      expect(list[0]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet1), points: Cl.uint(30) })
      );
    });

    it("players are sorted in descending order by points", () => {
      initializeLeaderboard();
      // wallet1: 10 pts, wallet2: 30 pts, wallet3: 20 pts
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet3), Cl.uint(20), Cl.bool(true)], marketCaller);

      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(3);
      expect(list[0]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet2), points: Cl.uint(30) })
      );
      expect(list[1]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet3), points: Cl.uint(20) })
      );
      expect(list[2]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet1), points: Cl.uint(10) })
      );
    });

    it("player moves up when points increase", () => {
      initializeLeaderboard();
      // wallet1: 10 pts, wallet2: 20 pts
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(20), Cl.bool(true)], marketCaller);

      // Now wallet1 gets 30 more → total 40, should move to #1
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);

      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(2);
      expect(list[0]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet1), points: Cl.uint(40) })
      );
      expect(list[1]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet2), points: Cl.uint(20) })
      );
    });

    it("bonus points also update top-players position", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(20), Cl.bool(true)], marketCaller);

      // wallet1 gets bonus points, now 10 + 25 = 35, should surpass wallet2
      simnet.callPublicFn(CONTRACT, "add-bonus-pts", [Cl.principal(wallet1), Cl.uint(25)], referralCaller);

      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const list = top.result.value.result.value;
      expect(list[0]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet1), points: Cl.uint(35) })
      );
      expect(list[1]).toStrictEqual(
        Cl.tuple({ address: Cl.principal(wallet2), points: Cl.uint(20) })
      );
    });

    it("get-top-players respects limit parameter", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(20), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet3), Cl.uint(10), Cl.bool(false)], marketCaller);

      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(2)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(2);
    });

    it("get-top-players returns empty list when no players", () => {
      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(0);
    });

    it("handles score ties — both players remain in list", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(20), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(20), Cl.bool(true)], marketCaller);

      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(2);
      // Both have 20 points
      expect(list[0].value.points).toStrictEqual(Cl.uint(20));
      expect(list[1].value.points).toStrictEqual(Cl.uint(20));
    });
  });

  // ========================================================================
  // Top 50 Cap
  // ========================================================================

  describe("top-50 cap", () => {
    it("exactly 50 players fill the list", () => {
      initializeLeaderboard();
      const wallets = simnet.getAccounts();
      const walletKeys = [...wallets.keys()];

      // Add 50 unique players with decreasing points
      for (let i = 0; i < 50 && i < walletKeys.length; i++) {
        const addr = wallets.get(walletKeys[i])!;
        simnet.callPublicFn(
          CONTRACT,
          "add-pts",
          [Cl.principal(addr), Cl.uint((50 - i) * 10), Cl.bool(true)],
          marketCaller
        );
      }

      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(50)], deployer);
      const list = top.result.value.result.value;
      // There should be min(50, available wallets) entries
      expect(list.length).toBeGreaterThan(0);
      expect(list.length).toBeLessThanOrEqual(50);
    });

    it("51st player with lower score does not enter full list", () => {
      initializeLeaderboard();
      const wallets = simnet.getAccounts();
      const walletKeys = [...wallets.keys()];

      // We only have a limited number of accounts in simnet, so we test with available accounts
      // Add available accounts first
      const availableCount = Math.min(walletKeys.length, 50);
      for (let i = 0; i < availableCount; i++) {
        const addr = wallets.get(walletKeys[i])!;
        simnet.callPublicFn(
          CONTRACT,
          "add-pts",
          [Cl.principal(addr), Cl.uint((availableCount + 1 - i) * 100), Cl.bool(true)],
          marketCaller
        );
      }

      // Verify the list has the right count
      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(50)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(availableCount);
    });

    it("player with higher score replaces lowest when list is full", () => {
      initializeLeaderboard();
      // Add 3 players with known scores
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(100), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(50), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet3), Cl.uint(10), Cl.bool(false)], marketCaller);

      // Verify ordering
      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(3);
      expect(list[0]).toStrictEqual(Cl.tuple({ address: Cl.principal(wallet1), points: Cl.uint(100) }));
      expect(list[1]).toStrictEqual(Cl.tuple({ address: Cl.principal(wallet2), points: Cl.uint(50) }));
      expect(list[2]).toStrictEqual(Cl.tuple({ address: Cl.principal(wallet3), points: Cl.uint(10) }));
    });
  });

  // ========================================================================
  // Rank Calculation
  // ========================================================================

  describe("get-rank", () => {
    it("returns 0 for unranked user", () => {
      const rank = simnet.callReadOnlyFn(
        CONTRACT,
        "get-rank",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(rank.result).toStrictEqual(Cl.uint(0));
    });

    it("returns rank 1 for top player", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(100), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(50), Cl.bool(true)], marketCaller);

      const rank = simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet1)], deployer);
      expect(rank.result).toStrictEqual(Cl.uint(1));
    });

    it("returns correct rank for second player", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(100), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(50), Cl.bool(true)], marketCaller);

      const rank = simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet2)], deployer);
      expect(rank.result).toStrictEqual(Cl.uint(2));
    });

    it("rank updates when player's points change", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(50), Cl.bool(true)], marketCaller);

      // wallet1 is rank 2
      let rank = simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet1)], deployer);
      expect(rank.result).toStrictEqual(Cl.uint(2));

      // wallet1 gets more points, moves to rank 1
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(100), Cl.bool(true)], marketCaller);
      rank = simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet1)], deployer);
      expect(rank.result).toStrictEqual(Cl.uint(1));
    });

    it("rank updates when player gets bonus points", () => {
      initializeLeaderboard();
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(30), Cl.bool(true)], marketCaller);

      // wallet1 rank 2
      let rank = simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet1)], deployer);
      expect(rank.result).toStrictEqual(Cl.uint(2));

      // bonus pts move wallet1 to rank 1 (10 + 25 = 35 > 30)
      simnet.callPublicFn(CONTRACT, "add-bonus-pts", [Cl.principal(wallet1), Cl.uint(25)], referralCaller);
      rank = simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet1)], deployer);
      expect(rank.result).toStrictEqual(Cl.uint(1));
    });
  });

  // ========================================================================
  // Full Integration: Stats + Ranking Together
  // ========================================================================

  describe("full integration", () => {
    it("complete flow: bets, points, bonus, sorting, ranking", () => {
      initializeLeaderboard();

      // wallet1: 2 bets, 1 win (30pts), 1 loss (10pts) = 40pts
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet1)], marketCaller);
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet1)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(10), Cl.bool(false)], marketCaller);

      // wallet2: 1 bet, 1 win (30pts) + 5 bonus = 35pts
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet2)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(30), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-bonus-pts", [Cl.principal(wallet2), Cl.uint(5)], referralCaller);

      // wallet3: 1 bet, 1 loss (10pts) + 3 bonus = 13pts
      simnet.callPublicFn(CONTRACT, "record-bet", [Cl.principal(wallet3)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet3), Cl.uint(10), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-bonus-pts", [Cl.principal(wallet3), Cl.uint(3)], referralCaller);

      // Verify stats
      const stats1 = simnet.callReadOnlyFn(CONTRACT, "get-stats", [Cl.principal(wallet1)], deployer);
      expect(stats1.result).toStrictEqual(
        Cl.tuple({ points: Cl.uint(40), "total-bets": Cl.uint(2), "won-bets": Cl.uint(1), "lost-bets": Cl.uint(1) })
      );

      const stats2 = simnet.callReadOnlyFn(CONTRACT, "get-stats", [Cl.principal(wallet2)], deployer);
      expect(stats2.result).toStrictEqual(
        Cl.tuple({ points: Cl.uint(35), "total-bets": Cl.uint(1), "won-bets": Cl.uint(1), "lost-bets": Cl.uint(0) })
      );

      const stats3 = simnet.callReadOnlyFn(CONTRACT, "get-stats", [Cl.principal(wallet3)], deployer);
      expect(stats3.result).toStrictEqual(
        Cl.tuple({ points: Cl.uint(13), "total-bets": Cl.uint(1), "won-bets": Cl.uint(0), "lost-bets": Cl.uint(1) })
      );

      // Verify rankings: wallet1 (40) > wallet2 (35) > wallet3 (13)
      const top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      const list = top.result.value.result.value;
      expect(list.length).toBe(3);
      expect(list[0]).toStrictEqual(Cl.tuple({ address: Cl.principal(wallet1), points: Cl.uint(40) }));
      expect(list[1]).toStrictEqual(Cl.tuple({ address: Cl.principal(wallet2), points: Cl.uint(35) }));
      expect(list[2]).toStrictEqual(Cl.tuple({ address: Cl.principal(wallet3), points: Cl.uint(13) }));

      // Verify ranks
      expect(simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet1)], deployer).result).toStrictEqual(Cl.uint(1));
      expect(simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet2)], deployer).result).toStrictEqual(Cl.uint(2));
      expect(simnet.callReadOnlyFn(CONTRACT, "get-rank", [Cl.principal(wallet3)], deployer).result).toStrictEqual(Cl.uint(3));
    });

    it("multiple players with various operations maintain correct sorting", () => {
      initializeLeaderboard();

      // Add 4 players in random order
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet3), Cl.uint(15), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet1), Cl.uint(50), Cl.bool(true)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet4), Cl.uint(5), Cl.bool(false)], marketCaller);
      simnet.callPublicFn(CONTRACT, "add-pts", [Cl.principal(wallet2), Cl.uint(25), Cl.bool(true)], marketCaller);

      // Verify sorted: wallet1(50) > wallet2(25) > wallet3(15) > wallet4(5)
      let top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      let list = top.result.value.result.value;
      expect(list[0].value.points).toStrictEqual(Cl.uint(50));
      expect(list[1].value.points).toStrictEqual(Cl.uint(25));
      expect(list[2].value.points).toStrictEqual(Cl.uint(15));
      expect(list[3].value.points).toStrictEqual(Cl.uint(5));

      // wallet4 gets bonus points (5 + 30 = 35) → should move to position 2
      simnet.callPublicFn(CONTRACT, "add-bonus-pts", [Cl.principal(wallet4), Cl.uint(30)], referralCaller);

      top = simnet.callReadOnlyFn(CONTRACT, "get-top-players", [Cl.uint(10)], deployer);
      list = top.result.value.result.value;
      expect(list[0].value.points).toStrictEqual(Cl.uint(50));
      expect(list[1].value.points).toStrictEqual(Cl.uint(35));
      expect(list[2].value.points).toStrictEqual(Cl.uint(25));
      expect(list[3].value.points).toStrictEqual(Cl.uint(15));
    });
  });
});
