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
// referral-registry.test.ts
// Tests for the iPredict Referral Registry contract
// Coverage target: >= 90% line coverage
// ============================================================================

const CONTRACT = "referral-registry";
const LEADERBOARD = "leaderboard";
const TOKEN = "ipredict-token";

// Devnet account addresses (from settings/Devnet.toml)
const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";
const wallet4 = "ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND";
const wallet5 = "ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB";

// Contract principal for referral-registry (needed for inter-contract auth)
const referralContractPrincipal = `${deployer}.${CONTRACT}`;

// For testing credit(), we need an authorized market-contract caller.
// In simnet when we call credit directly, contract-caller == tx-sender.
const marketCaller = wallet4;

// Error codes from referral-registry
const ERR_NOT_ADMIN = 300;
const ERR_UNAUTHORIZED = 301;
const ERR_ALREADY_REGISTERED = 302;
const ERR_SELF_REFERRAL = 303;
const ERR_ALREADY_INITIALIZED = 304;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Set up all cross-contract authorization so referral-registry's
 * register-referral and credit functions can call leaderboard and token.
 *
 * 1. Initialize leaderboard with referral-registry as authorized referral-contract
 *    (uses any principal for market-contract since we don't test it here).
 * 2. Set referral-registry as an authorized minter on ipredict-token.
 * 3. Initialize referral-registry with the authorized market caller.
 */
function fullSetup() {
  // Initialize leaderboard: market=wallet4, referral=referral-registry contract
  simnet.callPublicFn(
    LEADERBOARD,
    "initialize",
    [
      Cl.principal(marketCaller),
      Cl.principal(referralContractPrincipal),
    ],
    deployer
  );

  // Authorize referral-registry contract as a minter on ipredict-token
  simnet.callPublicFn(
    TOKEN,
    "set-minter",
    [Cl.principal(referralContractPrincipal)],
    deployer
  );

  // Initialize referral-registry: market-contract = wallet4
  simnet.callPublicFn(
    CONTRACT,
    "initialize",
    [Cl.principal(marketCaller)],
    deployer
  );
}

/** Initialize only referral-registry (no cross-contract setup) */
function initializeOnly() {
  return simnet.callPublicFn(
    CONTRACT,
    "initialize",
    [Cl.principal(marketCaller)],
    deployer
  );
}

/** Register a user with a display name and optional referrer */
function registerUser(
  displayName: string,
  referrer: string | null,
  sender: string
) {
  return simnet.callPublicFn(
    CONTRACT,
    "register-referral",
    [
      Cl.stringUtf8(displayName),
      referrer ? Cl.some(Cl.principal(referrer)) : Cl.none(),
    ],
    sender
  );
}

describe("referral-registry", () => {
  // ========================================================================
  // Initialize
  // ========================================================================

  describe("initialize", () => {
    it("admin can initialize with market contract", () => {
      const result = initializeOnly();
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("emits referral-initialized event", () => {
      const result = initializeOnly();
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });

    it("rejects double initialization", () => {
      initializeOnly();
      const result = initializeOnly();
      expect(result.result).toBeErr(Cl.uint(ERR_ALREADY_INITIALIZED));
    });

    it("rejects initialization by non-admin", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "initialize",
        [Cl.principal(marketCaller)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(ERR_NOT_ADMIN));
    });
  });

  // ========================================================================
  // register-referral
  // ========================================================================

  describe("register-referral", () => {
    it("registers user without referrer", () => {
      fullSetup();
      const result = registerUser("Alice", null, wallet1);
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("registers user with referrer", () => {
      fullSetup();
      // Register referrer first (wallet1)
      registerUser("Alice", null, wallet1);
      // Register with referrer
      const result = registerUser("Bob", wallet1, wallet2);
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("stores display name correctly", () => {
      fullSetup();
      registerUser("CryptoKing", null, wallet1);
      const name = simnet.callReadOnlyFn(
        CONTRACT,
        "get-display-name",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(name.result).toStrictEqual(
        Cl.some(Cl.stringUtf8("CryptoKing"))
      );
    });

    it("marks user as registered", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const reg = simnet.callReadOnlyFn(
        CONTRACT,
        "is-registered",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(reg.result).toStrictEqual(Cl.bool(true));
    });

    it("stores referrer link", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);
      const ref = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referrer",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(ref.result).toStrictEqual(Cl.some(Cl.principal(wallet1)));
    });

    it("increments referral count for referrer", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);
      const count = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referral-count",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(count.result).toStrictEqual(Cl.uint(1));
    });

    it("referral count increments with multiple referrals", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);
      registerUser("Charlie", wallet1, wallet3);
      const count = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referral-count",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(count.result).toStrictEqual(Cl.uint(2));
    });

    it("awards 5 welcome bonus points via leaderboard", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const pts = simnet.callReadOnlyFn(
        LEADERBOARD,
        "get-points",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(pts.result).toStrictEqual(Cl.uint(5));
    });

    it("awards 1 IPREDICT welcome token via ipredict-token", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const bal = simnet.callReadOnlyFn(
        TOKEN,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      // 1 IPREDICT = 1_000_000 micro-tokens (6 decimals)
      expect(bal.result).toBeOk(Cl.uint(1000000));
    });

    it("emits referral-registered event", () => {
      fullSetup();
      const result = registerUser("Alice", null, wallet1);
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });

    it("rejects self-referral", () => {
      fullSetup();
      const result = registerUser("Alice", wallet1, wallet1);
      expect(result.result).toBeErr(Cl.uint(ERR_SELF_REFERRAL));
    });

    it("rejects double registration", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const result = registerUser("Alice2", null, wallet1);
      expect(result.result).toBeErr(Cl.uint(ERR_ALREADY_REGISTERED));
    });

    it("user without referrer has no referrer link", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const ref = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referrer",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(ref.result).toStrictEqual(Cl.none());
    });

    it("has-referrer returns false for user without referrer", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const has = simnet.callReadOnlyFn(
        CONTRACT,
        "has-referrer",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(has.result).toStrictEqual(Cl.bool(false));
    });

    it("has-referrer returns true for user with referrer", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);
      const has = simnet.callReadOnlyFn(
        CONTRACT,
        "has-referrer",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(has.result).toStrictEqual(Cl.bool(true));
    });
  });

  // ========================================================================
  // credit
  // ========================================================================

  describe("credit", () => {
    it("returns (ok false) when user has no referrer", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const result = simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet1), Cl.uint(500000)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(false));
    });

    it("credits referrer and returns (ok true) when referrer exists", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);

      // Fund the contract so it can forward STX
      const contractAddr = `${deployer}.referral-registry`;
      simnet.transferSTX(500000, contractAddr, wallet3);

      const result = simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(500000)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("accumulates earnings for the referrer", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);

      const contractAddr = `${deployer}.referral-registry`;
      simnet.transferSTX(1000000, contractAddr, wallet3);

      // First credit
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(500000)],
        marketCaller
      );

      // Second credit
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(300000)],
        marketCaller
      );

      const earnings = simnet.callReadOnlyFn(
        CONTRACT,
        "get-earnings",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(earnings.result).toStrictEqual(Cl.uint(800000));
    });

    it("awards 3 bonus points to referrer on credit", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);

      const contractAddr = `${deployer}.referral-registry`;
      simnet.transferSTX(500000, contractAddr, wallet3);

      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(500000)],
        marketCaller
      );

      const pts = simnet.callReadOnlyFn(
        LEADERBOARD,
        "get-points",
        [Cl.principal(wallet1)],
        deployer
      );
      // 5 welcome bonus + 3 referral credit bonus = 8
      expect(pts.result).toStrictEqual(Cl.uint(8));
    });

    it("emits referral-credited event on successful credit", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);

      const contractAddr = `${deployer}.referral-registry`;
      simnet.transferSTX(500000, contractAddr, wallet3);

      const result = simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(500000)],
        marketCaller
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });

    it("rejects credit from unauthorized caller", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      const result = simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet1), Cl.uint(500000)],
        wallet1 // not the market contract
      );
      expect(result.result).toBeErr(Cl.uint(ERR_UNAUTHORIZED));
    });

    it("returns (ok false) for unregistered user", () => {
      fullSetup();
      // wallet1 is not registered at all
      const result = simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet1), Cl.uint(500000)],
        marketCaller
      );
      // No referrer mapping exists → (ok false)
      expect(result.result).toBeOk(Cl.bool(false));
    });

    it("bonus points accumulate across multiple credits", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);

      const contractAddr = `${deployer}.referral-registry`;
      simnet.transferSTX(2000000, contractAddr, wallet3);

      // Credit twice
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(500000)],
        marketCaller
      );
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(300000)],
        marketCaller
      );

      const pts = simnet.callReadOnlyFn(
        LEADERBOARD,
        "get-points",
        [Cl.principal(wallet1)],
        deployer
      );
      // 5 welcome bonus + 3 + 3 referral credits = 11
      expect(pts.result).toStrictEqual(Cl.uint(11));
    });
  });

  // ========================================================================
  // Read-Only Functions
  // ========================================================================

  describe("read-only functions", () => {
    it("get-referrer returns none for unregistered user", () => {
      const ref = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referrer",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(ref.result).toStrictEqual(Cl.none());
    });

    it("get-display-name returns none for unregistered user", () => {
      const name = simnet.callReadOnlyFn(
        CONTRACT,
        "get-display-name",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(name.result).toStrictEqual(Cl.none());
    });

    it("get-referral-count returns 0 for user with no referrals", () => {
      const count = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referral-count",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(count.result).toStrictEqual(Cl.uint(0));
    });

    it("get-earnings returns 0 for user with no earnings", () => {
      const earnings = simnet.callReadOnlyFn(
        CONTRACT,
        "get-earnings",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(earnings.result).toStrictEqual(Cl.uint(0));
    });

    it("has-referrer returns false for unregistered user", () => {
      const has = simnet.callReadOnlyFn(
        CONTRACT,
        "has-referrer",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(has.result).toStrictEqual(Cl.bool(false));
    });

    it("is-registered returns false for unregistered user", () => {
      const reg = simnet.callReadOnlyFn(
        CONTRACT,
        "is-registered",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(reg.result).toStrictEqual(Cl.bool(false));
    });
  });

  // ========================================================================
  // Edge Cases & Integration
  // ========================================================================

  describe("edge cases", () => {
    it("different users can register with different referrers", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", null, wallet2);
      registerUser("Charlie", wallet1, wallet3);
      registerUser("Dave", wallet2, wallet5);

      const ref3 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referrer",
        [Cl.principal(wallet3)],
        deployer
      );
      expect(ref3.result).toStrictEqual(Cl.some(Cl.principal(wallet1)));

      const ref5 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referrer",
        [Cl.principal(wallet5)],
        deployer
      );
      expect(ref5.result).toStrictEqual(Cl.some(Cl.principal(wallet2)));
    });

    it("referral count is per-referrer, not global", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", null, wallet2);
      registerUser("Charlie", wallet1, wallet3);
      registerUser("Dave", wallet2, wallet5);

      const count1 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referral-count",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(count1.result).toStrictEqual(Cl.uint(1));

      const count2 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-referral-count",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(count2.result).toStrictEqual(Cl.uint(1));
    });

    it("welcome bonuses for each registration are independent", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", null, wallet2);

      // Each user gets 5 welcome points independently
      const pts1 = simnet.callReadOnlyFn(
        LEADERBOARD,
        "get-points",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(pts1.result).toStrictEqual(Cl.uint(5));

      const pts2 = simnet.callReadOnlyFn(
        LEADERBOARD,
        "get-points",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(pts2.result).toStrictEqual(Cl.uint(5));
    });

    it("credit for user with no referrer mapping doesn't modify earnings", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);

      // Credit with no referrer - should return ok false
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet1), Cl.uint(500000)],
        marketCaller
      );

      // Earnings for wallet1 should remain 0 (no one referred them)
      const earnings = simnet.callReadOnlyFn(
        CONTRACT,
        "get-earnings",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(earnings.result).toStrictEqual(Cl.uint(0));
    });

    it("get-earnings reflects correct cumulative value", () => {
      fullSetup();
      registerUser("Alice", null, wallet1);
      registerUser("Bob", wallet1, wallet2);

      const contractAddr = `${deployer}.referral-registry`;
      simnet.transferSTX(3000000, contractAddr, wallet3);

      // Three credits
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(100000)],
        marketCaller
      );
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(200000)],
        marketCaller
      );
      simnet.callPublicFn(
        CONTRACT,
        "credit",
        [Cl.principal(wallet2), Cl.uint(300000)],
        marketCaller
      );

      const earnings = simnet.callReadOnlyFn(
        CONTRACT,
        "get-earnings",
        [Cl.principal(wallet1)],
        deployer
      );
      // 100000 + 200000 + 300000 = 600000
      expect(earnings.result).toStrictEqual(Cl.uint(600000));
    });

    it("registration with UTF-8 display name", () => {
      fullSetup();
      const result = registerUser("🎯预测", null, wallet1);
      expect(result.result).toBeOk(Cl.bool(true));

      const name = simnet.callReadOnlyFn(
        CONTRACT,
        "get-display-name",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(name.result).toStrictEqual(
        Cl.some(Cl.stringUtf8("🎯预测"))
      );
    });
  });
});
