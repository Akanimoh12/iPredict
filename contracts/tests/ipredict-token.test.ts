import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { tx } from "@stacks/clarinet-sdk";
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
// ipredict-token.test.ts
// Tests for the iPredict SIP-010 Token contract
// Coverage target: >= 90% line coverage
// ============================================================================

const CONTRACT = "ipredict-token";

// Devnet account addresses
const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

describe("ipredict-token", () => {
  // ========================================================================
  // SIP-010 Read-Only Compliance
  // ========================================================================

  describe("SIP-010 read-only functions", () => {
    it("get-name returns IPREDICT", () => {
      const result = simnet.callReadOnlyFn(CONTRACT, "get-name", [], deployer);
      expect(result.result).toBeOk(Cl.stringAscii("IPREDICT"));
    });

    it("get-symbol returns IPRED", () => {
      const result = simnet.callReadOnlyFn(CONTRACT, "get-symbol", [], deployer);
      expect(result.result).toBeOk(Cl.stringAscii("IPRED"));
    });

    it("get-decimals returns u6", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-decimals",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(6));
    });

    it("get-token-uri returns none", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-uri",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.none());
    });

    it("get-total-supply returns u0 initially", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("get-balance returns u0 for unknown account", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });
  });

  // ========================================================================
  // set-minter
  // ========================================================================

  describe("set-minter", () => {
    it("admin can set a minter", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("admin can set multiple minters", () => {
      const r1 = simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(r1.result).toBeOk(Cl.bool(true));

      const r2 = simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(r2.result).toBeOk(Cl.bool(true));
    });

    it("non-admin cannot set a minter", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });

    it("emits minter-added event", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // remove-minter
  // ========================================================================

  describe("remove-minter", () => {
    it("admin can remove a minter", () => {
      // Set then remove
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "remove-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("non-admin cannot remove a minter", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "remove-minter",
        [Cl.principal(wallet1)],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });

    it("removed minter can no longer mint", () => {
      // Set minter, then remove, then try to mint
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "remove-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(1000000)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(101));
    });

    it("emits minter-removed event", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "remove-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // mint
  // ========================================================================

  describe("mint", () => {
    it("authorized minter can mint tokens", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(10000000)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("minted tokens appear in recipient balance", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(5000000)],
        wallet1
      );
      const balance = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(5000000));
    });

    it("minting increases total supply", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(10000000)],
        wallet1
      );
      const supply = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(supply.result).toBeOk(Cl.uint(10000000));
    });

    it("multiple mints accumulate balance and supply", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(5000000)],
        wallet1
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(3000000)],
        wallet1
      );
      const balance = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(8000000));

      const supply = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(supply.result).toBeOk(Cl.uint(8000000));
    });

    it("second authorized minter can also mint", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet2)],
        deployer
      );
      const r1 = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet3), Cl.uint(1000000)],
        wallet1
      );
      expect(r1.result).toBeOk(Cl.bool(true));

      const r2 = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet3), Cl.uint(2000000)],
        wallet2
      );
      expect(r2.result).toBeOk(Cl.bool(true));

      const balance = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet3)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(3000000));
    });

    it("non-minter cannot mint", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(1000000)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(101));
    });

    it("reject mint with zero amount", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(0)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(103));
    });

    it("emits tokens-minted event", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(1000000)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
      // Should have ft_mint_event and print event
      expect(result.events.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // transfer (SIP-010)
  // ========================================================================

  describe("transfer", () => {
    it("can transfer tokens between accounts", () => {
      // Mint first
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(10000000)],
        wallet1
      );

      // Transfer
      const result = simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [
          Cl.uint(3000000),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none(),
        ],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // Verify balances
      const b1 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(b1.result).toBeOk(Cl.uint(7000000));

      const b2 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(b2.result).toBeOk(Cl.uint(3000000));
    });

    it("transfer does not change total supply", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(10000000)],
        wallet1
      );

      simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [
          Cl.uint(3000000),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none(),
        ],
        wallet1
      );

      const supply = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(supply.result).toBeOk(Cl.uint(10000000));
    });

    it("transfer with memo succeeds", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(5000000)],
        wallet1
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [
          Cl.uint(1000000),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.some(Cl.bufferFromAscii("test-memo")),
        ],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("reject transfer with insufficient balance", () => {
      // wallet1 has 0 tokens
      const result = simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [
          Cl.uint(1000000),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none(),
        ],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1)); // ft-transfer? returns (err u1) for insufficient balance
    });

    it("reject transfer when sender is not tx-sender", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(5000000)],
        wallet1
      );

      // wallet2 tries to transfer from wallet1
      const result = simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [
          Cl.uint(1000000),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none(),
        ],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(102));
    });

    it("reject transfer with zero amount", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(5000000)],
        wallet1
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [
          Cl.uint(0),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none(),
        ],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(103));
    });
  });

  // ========================================================================
  // burn
  // ========================================================================

  describe("burn", () => {
    it("can burn own tokens", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(10000000)],
        wallet1
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "burn",
        [Cl.uint(3000000)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const balance = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(7000000));
    });

    it("burn decreases total supply", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(10000000)],
        wallet1
      );
      simnet.callPublicFn(CONTRACT, "burn", [Cl.uint(4000000)], wallet1);

      const supply = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(supply.result).toBeOk(Cl.uint(6000000));
    });

    it("reject burn with insufficient balance", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "burn",
        [Cl.uint(1000000)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1)); // ft-burn? returns (err u1) for insufficient balance
    });

    it("reject burn with zero amount", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "burn",
        [Cl.uint(0)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(103));
    });

    it("emits tokens-burned event", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(5000000)],
        wallet1
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "burn",
        [Cl.uint(1000000)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events.length).toBeGreaterThanOrEqual(2);
    });

    it("burn all tokens leaves zero balance and supply", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(5000000)],
        wallet1
      );
      simnet.callPublicFn(CONTRACT, "burn", [Cl.uint(5000000)], wallet1);

      const balance = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(0));

      const supply = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(supply.result).toBeOk(Cl.uint(0));
    });
  });

  // ========================================================================
  // Full lifecycle: mint -> transfer -> burn -> supply tracking
  // ========================================================================

  describe("full lifecycle", () => {
    it("mint -> transfer -> burn tracks balances and supply correctly", () => {
      // Setup minter
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );

      // Mint 100 IPRED (100,000,000 with 6 decimals)
      simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet1), Cl.uint(100000000)],
        wallet1
      );

      // Transfer 40 IPRED to wallet2
      simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [
          Cl.uint(40000000),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none(),
        ],
        wallet1
      );

      // wallet2 burns 10 IPRED
      simnet.callPublicFn(CONTRACT, "burn", [Cl.uint(10000000)], wallet2);

      // Verify wallet1 balance: 60 IPRED
      const b1 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(b1.result).toBeOk(Cl.uint(60000000));

      // Verify wallet2 balance: 30 IPRED
      const b2 = simnet.callReadOnlyFn(
        CONTRACT,
        "get-balance",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(b2.result).toBeOk(Cl.uint(30000000));

      // Verify total supply: 90 IPRED (100 minted - 10 burned)
      const supply = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(supply.result).toBeOk(Cl.uint(90000000));
    });

    it("minter set and removed cannot mint after removal", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-minter",
        [Cl.principal(wallet1)],
        deployer
      );

      // Mint succeeds
      const r1 = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(1000000)],
        wallet1
      );
      expect(r1.result).toBeOk(Cl.bool(true));

      // Remove minter
      simnet.callPublicFn(
        CONTRACT,
        "remove-minter",
        [Cl.principal(wallet1)],
        deployer
      );

      // Mint fails
      const r2 = simnet.callPublicFn(
        CONTRACT,
        "mint",
        [Cl.principal(wallet2), Cl.uint(1000000)],
        wallet1
      );
      expect(r2.result).toBeErr(Cl.uint(101));

      // Supply only has the first mint
      const supply = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-supply",
        [],
        deployer
      );
      expect(supply.result).toBeOk(Cl.uint(1000000));
    });
  });
});
