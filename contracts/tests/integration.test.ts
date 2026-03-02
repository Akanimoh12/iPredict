import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
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
// integration.test.ts — Cross-contract integration tests for iPredict
// Tests the full flow across prediction-market, leaderboard, referral-registry,
// and ipredict-token contracts.
// ============================================================================

const PM = "prediction-market";
const TOKEN = "ipredict-token";
const LEADERBOARD = "leaderboard";
const REFERRAL = "referral-registry";

const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";
const wallet4 = "ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND";

const pmPrincipal = `${deployer}.${PM}`;
const referralPrincipal = `${deployer}.${REFERRAL}`;

const ONE_STX = 1_000_000n;
const TEN_STX = 10_000_000n;
const FIFTY_STX = 50_000_000n;
const HUNDRED_STX = 100_000_000n;

// Fee constants
const TOTAL_FEE_BPS = 200n;  // 2%
const PLATFORM_FEE_BPS = 150n; // 1.5%
const BPS_DENOM = 10000n;

// Reward constants
const WIN_POINTS = 30;
const LOSE_POINTS = 10;
const WIN_TOKENS = 10_000_000n; // 10 IPRED
const LOSE_TOKENS = 2_000_000n; // 2 IPRED
const WELCOME_BONUS_POINTS = 5;
const WELCOME_BONUS_TOKENS = 1_000_000n; // 1 IPRED
const REFERRAL_BET_POINTS = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function init() {
  return simnet.callPublicFn(PM, "initialize", [Cl.principal(pmPrincipal)], deployer);
}

function createMarket(duration = 10) {
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

function placeBet(marketId: number, isYes: boolean, amount: bigint, sender: string) {
  return simnet.callPublicFn(
    PM,
    "place-bet",
    [Cl.uint(marketId), Cl.bool(isYes), Cl.uint(amount)],
    sender,
  );
}

function registerReferral(displayName: string, referrer: string | null, sender: string) {
  const refArg = referrer ? Cl.some(Cl.principal(referrer)) : Cl.none();
  return simnet.callPublicFn(
    REFERRAL,
    "register-referral",
    [Cl.stringUtf8(displayName), refArg],
    sender,
  );
}

function getPoints(user: string): bigint {
  const r = simnet.callReadOnlyFn(LEADERBOARD, "get-points", [Cl.principal(user)], deployer);
  return (r.result as any).value;
}

function getStats(user: string) {
  const r = simnet.callReadOnlyFn(LEADERBOARD, "get-stats", [Cl.principal(user)], deployer);
  return (r.result as any).value;
}

function getTokenBalance(user: string): bigint {
  const r = simnet.callReadOnlyFn(TOKEN, "get-balance", [Cl.principal(user)], deployer);
  return (r.result as any).value.value;
}

function getAccumulatedFees(): bigint {
  const r = simnet.callReadOnlyFn(PM, "get-accumulated-fees", [], deployer);
  return (r.result as any).value;
}

function getMarket(marketId: number) {
  return simnet.callReadOnlyFn(PM, "get-market", [Cl.uint(marketId)], deployer);
}

function getBet(marketId: number, user: string) {
  return simnet.callReadOnlyFn(
    PM,
    "get-bet",
    [Cl.uint(marketId), Cl.principal(user)],
    deployer,
  );
}

// ============================================================================
// Tests
// ============================================================================

describe("iPredict Integration Tests", () => {
  // ─── Full Lifecycle: Create → Bet → Resolve → Claim → Withdraw ──────

  describe("full lifecycle with referral", () => {
    it("complete flow: register referrals, create market, bet, resolve, claim, withdraw", () => {
      // 1. Initialize all contracts
      const initResult = init();
      expect(initResult.result).toBeOk(Cl.bool(true));

      // 2. Register wallet3 as referrer (no referrer)
      const reg3 = registerReferral("Referrer3", null, wallet3);
      expect(reg3.result).toBeOk(Cl.bool(true));

      // Verify wallet3 got welcome bonus: 5 points + 1 IPRED
      expect(getPoints(wallet3)).toBe(BigInt(WELCOME_BONUS_POINTS));
      expect(getTokenBalance(wallet3)).toBe(WELCOME_BONUS_TOKENS);

      // 3. Register wallet1 WITH wallet3 as referrer
      const reg1 = registerReferral("Player1", wallet3, wallet1);
      expect(reg1.result).toBeOk(Cl.bool(true));

      // wallet1 also gets welcome bonus
      expect(getPoints(wallet1)).toBe(BigInt(WELCOME_BONUS_POINTS));
      expect(getTokenBalance(wallet1)).toBe(WELCOME_BONUS_TOKENS);

      // Verify wallet3 has 1 referral
      const refCount = simnet.callReadOnlyFn(
        REFERRAL,
        "get-referral-count",
        [Cl.principal(wallet3)],
        deployer,
      );
      expect(refCount.result).toStrictEqual(Cl.uint(1));

      // 4. Register wallet2 without referrer
      const reg2 = registerReferral("Player2", null, wallet2);
      expect(reg2.result).toBeOk(Cl.bool(true));

      // 5. Admin creates a market (3-block duration)
      const cm = createMarket(10);
      expect(cm.result).toBeOk(Cl.uint(1));

      // 6. wallet1 (HAS referrer = wallet3) places YES bet of 10 STX
      const feesBeforeBet1 = getAccumulatedFees();
      const bet1 = placeBet(1, true, TEN_STX, wallet1);
      expect(bet1.result).toBeOk(Cl.bool(true));

      // Fee calculation for 10 STX:
      //   total-fee = 10_000_000 * 200 / 10000 = 200_000
      //   platform-fee = 10_000_000 * 150 / 10000 = 150_000
      //   referral-fee = 200_000 - 150_000 = 50_000
      //   net = 10_000_000 - 200_000 = 9_800_000
      const totalFee1 = (TEN_STX * TOTAL_FEE_BPS) / BPS_DENOM;     // 200_000
      const platformFee1 = (TEN_STX * PLATFORM_FEE_BPS) / BPS_DENOM; // 150_000
      const referralFee1 = totalFee1 - platformFee1;                 // 50_000
      const net1 = TEN_STX - totalFee1;                             // 9_800_000

      // Verify: wallet1 has a referrer, so referral fee was routed:
      //   accumulated-fees should increase by platform-fee (150_000) only
      //   because referral-fee (50_000) was sent to the referrer (wallet3)
      const feesAfterBet1 = getAccumulatedFees();
      expect(feesAfterBet1 - feesBeforeBet1).toBe(platformFee1);

      // Verify referrer (wallet3) earned referral bonus points (3 pts from credit)
      // Total: 5 welcome + 3 referral = 8
      expect(getPoints(wallet3)).toBe(BigInt(WELCOME_BONUS_POINTS + REFERRAL_BET_POINTS));

      // Verify referral earnings recorded
      const earnings = simnet.callReadOnlyFn(
        REFERRAL,
        "get-earnings",
        [Cl.principal(wallet3)],
        deployer,
      );
      expect(earnings.result).toStrictEqual(Cl.uint(referralFee1));

      // Verify bet stored correctly
      const betData1 = getBet(1, wallet1);
      expect(betData1.result).toBeSome(
        Cl.tuple({
          amount: Cl.uint(net1),
          "is-yes": Cl.bool(true),
          claimed: Cl.bool(false),
        }),
      );

      // Verify leaderboard recorded the bet
      const stats1 = getStats(wallet1);
      expect(stats1["total-bets"]).toStrictEqual(Cl.uint(1));

      // 7. wallet2 (NO referrer) places NO bet of 10 STX
      const feesBeforeBet2 = getAccumulatedFees();
      const bet2 = placeBet(1, false, TEN_STX, wallet2);
      expect(bet2.result).toBeOk(Cl.bool(true));

      // wallet2 has NO referrer → full 2% goes to accumulated-fees
      const totalFee2 = (TEN_STX * TOTAL_FEE_BPS) / BPS_DENOM; // 200_000
      const feesAfterBet2 = getAccumulatedFees();
      expect(feesAfterBet2 - feesBeforeBet2).toBe(totalFee2);

      // 8. Mine blocks to expire the market, then admin resolves YES
      simnet.mineEmptyStacksBlocks(15);
      const resolve = simnet.callPublicFn(
        PM,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer,
      );
      expect(resolve.result).toBeOk(Cl.bool(true));

      // Verify market is resolved
      const marketAfterResolve = getMarket(1);
      expect((marketAfterResolve.result as any).value.value.resolved).toStrictEqual(
        Cl.bool(true),
      );
      expect((marketAfterResolve.result as any).value.value.outcome).toStrictEqual(
        Cl.bool(true),
      );

      // 9. Winner (wallet1) claims → STX payout + 30 pts + 10 IPRED
      const pointsBefore1 = getPoints(wallet1);
      const tokensBefore1 = getTokenBalance(wallet1);
      const claim1 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(claim1.result).toBeOk(Cl.bool(true));

      // Winner gets 30 points and 10 IPRED minted
      const pointsAfter1 = getPoints(wallet1);
      expect(pointsAfter1 - pointsBefore1).toBe(BigInt(WIN_POINTS));
      const tokensAfter1 = getTokenBalance(wallet1);
      expect(tokensAfter1 - tokensBefore1).toBe(WIN_TOKENS);

      // Winner payout: (user-net * total-pool) / winning-pool
      //   total-pool = 9_800_000 + 9_800_000 = 19_600_000
      //   winning-pool (YES) = 9_800_000
      //   payout = (9_800_000 * 19_600_000) / 9_800_000 = 19_600_000
      // Winner bet is marked claimed
      const betAfterClaim1 = getBet(1, wallet1);
      expect((betAfterClaim1.result as any).value.value.claimed).toStrictEqual(
        Cl.bool(true),
      );

      // Leaderboard updated: won-bets incremented
      const stats1After = getStats(wallet1);
      expect(stats1After["won-bets"]).toStrictEqual(Cl.uint(1));

      // 10. Loser (wallet2) claims → 0 STX + 10 pts + 2 IPRED
      const pointsBefore2 = getPoints(wallet2);
      const tokensBefore2 = getTokenBalance(wallet2);
      const claim2 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet2);
      expect(claim2.result).toBeOk(Cl.bool(true));

      const pointsAfter2 = getPoints(wallet2);
      expect(pointsAfter2 - pointsBefore2).toBe(BigInt(LOSE_POINTS));
      const tokensAfter2 = getTokenBalance(wallet2);
      expect(tokensAfter2 - tokensBefore2).toBe(LOSE_TOKENS);

      // Leaderboard updated: lost-bets incremented
      const stats2After = getStats(wallet2);
      expect(stats2After["lost-bets"]).toStrictEqual(Cl.uint(1));

      // 11. Admin withdraws accumulated fees
      const totalFees = getAccumulatedFees();
      expect(totalFees).toBeGreaterThan(0n);
      const withdraw = simnet.callPublicFn(PM, "withdraw-fees", [], deployer);
      expect(withdraw.result).toBeOk(Cl.uint(totalFees));

      // Fees should be 0 after withdrawal
      expect(getAccumulatedFees()).toBe(0n);
    });
  });

  // ─── Cancel Market Flow ──────────────────────────────────────────────

  describe("cancel market flow with refunds", () => {
    it("admin creates market, users bet, admin cancels, bettors are refunded", () => {
      init();

      // Create a market
      const cm = createMarket(50);
      expect(cm.result).toBeOk(Cl.uint(1));

      // wallet1 bets YES 10 STX, wallet2 bets NO 10 STX
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      // Record STX balances before cancel
      const bal1Before = simnet.getAssetsMap().get("STX")?.get(wallet1) ?? 0n;
      const bal2Before = simnet.getAssetsMap().get("STX")?.get(wallet2) ?? 0n;

      // Admin cancels the market
      const cancel = simnet.callPublicFn(PM, "cancel-market", [Cl.uint(1)], deployer);
      expect(cancel.result).toBeOk(Cl.bool(true));

      // Market is marked cancelled
      const market = getMarket(1);
      expect((market.result as any).value.value.cancelled).toStrictEqual(Cl.bool(true));

      // Both bettors' bets are marked as claimed (refunded)
      const bet1 = getBet(1, wallet1);
      expect((bet1.result as any).value.value.claimed).toStrictEqual(Cl.bool(true));
      const bet2 = getBet(1, wallet2);
      expect((bet2.result as any).value.value.claimed).toStrictEqual(Cl.bool(true));

      // Bettors received their net amounts back
      const bal1After = simnet.getAssetsMap().get("STX")?.get(wallet1) ?? 0n;
      const bal2After = simnet.getAssetsMap().get("STX")?.get(wallet2) ?? 0n;

      // Net refund = 9_800_000 (amount after fee deduction)
      const net = TEN_STX - (TEN_STX * TOTAL_FEE_BPS) / BPS_DENOM;
      expect(bal1After - bal1Before).toBe(net);
      expect(bal2After - bal2Before).toBe(net);

      // No claims possible after cancel -- contract checks resolved first
      const claimResult = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(claimResult.result).toBeErr(Cl.uint(106)); // ERR-MARKET-NOT-RESOLVED (checked before cancelled)
    });
  });

  // ─── Fee Split Verification ──────────────────────────────────────────

  describe("fee split verification", () => {
    it("user WITH referrer: 1.5% platform + 0.5% to referrer", () => {
      init();
      registerReferral("Ref", null, wallet3);
      registerReferral("Bettor", wallet3, wallet1);
      createMarket();

      const feesBefore = getAccumulatedFees();
      placeBet(1, true, HUNDRED_STX, wallet1);

      // 100 STX bet:
      //   total-fee    = 100_000_000 * 200 / 10000 = 2_000_000
      //   platform-fee = 100_000_000 * 150 / 10000 = 1_500_000
      //   referral-fee = 2_000_000 - 1_500_000 = 500_000
      const feesAfter = getAccumulatedFees();
      const platformFee = (HUNDRED_STX * PLATFORM_FEE_BPS) / BPS_DENOM;
      expect(feesAfter - feesBefore).toBe(platformFee); // 1_500_000

      // Referrer earned 500_000 in referral earnings
      const earnings = simnet.callReadOnlyFn(
        REFERRAL,
        "get-earnings",
        [Cl.principal(wallet3)],
        deployer,
      );
      expect(earnings.result).toStrictEqual(Cl.uint(500_000));
    });

    it("user WITHOUT referrer: full 2% to accumulated-fees", () => {
      init();
      createMarket();

      const feesBefore = getAccumulatedFees();
      placeBet(1, true, HUNDRED_STX, wallet1);

      const totalFee = (HUNDRED_STX * TOTAL_FEE_BPS) / BPS_DENOM; // 2_000_000
      const feesAfter = getAccumulatedFees();
      expect(feesAfter - feesBefore).toBe(totalFee); // Full 2% stays as platform fees
    });
  });

  // ─── Inter-Contract Authorization ────────────────────────────────────

  describe("inter-contract authorization", () => {
    it("leaderboard rejects calls from unauthorized contracts", () => {
      init();
      // Direct call to leaderboard.add-pts should fail (contract-caller is deployer, not prediction-market)
      const r = simnet.callPublicFn(
        LEADERBOARD,
        "add-pts",
        [Cl.principal(wallet1), Cl.uint(10), Cl.bool(true)],
        deployer,
      );
      expect(r.result).toBeErr(Cl.uint(201)); // ERR-UNAUTHORIZED
    });

    it("leaderboard rejects add-bonus-pts from unauthorized caller", () => {
      init();
      const r = simnet.callPublicFn(
        LEADERBOARD,
        "add-bonus-pts",
        [Cl.principal(wallet1), Cl.uint(10)],
        deployer,
      );
      expect(r.result).toBeErr(Cl.uint(201)); // ERR-UNAUTHORIZED
    });

    it("referral-registry rejects credit from unauthorized caller", () => {
      init();
      const r = simnet.callPublicFn(
        REFERRAL,
        "credit",
        [Cl.principal(wallet1), Cl.uint(1000)],
        deployer,
      );
      expect(r.result).toBeErr(Cl.uint(301)); // ERR-UNAUTHORIZED
    });

    it("ipredict-token rejects mint from unauthorized caller", () => {
      init();
      const r = simnet.callPublicFn(
        TOKEN,
        "mint",
        [Cl.principal(wallet1), Cl.uint(1000)],
        deployer,
      );
      expect(r.result).toBeErr(Cl.uint(101)); // ERR-UNAUTHORIZED-MINTER
    });

    it("referral-registry can mint tokens (authorized as minter)", () => {
      init();
      // Registering calls .ipredict-token mint — if referral-registry is authorized, this works
      const reg = registerReferral("TestUser", null, wallet1);
      expect(reg.result).toBeOk(Cl.bool(true));
      expect(getTokenBalance(wallet1)).toBe(WELCOME_BONUS_TOKENS);
    });
  });

  // ─── Multiple Claims in Sequence ─────────────────────────────────────

  describe("multiple bettors claiming in sequence", () => {
    it("three winners and one loser all claim correctly", () => {
      init();
      createMarket(20); // enough blocks for 4 bets

      // 3 YES bettors, 1 NO bettor
      const b1 = placeBet(1, true, TEN_STX, wallet1);
      expect(b1.result).toBeOk(Cl.bool(true));
      const b2 = placeBet(1, true, 20_000_000n, wallet2); // 20 STX
      expect(b2.result).toBeOk(Cl.bool(true));
      const b3 = placeBet(1, true, 30_000_000n, wallet3); // 30 STX
      expect(b3.result).toBeOk(Cl.bool(true));
      const b4 = placeBet(1, false, FIFTY_STX, wallet4);  // 50 STX
      expect(b4.result).toBeOk(Cl.bool(true));

      simnet.mineEmptyStacksBlocks(25);
      const resolveRes = simnet.callPublicFn(PM, "resolve-market", [Cl.uint(1), Cl.bool(true)], deployer);
      expect(resolveRes.result).toBeOk(Cl.bool(true));

      // All YES bettors are winners
      const claim1 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(claim1.result).toBeOk(Cl.bool(true));

      const claim2 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet2);
      expect(claim2.result).toBeOk(Cl.bool(true));

      const claim3 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet3);
      expect(claim3.result).toBeOk(Cl.bool(true));

      // wallet4 is the loser
      const claim4 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet4);
      expect(claim4.result).toBeOk(Cl.bool(true));

      // Verify points: winners got 30 pts, loser got 10 pts
      expect(getPoints(wallet1)).toBe(BigInt(WIN_POINTS));
      expect(getPoints(wallet2)).toBe(BigInt(WIN_POINTS));
      expect(getPoints(wallet3)).toBe(BigInt(WIN_POINTS));
      expect(getPoints(wallet4)).toBe(BigInt(LOSE_POINTS));

      // Verify leaderboard stats
      const s1 = getStats(wallet1);
      expect(s1["won-bets"]).toStrictEqual(Cl.uint(1));
      const s4 = getStats(wallet4);
      expect(s4["lost-bets"]).toStrictEqual(Cl.uint(1));
    });
  });

  // ─── Cross-Contract Token Flow ───────────────────────────────────────

  describe("cross-contract token minting flow", () => {
    it("registration mints welcome tokens via referral-registry → ipredict-token", () => {
      init();
      const balBefore = getTokenBalance(wallet1);
      registerReferral("User1", null, wallet1);
      const balAfter = getTokenBalance(wallet1);
      expect(balAfter - balBefore).toBe(WELCOME_BONUS_TOKENS); // 1 IPRED
    });

    it("winner claim mints WIN-TOKENS via prediction-market → ipredict-token", () => {
      init();
      createMarket(10);
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);
      simnet.mineEmptyStacksBlocks(15);
      simnet.callPublicFn(PM, "resolve-market", [Cl.uint(1), Cl.bool(true)], deployer);

      const balBefore = getTokenBalance(wallet1);
      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      const balAfter = getTokenBalance(wallet1);
      expect(balAfter - balBefore).toBe(WIN_TOKENS); // 10 IPRED
    });

    it("loser claim mints LOSE-TOKENS via prediction-market → ipredict-token", () => {
      init();
      createMarket(10);
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);
      simnet.mineEmptyStacksBlocks(15);
      simnet.callPublicFn(PM, "resolve-market", [Cl.uint(1), Cl.bool(true)], deployer);

      const balBefore = getTokenBalance(wallet2);
      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet2);
      const balAfter = getTokenBalance(wallet2);
      expect(balAfter - balBefore).toBe(LOSE_TOKENS); // 2 IPRED
    });
  });

  // ─── Leaderboard Cross-Contract Tracking ─────────────────────────────

  describe("leaderboard tracking across contracts", () => {
    it("record-bet increments total-bets on each bet", () => {
      init();
      createMarket();

      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, true, TEN_STX, wallet1); // second bet same side

      const stats = getStats(wallet1);
      expect(stats["total-bets"]).toStrictEqual(Cl.uint(2));
    });

    it("add-bonus-pts awards referral points without affecting won/lost counters", () => {
      init();
      registerReferral("Ref", null, wallet3);
      registerReferral("Player", wallet3, wallet1);
      createMarket();

      placeBet(1, true, TEN_STX, wallet1);

      // wallet3 gets 5 welcome + 3 referral bonus pts
      const stats3 = getStats(wallet3);
      expect(stats3["won-bets"]).toStrictEqual(Cl.uint(0));
      expect(stats3["lost-bets"]).toStrictEqual(Cl.uint(0));
      expect(stats3.points).toStrictEqual(Cl.uint(WELCOME_BONUS_POINTS + REFERRAL_BET_POINTS));
    });

    it("top players list updated after claims", () => {
      init();
      createMarket(10);
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);
      simnet.mineEmptyStacksBlocks(15);
      simnet.callPublicFn(PM, "resolve-market", [Cl.uint(1), Cl.bool(true)], deployer);

      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet2);

      const topPlayers = simnet.callReadOnlyFn(
        LEADERBOARD,
        "get-top-players",
        [Cl.uint(10)],
        deployer,
      );
      // get-top-players returns a tuple { limit: uint, result: (list ...) }
      // In TupleCV v7: .value has keys. result is a ListCV whose .value is an array
      const topResult = (topPlayers.result as any).value;
      const playerList = topResult.result.value;
      expect(playerList.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("minimum bet of exactly 1 STX is accepted", () => {
      init();
      createMarket();
      const r = placeBet(1, true, ONE_STX, wallet1);
      expect(r.result).toBeOk(Cl.bool(true));
    });

    it("bet below 1 STX is rejected", () => {
      init();
      createMarket();
      const r = placeBet(1, true, 999_999n, wallet1);
      expect(r.result).toBeErr(Cl.uint(107)); // ERR-BET-TOO-SMALL
    });

    it("cannot double-claim after resolution", () => {
      init();
      createMarket(10);
      placeBet(1, true, TEN_STX, wallet1);
      simnet.mineEmptyStacksBlocks(15);
      simnet.callPublicFn(PM, "resolve-market", [Cl.uint(1), Cl.bool(true)], deployer);

      simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      const r2 = simnet.callPublicFn(PM, "claim", [Cl.uint(1)], wallet1);
      expect(r2.result).toBeErr(Cl.uint(109)); // ERR-ALREADY-CLAIMED
    });

    it("referral fee routing when referrer has no STX balance (bookkeeping still works)", () => {
      init();
      registerReferral("Ref", null, wallet3);
      registerReferral("Player", wallet3, wallet1);
      createMarket();

      // wallet1 places bet — referral fee sent from contract to wallet3
      const bet = placeBet(1, true, TEN_STX, wallet1);
      expect(bet.result).toBeOk(Cl.bool(true));

      // Referrer earnings recorded
      const earnings = simnet.callReadOnlyFn(
        REFERRAL,
        "get-earnings",
        [Cl.principal(wallet3)],
        deployer,
      );
      expect(earnings.result).toStrictEqual(
        Cl.uint((TEN_STX * TOTAL_FEE_BPS) / BPS_DENOM - (TEN_STX * PLATFORM_FEE_BPS) / BPS_DENOM),
      );
    });
  });

  // ─── get-market-bettors coverage ─────────────────────────────────────

  describe("get-market-bettors", () => {
    it("returns list of bettors for a market", () => {
      init();
      createMarket();
      placeBet(1, true, TEN_STX, wallet1);
      placeBet(1, false, TEN_STX, wallet2);

      const bettors = simnet.callReadOnlyFn(
        PM,
        "get-market-bettors",
        [Cl.uint(1)],
        deployer,
      );
      const list = (bettors.result as any).value;
      expect(list.length).toBe(2);
    });

    it("returns empty list for market with no bets", () => {
      init();
      createMarket();

      const bettors = simnet.callReadOnlyFn(
        PM,
        "get-market-bettors",
        [Cl.uint(1)],
        deployer,
      );
      const list = (bettors.result as any).value;
      expect(list.length).toBe(0);
    });
  });

  // ─── Seed Market Creation ────────────────────────────────────────────

  describe("seed market creation", () => {
    it("creates 4 seed markets with correct data", () => {
      init();

      // Market 1: Bitcoin $150k
      const m1 = simnet.callPublicFn(
        PM,
        "create-market",
        [
          Cl.stringUtf8("Will Bitcoin surpass $150,000 by June 30, 2026?"),
          Cl.stringUtf8("https://s2.coinmarketcap.com/static/img/coins/200x200/1.png"),
          Cl.uint(1_785_600),
        ],
        deployer,
      );
      expect(m1.result).toBeOk(Cl.uint(1));

      // Market 2: STX $5
      const m2 = simnet.callPublicFn(
        PM,
        "create-market",
        [
          Cl.stringUtf8("Will STX reach $5 by May 15, 2026?"),
          Cl.stringUtf8("https://s2.coinmarketcap.com/static/img/coins/200x200/4847.png"),
          Cl.uint(1_123_200),
        ],
        deployer,
      );
      expect(m2.result).toBeOk(Cl.uint(2));

      // Market 3: Ethereum $8k
      const m3 = simnet.callPublicFn(
        PM,
        "create-market",
        [
          Cl.stringUtf8("Will Ethereum surpass $8,000 by July 31, 2026?"),
          Cl.stringUtf8("https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png"),
          Cl.uint(2_228_480),
        ],
        deployer,
      );
      expect(m3.result).toBeOk(Cl.uint(3));

      // Market 4: Solana vs BNB
      const m4 = simnet.callPublicFn(
        PM,
        "create-market",
        [
          Cl.stringUtf8("Will Solana flip BNB in market cap by April 30, 2026?"),
          Cl.stringUtf8("https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png"),
          Cl.uint(907_200),
        ],
        deployer,
      );
      expect(m4.result).toBeOk(Cl.uint(4));

      // Verify 4 markets created
      const count = simnet.callReadOnlyFn(PM, "get-market-count", [], deployer);
      expect(count.result).toStrictEqual(Cl.uint(4));

      // Verify market 1 data
      const market1 = getMarket(1);
      const data1 = (market1.result as any).value.value;
      expect(data1.question).toStrictEqual(
        Cl.stringUtf8("Will Bitcoin surpass $150,000 by June 30, 2026?"),
      );

      // Verify market 2 data
      const market2 = getMarket(2);
      const data2 = (market2.result as any).value.value;
      expect(data2.question).toStrictEqual(
        Cl.stringUtf8("Will STX reach $5 by May 15, 2026?"),
      );

      // Verify market 3 data
      const market3 = getMarket(3);
      const data3 = (market3.result as any).value.value;
      expect(data3.question).toStrictEqual(
        Cl.stringUtf8("Will Ethereum surpass $8,000 by July 31, 2026?"),
      );

      // Verify market 4 data
      const market4 = getMarket(4);
      const data4 = (market4.result as any).value.value;
      expect(data4.question).toStrictEqual(
        Cl.stringUtf8("Will Solana flip BNB in market cap by April 30, 2026?"),
      );
    });
  });
});
