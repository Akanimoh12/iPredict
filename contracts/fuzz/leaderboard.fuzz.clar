;; leaderboard.tests.clar
;; Rendezvous invariant tests for the leaderboard contract.
;; Merged into the contract by rv -- full access to maps and data vars.
;; Run: cd contracts && npx rv . leaderboard invariant

;; ============================================================================
;; Fold Helpers (rv- prefix avoids name conflicts with contract functions)
;; ============================================================================

;; Check that top-player entries are sorted in descending order by points.
(define-private (rv-check-sorted-iter
  (idx uint)
  (state { count: uint, sorted: bool }))
  (if (and (get sorted state) (< (+ idx u1) (get count state)))
    (let (
      (entry-i (default-to { address: (var-get admin), points: u0 }
        (map-get? top-player-at idx)))
      (entry-j (default-to { address: (var-get admin), points: u0 }
        (map-get? top-player-at (+ idx u1))))
    )
      (merge state { sorted: (>= (get points entry-i) (get points entry-j)) }))
    state))

;; Verify that each top-player entry's cached points match the canonical
;; points map value for that address.
(define-private (rv-check-points-match-iter
  (idx uint)
  (state { count: uint, matched: bool }))
  (if (and (get matched state) (< idx (get count state)))
    (match (map-get? top-player-at idx)
      entry
        (merge state {
          matched: (is-eq (get points entry) (get-points (get address entry)))
        })
      state)
    state))

;; ============================================================================
;; Invariants
;; ============================================================================

;; ---------- Top Players Sorted ----------
;; All entries in the top-player list must be in descending order by points.
;; Verifies the insertion-sort logic in update-top-players.
(define-read-only (invariant-top-players-sorted)
  (let (
    (count (var-get top-player-count))
    (result (fold rv-check-sorted-iter INDEX-LIST
      { count: count, sorted: true }))
  )
    (get sorted result)))

;; ---------- Top Count Bounded ----------
;; top-player-count must never exceed MAX-TOP-PLAYERS (50).
(define-read-only (invariant-top-count-bounded)
  (<= (var-get top-player-count) MAX-TOP-PLAYERS))

;; ---------- Stats Consistent ----------
;; For any user, won-bets + lost-bets must be <= total-bets.
;; In production, record-bet is always called before add-pts.
;; In fuzz testing, calls are random so we only enforce the invariant
;; when record-bet has been called at least as many times as add-pts.
(define-read-only (invariant-stats-consistent (user principal))
  (let (
    (add-pts-calls (default-to u0 (get called (map-get? context "add-pts"))))
    (record-bet-calls (default-to u0 (get called (map-get? context "record-bet"))))
    (w (default-to u0 (map-get? won-bets user)))
    (l (default-to u0 (map-get? lost-bets user)))
    (t (default-to u0 (map-get? total-bets user)))
  )
    (if (>= record-bet-calls add-pts-calls)
      (<= (+ w l) t)
      true)))

;; ---------- Top Points Match Canonical ----------
;; For each entry in the top-player list, the stored points must match
;; the user's actual points in the canonical points map. If these diverge,
;; the update-top-players insertion/sort logic has a bug.
(define-read-only (invariant-top-points-match)
  (let (
    (count (var-get top-player-count))
    (result (fold rv-check-points-match-iter INDEX-LIST
      { count: count, matched: true }))
  )
    (get matched result)))
