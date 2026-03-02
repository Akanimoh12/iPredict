;; ipredict-token.tests.clar
;; Rendezvous invariant tests for the ipredict-token contract.
;; Merged into the contract by rv -- full access to FT state and maps.
;; Run: cd contracts && npx rv . ipredict-token invariant

;; ============================================================================
;; Invariants
;; ============================================================================

;; ---------- Supply >= Balance ----------
;; No individual account's balance can exceed the total token supply.
;; The fuzzer provides random principals from the simnet accounts.
(define-read-only (invariant-supply-geq-balance (account principal))
  (let (
    (supply (ft-get-supply ipredict-token))
    (bal (ft-get-balance ipredict-token account))
  )
    (>= supply bal)))

;; ---------- Mint Only Authorized ----------
;; If the mint function has never been successfully called (per context
;; tracking), the total supply must remain zero. This verifies that supply
;; can only increase through authorised mint calls.
(define-read-only (invariant-mint-only-authorized)
  (let (
    (mint-calls (default-to u0 (get called (map-get? context "mint"))))
    (supply (ft-get-supply ipredict-token))
  )
    (if (is-eq mint-calls u0)
      (is-eq supply u0)
      true)))

;; ---------- Burn Consistency ----------
;; If burn was successfully called but mint was never called, total supply
;; must still be zero -- burns from zero balance always fail, so supply
;; cannot go negative. This cross-checks mint and burn accounting.
(define-read-only (invariant-burn-consistency)
  (let (
    (mint-calls (default-to u0 (get called (map-get? context "mint"))))
    (burn-calls (default-to u0 (get called (map-get? context "burn"))))
    (supply (ft-get-supply ipredict-token))
  )
    (if (and (> burn-calls u0) (is-eq mint-calls u0))
      ;; Burns succeeded without any mints -- supply must still be 0
      (is-eq supply u0)
      true)))

;; ---------- Transfer Conservation ----------
;; If neither mint nor burn has been successfully called, the total supply
;; must remain at 0. Transfers only move tokens between accounts; they
;; cannot create or destroy supply.
(define-read-only (invariant-transfer-conservation)
  (let (
    (mint-calls (default-to u0 (get called (map-get? context "mint"))))
    (burn-calls (default-to u0 (get called (map-get? context "burn"))))
    (supply (ft-get-supply ipredict-token))
  )
    (if (and (is-eq mint-calls u0) (is-eq burn-calls u0))
      (is-eq supply u0)
      true)))
