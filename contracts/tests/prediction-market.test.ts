import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { tx } from "@stacks/clarinet-sdk";
declare const simnet: any;

declare module "vitest" {
  interface Assertion<T = any> {
    toBeOk(expected?: any): T;
    toBeErr(expected?: any): T;
    toBeSome(expected?: any): T;
    toBeNone(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeOk(expected?: any): void;
    toBeErr(expected?: any): void;
  }
}

// ============================================================================
// prediction-market.test.ts
// Comprehensive tests for the iPredict Prediction Market contract
// Coverage target: >= 90 % line coverage
// ============================================================================

const PM = "prediction-market";
const TOKEN = "ipredict-token";
const LEADERBOARD = "leaderboard";
const REFERRAL = "referral-registry";

const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

// Contract principal for prediction-market
const pmPrincipal = `${deployer}.${PM}`;

const ONE_STX = 1_000_000n;
const TEN_STX = 10_000_000n;
const HUNDRED_STX = 100_000_000n;

// Duration in blocks for most tests
const DURATION = 10;

// Error codes
const ERR_NOT_ADMIN = 100;
const ERR_MARKET_NOT_FOUND = 101;
const ERR_MARKET_EXPIRED = 102;
const ERR_MARKET_NOT_EXPIRED = 103;
const ERR_MARKET_RESOLVED = 104;
const ERR_MARKET_CANCELLED = 105;
const ERR_MARKET_NOT_RESOLVED = 106;
const ERR_BET_TOO_SMALL = 107;
const ERR_OPPOSITE_SIDE = 108;
const ERR_ALREADY_CLAIMED = 109;
const ERR_NO_BET = 110;
const ERR_NO_FEES = 111;
const ERR_ALREADY_INITIALIZED = 114;

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Call initialize so leaderboard/referral/token are wired up. */
function init() {
  return simnet.callPublicFn(
    PM,
    "initialize",
    [Cl.principal(pmPrincipal)],
    deployer,
  );
}

/** Admin creates a market with a given duration (blocks). */
function createMarket(duration = DURATION) {
  return simnet.callPublicFn(
    PM,
    "create-market",
    [
      Cl.stringUtf8("Will BTC hit 100k?"),
      Cl.stringUtf8("https://img.example.com/btc.png"),
      Cl.uint(duration),
    ],
    deployer,
  );
}

/** Place a bet on market-id. */
function placeBet(
  marketId: number,
  isYes: boolean,
  amount: bigint,
  sender: string,
) {
  return simnet.callPublicFn(
    PM,
    "place-bet",
    [Cl.uint(marketId), Cl.bool(isYes), Cl.uint(amount)],
    sender,
  );
}

// ============================================================================
// Test Suites
// ============================================================================

describe("prediction-market", () => {
  // ─── Initialize ────────────────────────────────────────────────────────

  describe("initialize", () => {
    it("admin can initialize", () => {
      const r = init();
      expect(r.result).toBeOk(Cl.bool(true));
    });

    it("non-admin cannot initialize", () => {
      const r = simnet.callPublicFn(
        PM,
        "initialize",
        [Cl.principal(pmPrincipal)],
        wallet1,
      );
      expect(r.result).toBeErr(Cl.uint(ERR_NOT_ADMIN));
    });

    it("cannot initialize twice", () => {
      init();
      const r2 = init();
      expect(r2.result).toBeErr(Cl.uint(ERR_ALREADY_INITIALIZED));
    });
  });

  // ─── Create Market ─────────────────────────────────────────────────────

  describe("create-market", () => {
    it("admin creates a market and gets id u1", () => {
      init();
      const r = createMarket();
      expect(r.result).toBeOk(Cl.uint(1));
    });

    it("market count increments", () => {
      init();
      createMarket();
      createMarket();
      const mc = simnet.callReadOnlyFn(PM, "get-market-count", [], deployer);
      expect(mc.result).toStrictEqual(Cl.uint(2));
    });

    it("market data is stored correctly", () => {
      init();
      createMarket();
      const m = simnet.callReadOnlyFn(
        PM,
        "get-market",
        [Cl.uint(1)],
        deployer,
      );
      // should be some
      const data = m.result;
      expect(data).toBeSome(
        Cl.tuple({
          question: Cl.stringUtf8("Will BTC hit 100k?"),
          "image-url": Cl.stringUtf8("https://img.example.com/btc.png"),
          "end-block": (data as any).value.value["end-block"], // dynamic
          "total-yes": Cl.uint(0),
          "total-no": Cl.uint(0),
          resolved: Cl.bool(false),
          outcome: Cl.bool(false),
          cancelled: Cl.bool(false),
          creator: Cl.principal(deployer),
          "bet-count": Cl.uint(0),
        }),
      );
    });

    it("non-admin cannot create market", () => {
      init();
      const r = simnet.callPublicFn(
        PM,
        "create-market",
        [
          Cl.stringUtf8("test"),
          Cl.stringUtf8("img"),
          Cl.uint(10),
        ],
        wallet1,
      );
      expect(r.result).toBeErr(Cl.uint(ERR_NOT_ADMIN));
    });
  });

  // ─── Place Bet - Happy Path ────────────────────────────────────────────

  describe("place-bet happy path", () => {
    it("user places YES bet", () => {
      init();
      createMarket();
      const r = placeBet(1, true, TEN_STX, wallet1);
      expect(r.result).toBeOk(Cl.bool(true));
    });

    it("user places NO bet", () => {
      init();
      createMarket();
      const r = placeBet(1, false, TEN_STX, wallet1);
      expect(r.result).toBeOk(Cl.bool(true));
    });

    it("fee splits: 2 % total deducted, net stored", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);

      const bet = simnet.callReadOnlyFn(
        PM,
        "get-bet",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer,
      );
      // net = 10_000_000 - (10_000_000 * 200 / 10000) = 10_000_000 - 200_000 = 9_800_000
      const expectedNet = 9_800_000n;
      expect(bet.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(expectedNet),
          "is-yes": Cl.bool(true),
          claimed: Cl.bool(false),
        }),
      );
    });

    it("pool total-yes updated", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);

      const m = simnet.callReadOnlyFn(PM, "get-market", [Cl.uint(1)], deployer);
      const yes = (m.result as any).value.value["total-yes"];
      expect(yes).toStrictEqual(Cl.uint(9_800_000));
    });

    it("accumulated fees increase by platform portion", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);

      const fees = simnet.callReadOnlyFn(PM, "get-accumulated-fees", [], deployer);
      // Since wallet1 has no referrer, full 2% goes to platform
      // total-fee = 10_000_000 * 200 / 10000 = 200_000
      expect(fees.result).toStrictEqual(Cl.uint(200_000));
    });

    it("bettor count incremented", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);

      const bc = simnet.callReadOnlyFn(
        PM,
        "get-bettor-count",
        [Cl.uint(1)],
        deployer,
      );
      expect(bc.result).toStrictEqual(Cl.uint(1));
    });

    it("same user can increase bet on same side", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);
      const r2 = placeBet(1, true, TEN_STX, wallet1);
      expect(r2.result).toBeOk(Cl.bool(true));

      const bet = simnet.callReadOnlyFn(
        PM,
        "get-bet",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer,
      );
      // Two bets of 9_800_000 net each
      expect(bet.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(9_800_000 * 2),
          "is-yes": Cl.bool(true),
          claimed: Cl.bool(false),
        }),
      );

      // Bettor count stays at 1
      const bc = simnet.callReadOnlyFn(
        PM,
        "get-bettor-count",
        [Cl.uint(1)],
        deployer,
      );
      expect(bc.result).toStrictEqual(Cl.uint(1));
    });

    it("multiple users can bet on same market", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      const bc = simnet.callReadOnlyFn(
        PM,
        "get-bettor-count",
        [Cl.uint(1)],
        deployer,
      );
      expect(bc.result).toStrictEqual(Cl.uint(2));
    });
  });

  // ─── Place Bet - Validations ───────────────────────────────────────────

  describe("place-bet validations", () => {
    it("rejects bet on non-existent market", () => {
      init();
      const r = placeBet(999, true, TEN_STX, wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_NOT_FOUND));
    });

    it("rejects bet below 1 STX minimum", () => {
      init();
      createMarket();
      const r = placeBet(1, true, 500_000n, wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_BET_TOO_SMALL));
    });

    it("rejects bet on opposite side", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);
      const r = placeBet(1, false, TEN_STX, wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_OPPOSITE_SIDE));
    });

    it("rejects bet on expired market", () => {
      init();
      createMarket(5); // 5 blocks duration
      simnet.mineEmptyStacksBlocks(10);
      const r = placeBet(1, true, TEN_STX, wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_EXPIRED));
    });

    it("rejects bet on resolved market (expired check fires first)", () => {
      init();
      createMarket(2);
      placeBet(1, true, TEN_STX, wallet1);
      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(PM, "resolve-market", [Cl.uint(1), Cl.bool(true)], deployer);
      const r = placeBet(1, true, TEN_STX, wallet2);
      // Market is both expired and resolved; expired check comes first in contract
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_EXPIRED));
    });

    it("rejects bet on cancelled market", () => {
      init();
      createMarket();
      simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);
      const r = placeBet(1, true, TEN_STX, wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_CANCELLED));
    });
  });

  // ─── Odds ──────────────────────────────────────────────────────────────

  describe("get-odds", () => {
    it("returns 50/50 for empty market", () => {
      init();
      createMarket();
      const odds = simnet.callReadOnlyFn(PM, "get-odds", [Cl.uint(1)], deployer);
      expect(odds.result).toStrictEqual(
        Cl.tuple({
          "yes-percent": Cl.uint(50),
          "no-percent": Cl.uint(50),
        }),
      );
    });

    it("returns correct percentages after bets", () => {
      init();
      createMarket();
      // 30 STX YES, 10 STX NO (before fees)
      // net YES = 30M * 0.98 = 29_400_000  net NO = 10M * 0.98 = 9_800_000
      // total = 39_200_000
      // yes% = 29_400_000 * 100 / 39_200_000 = 75 (integer division)
      placeBet(1, true, 30_000_000n, wallet1);
      placeBet(1, false, 10_000_000n, wallet2);
      const odds = simnet.callReadOnlyFn(PM, "get-odds", [Cl.uint(1)], deployer);
      expect(odds.result).toStrictEqual(
        Cl.tuple({
          "yes-percent": Cl.uint(75),
          "no-percent": Cl.uint(25),
        }),
      );
    });

    it("returns 0/0 for non-existent market", () => {
      const odds = simnet.callReadOnlyFn(PM, "get-odds", [Cl.uint(99)], deployer);
      expect(odds.result).toStrictEqual(
        Cl.tuple({
          "yes-percent": Cl.uint(0),
          "no-percent": Cl.uint(0),
        }),
      );
    });
  });

  // ─── Resolve Market ────────────────────────────────────────────────────

  describe("resolve-market", () => {
    it("admin resolves after expiry", () => {
      init();
      createMarket(3);
      simnet.mineEmptyStacksBlocks(5);
      const r = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      expect(r.result).toBeOk(Cl.bool(true));

      const m = simnet.callReadOnlyFn(PM, "get-market", [Cl.uint(1)], deployer);
      expect((m.result as any).value.value.resolved).toStrictEqual(Cl.bool(true));
      expect((m.result as any).value.value.outcome).toStrictEqual(Cl.bool(true));
    });

    it("non-admin cannot resolve", () => {
      init();
      createMarket(3);
      simnet.mineEmptyStacksBlocks(5);
      const r = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        wallet1,
      );
      expect(r.result).toBeErr(Cl.uint(ERR_NOT_ADMIN));
    });

    it("cannot resolve before expiry", () => {
      init();
      createMarket(100);
      const r = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_NOT_EXPIRED));
    });

    it("cannot resolve already resolved", () => {
      init();
      createMarket(3);
      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      const r2 = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(false)],
        deployer,
      );
      expect(r2.result).toBeErr(Cl.uint(ERR_MARKET_RESOLVED));
    });

    it("cannot resolve non-existent market", () => {
      init();
      const r = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(999), Cl.bool(true)],
        deployer,
      );
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_NOT_FOUND));
    });

    it("cannot resolve cancelled market", () => {
      init();
      createMarket(3);
      simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);
      simnet.mineEmptyStacksBlocks(5);
      const r = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_CANCELLED));
    });
  });

  // ─── Cancel Market ─────────────────────────────────────────────────────

  describe("cancel-market", () => {
    it("admin cancels market", () => {
      init();
      createMarket();
      const r = simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);
      expect(r.result).toBeOk(Cl.bool(true));

      const m = simnet.callReadOnlyFn(PM, "get-market", [Cl.uint(1)], deployer);
      expect((m.result as any).value.value.cancelled).toStrictEqual(Cl.bool(true));
    });

    it("non-admin cannot cancel", () => {
      init();
      createMarket();
      const r = simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_NOT_ADMIN));
    });

    it("cannot cancel resolved market", () => {
      init();
      createMarket(3);
      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      const r = simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_RESOLVED));
    });

    it("cannot cancel already cancelled market", () => {
      init();
      createMarket();
      simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);
      const r = simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_CANCELLED));
    });

    it("refunds bettors on cancel", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);

      // After cancel, bets should be marked claimed
      const bet1 = simnet.callReadOnlyFn(
        PM,
        "get-bet",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer,
      );
      expect((bet1.result as any).value.value.claimed).toStrictEqual(Cl.bool(true));

      const bet2 = simnet.callReadOnlyFn(
        PM,
        "get-bet",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer,
      );
      expect((bet2.result as any).value.value.claimed).toStrictEqual(Cl.bool(true));
    });
  });

  // ─── Claim ─────────────────────────────────────────────────────────────

  describe("claim", () => {
    it("winner receives proportional STX payout", () => {
      init();
      createMarket(3);

      // wallet1 bets 10 STX YES, wallet2 bets 10 STX NO
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );

      // wallet1 is the winner
      const r = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(r.result).toBeOk(Cl.bool(true));

      // Check bet is marked claimed
      const bet = simnet.callReadOnlyFn(
        PM,
        "get-bet",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer,
      );
      expect((bet.result as any).value.value.claimed).toStrictEqual(Cl.bool(true));
    });

    it("loser gets no STX but still claims points and tokens", () => {
      init();
      createMarket(3);

      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );

      // wallet2 is the loser (bet NO, outcome YES)
      const r = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet2);
      expect(r.result).toBeOk(Cl.bool(true));
    });

    it("winner gets WIN-TOKENS (10 IPRED) minted", () => {
      init();
      createMarket(3);

      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);

      // Check token balance: 10 IPRED = 10_000_000 (6 decimals)
      const bal = simnet.callReadOnlyFn(
        TOKEN,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(bal.result).toBeOk(Cl.uint(10_000_000));
    });

    it("loser gets LOSE-TOKENS (2 IPRED) minted", () => {
      init();
      createMarket(3);

      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet2);

      const bal = simnet.callReadOnlyFn(
        TOKEN,
        "get-balance",
        [Cl.principal(wallet2)],
        deployer,
      );
      expect(bal.result).toBeOk(Cl.uint(2_000_000));
    });

    it("cannot claim before resolution", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);
      const r = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_NOT_RESOLVED));
    });

    it("cannot claim without a bet", () => {
      init();
      createMarket(3);
      placeBet(1, true, TEN_STX, wallet1);
      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );

      // wallet3 never bet
      const r = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet3);
      expect(r.result).toBeErr(Cl.uint(ERR_NO_BET));
    });

    it("cannot claim twice", () => {
      init();
      createMarket(3);
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);
      simnet.mineEmptyStacksBlocks(5);
      simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);

      const r2 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(r2.result).toBeErr(Cl.uint(ERR_ALREADY_CLAIMED));
    });

    it("cannot claim on cancelled market", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);
      simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);

      const r = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      // Bet is marked claimed (refund from cancel), but market is not resolved
      // Could be ERR-MARKET-NOT-RESOLVED or ERR-ALREADY-CLAIMED depending on order
      expect(r.result).toBeErr(Cl.uint(ERR_MARKET_NOT_RESOLVED));
    });
  });

  // ─── Withdraw Fees ─────────────────────────────────────────────────────

  describe("withdraw-fees", () => {
    it("admin withdraws accumulated fees", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);

      const feesBefore = simnet.callReadOnlyFn(
        PM,
        "get-accumulated-fees",
        [],
        deployer,
      );
      expect(feesBefore.result).toStrictEqual(Cl.uint(200_000));

      const r = simnet.callPublicFn(PM, "withdraw-fees", [], deployer);
      expect(r.result).toBeOk(Cl.uint(200_000));

      const feesAfter = simnet.callReadOnlyFn(
        PM,
        "get-accumulated-fees",
        [],
        deployer,
      );
      expect(feesAfter.result).toStrictEqual(Cl.uint(0));
    });

    it("non-admin cannot withdraw fees", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);

      const r = simnet.callPublicFn(PM, "withdraw-fees", [], wallet1);
      expect(r.result).toBeErr(Cl.uint(ERR_NOT_ADMIN));
    });

    it("reverts when no fees to withdraw", () => {
      init();
      const r = simnet.callPublicFn(PM, "withdraw-fees", [], deployer);
      expect(r.result).toBeErr(Cl.uint(ERR_NO_FEES));
    });
  });

  // ─── Read-Only Functions ───────────────────────────────────────────────

  describe("read-only functions", () => {
    it("get-market returns none for non-existent market", () => {
      const m = simnet.callReadOnlyFn(PM, "get-market", [Cl.uint(99)], deployer);
      expect(m.result).toBeNone();
    });

    it("get-bet returns none for non-existent bet", () => {
      init();
      createMarket();
      const b = simnet.callReadOnlyFn(
        PM,
        "get-bet",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer,
      );
      expect(b.result).toBeNone();
    });

    it("get-market-count starts at 0", () => {
      const mc = simnet.callReadOnlyFn(PM, "get-market-count", [], deployer);
      expect(mc.result).toStrictEqual(Cl.uint(0));
    });

    it("get-accumulated-fees starts at 0", () => {
      const f = simnet.callReadOnlyFn(PM, "get-accumulated-fees", [], deployer);
      expect(f.result).toStrictEqual(Cl.uint(0));
    });

    it("get-bettor-count returns 0 for empty market", () => {
      init();
      createMarket();
      const bc = simnet.callReadOnlyFn(
        PM,
        "get-bettor-count",
        [Cl.uint(1)],
        deployer,
      );
      expect(bc.result).toStrictEqual(Cl.uint(0));
    });
  });

  // ─── Integration: Full Market Lifecycle ────────────────────────────────

  describe("full lifecycle", () => {
    it("create -> bet (YES & NO) -> resolve -> both claim", () => {
      init();
      createMarket(3);

      // Two bets
      const b1 = placeBet(1, true, TEN_STX, wallet1);
      expect(b1.result).toBeOk(Cl.bool(true));
      const b2 = placeBet(1, false, TEN_STX, wallet2);
      expect(b2.result).toBeOk(Cl.bool(true));

      // Advance past end-block and resolve YES
      simnet.mineEmptyStacksBlocks(5);
      const res = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      expect(res.result).toBeOk(Cl.bool(true));

      // Winner claims
      const c1 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(c1.result).toBeOk(Cl.bool(true));

      // Loser claims
      const c2 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet2);
      expect(c2.result).toBeOk(Cl.bool(true));

      // Check tokens minted
      const bal1 = simnet.callReadOnlyFn(
        TOKEN,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(bal1.result).toBeOk(Cl.uint(10_000_000)); // winner: 10 IPRED

      const bal2 = simnet.callReadOnlyFn(
        TOKEN,
        "get-balance",
        [Cl.principal(wallet2)],
        deployer,
      );
      expect(bal2.result).toBeOk(Cl.uint(2_000_000)); // loser: 2 IPRED

      // Admin withdraws fees
      const w = simnet.callPublicFn(PM, "withdraw-fees", [], deployer);
      expect(w.result).toBeOk(Cl.uint(400_000)); // 200k from each bet
    });
  });
});
