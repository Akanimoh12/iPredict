;; prediction-market.tests.clar
;; Rendezvous invariant tests for the prediction-market contract.
;; Merged into the contract by rv -- full access to internal state.
;; Run: cd contracts && npx rv . prediction-market invariant

;; ============================================================================
;; Fold Helpers (rv- prefix avoids name conflicts with contract functions)
;; ============================================================================

;; Sum bet amounts per side for a single market.
;; Iterates bettor-at map entries and groups amounts by is-yes.
(define-private (rv-sum-bets-iter
  (idx uint)
  (state { market-id: uint, count: uint, sum-yes: uint, sum-no: uint }))
  (if (< idx (get count state))
    (let (
      (mid (get market-id state))
      (bettor (default-to CONTRACT-OWNER
        (map-get? bettor-at { market-id: mid, index: idx })))
    )
      (match (map-get? bets { market-id: mid, user: bettor })
        b (if (get is-yes b)
            (merge state { sum-yes: (+ (get sum-yes state) (get amount b)) })
            (merge state { sum-no: (+ (get sum-no state) (get amount b)) }))
        state))
    state))

;; Check that all bets on a cancelled market are marked claimed.
(define-private (rv-check-claimed-iter
  (idx uint)
  (state { market-id: uint, count: uint, all-claimed: bool }))
  (if (and (< idx (get count state)) (get all-claimed state))
    (let (
      (mid (get market-id state))
      (bettor (default-to CONTRACT-OWNER
        (map-get? bettor-at { market-id: mid, index: idx })))
    )
      (match (map-get? bets { market-id: mid, user: bettor })
        b (merge state { all-claimed: (get claimed b) })
        state))
    state))

;; ============================================================================
;; Invariants
;; ============================================================================

;; ---------- Pool Consistency ----------
;; For the given market, total-yes + total-no must equal the sum of all
;; per-bettor net amounts (split by side).
(define-read-only (invariant-pool-consistency (market-id uint))
  (match (map-get? markets market-id)
    market
      (let (
        (count (default-to u0 (map-get? bettor-count market-id)))
        (sums (fold rv-sum-bets-iter ITER-LIST
          { market-id: market-id, count: count, sum-yes: u0, sum-no: u0 }))
      )
        (and
          (is-eq (get total-yes market) (get sum-yes sums))
          (is-eq (get total-no market) (get sum-no sums))))
    ;; Market doesn't exist -- invariant trivially holds
    true))

;; ---------- No Insolvency ----------
;; The contract's STX balance must always be >= accumulated platform fees.
;; If the contract is not initialized, trivially holds.
(define-read-only (invariant-no-insolvency)
  (if (not (var-get initialized))
    true
    (>= (stx-get-balance (var-get self-addr)) (var-get accumulated-fees))))

;; ---------- Fees Consistency ----------
;; If no markets have been created yet, accumulated-fees must be zero.
;; Fees can only originate from bets, which require existing markets.
(define-read-only (invariant-fees-consistency)
  (if (is-eq (var-get market-count) u0)
    (is-eq (var-get accumulated-fees) u0)
    true))

;; ---------- Resolved / Cancelled Exclusive ----------
;; A market cannot be both resolved AND cancelled simultaneously.
;; The contract enforces this via mutual-exclusion asserts in resolve-market
;; and cancel-market. This verifies no corruption occurred.
(define-read-only (invariant-resolved-cancelled-exclusive (market-id uint))
  (match (map-get? markets market-id)
    market
      (not (and (get resolved market) (get cancelled market)))
    true))

;; ---------- Cancelled => All Claimed ----------
;; If a market is cancelled, every bettor's bet must be marked claimed
;; (since cancel-market bulk-refunds all bettors via fold).
(define-read-only (invariant-cancelled-all-claimed (market-id uint))
  (match (map-get? markets market-id)
    market
      (if (not (get cancelled market))
        true
        (let (
          (count (default-to u0 (map-get? bettor-count market-id)))
          (check (fold rv-check-claimed-iter ITER-LIST
            { market-id: market-id, count: count, all-claimed: true }))
        )
          (get all-claimed check)))
    true))

;; ---------- Bet Count Matches ----------
;; The market's bet-count field must equal the bettor-count map value.
;; These are maintained independently and must agree.
(define-read-only (invariant-bet-count-matches (market-id uint))
  (match (map-get? markets market-id)
    market
      (is-eq (get bet-count market)
             (default-to u0 (map-get? bettor-count market-id)))
    true))
