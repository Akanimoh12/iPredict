;; leaderboard.clar
;; iPredict - Onchain Points and Rankings Contract
;;
;; Tracks points, bet counts, win/loss stats per user.
;; Maintains a sorted top-50 player list using indexed map storage.
;; Called by prediction-market and referral-registry.

;; ============================================================================
;; Constants
;; ============================================================================

(define-constant MAX-TOP-PLAYERS u50)
(define-constant ERR-NOT-ADMIN (err u200))
(define-constant ERR-UNAUTHORIZED (err u201))
(define-constant ERR-ALREADY-INITIALIZED (err u202))

;; Fixed index list for fold iterations (0..49)
(define-constant INDEX-LIST (list
  u0 u1 u2 u3 u4 u5 u6 u7 u8 u9
  u10 u11 u12 u13 u14 u15 u16 u17 u18 u19
  u20 u21 u22 u23 u24 u25 u26 u27 u28 u29
  u30 u31 u32 u33 u34 u35 u36 u37 u38 u39
  u40 u41 u42 u43 u44 u45 u46 u47 u48 u49
))

;; ============================================================================
;; Data Variables
;; ============================================================================

(define-data-var admin principal tx-sender)
(define-data-var market-contract principal tx-sender)
(define-data-var referral-contract principal tx-sender)
(define-data-var initialized bool false)
(define-data-var top-player-count uint u0)

;; ============================================================================
;; Maps
;; ============================================================================

(define-map points principal uint)
(define-map total-bets principal uint)
(define-map won-bets principal uint)
(define-map lost-bets principal uint)
(define-map top-player-at uint { address: principal, points: uint })

;; ============================================================================
;; Private Helpers
;; ============================================================================

(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

(define-private (is-market-contract)
  (is-eq contract-caller (var-get market-contract))
)

(define-private (is-referral-contract)
  (is-eq contract-caller (var-get referral-contract))
)

;; Find the index of a user in the top-player list.
;; Returns MAX-TOP-PLAYERS if not found.
(define-private (find-player-index (user principal))
  (fold find-player-index-iter INDEX-LIST { user: user, found-index: MAX-TOP-PLAYERS, current-count: (var-get top-player-count) })
)

(define-private (find-player-index-iter
  (idx uint)
  (state { user: principal, found-index: uint, current-count: uint })
)
  (if (and (< idx (get current-count state)) (is-eq (get found-index state) MAX-TOP-PLAYERS))
    (match (map-get? top-player-at idx)
      entry (if (is-eq (get address entry) (get user state))
              (merge state { found-index: idx })
              state)
      state)
    state)
)

;; Shift entries down by one position from start-idx to end-idx (exclusive).
;; This makes room at start-idx for a new insertion.
;; We shift from bottom up: copy [end-idx-1] -> [end-idx], [end-idx-2] -> [end-idx-1], etc.
(define-private (shift-down (start-idx uint) (end-idx uint))
  (fold shift-down-iter INDEX-LIST { start-idx: start-idx, end-idx: end-idx })
)

(define-private (shift-down-iter
  (idx uint)
  (state { start-idx: uint, end-idx: uint })
)
  (let (
    ;; We iterate idx from 0..49, but we want to shift from (end-idx-1) down to start-idx.
    ;; Map idx to the source position: source = end-idx - 1 - idx
    ;; Only proceed if source >= start-idx and source < end-idx
    (source (if (> (get end-idx state) idx) (- (- (get end-idx state) u1) idx) u999))
    (dest (+ source u1))
  )
    (if (and (>= source (get start-idx state)) (< source (get end-idx state)) (< dest MAX-TOP-PLAYERS) (not (is-eq source u999)))
      (match (map-get? top-player-at source)
        entry (begin (map-set top-player-at dest entry) state)
        state)
      state)
  )
)

;; Shift entries up by one from idx, filling the gap left by removal.
;; copy [idx+1] -> [idx], [idx+2] -> [idx+1], etc. up to count-1
(define-private (shift-up (gap-idx uint) (count uint))
  (fold shift-up-iter INDEX-LIST { gap-idx: gap-idx, count: count })
)

(define-private (shift-up-iter
  (idx uint)
  (state { gap-idx: uint, count: uint })
)
  (let (
    (source (+ (get gap-idx state) u1 idx))
    (dest (+ (get gap-idx state) idx))
  )
    (if (and (< source (get count state)) (< dest (get count state)))
      (match (map-get? top-player-at source)
        entry (begin (map-set top-player-at dest entry) state)
        state)
      state)
  )
)

;; Find the correct insertion index for a given score (descending order).
;; Returns the index where this score should be placed.
(define-private (find-insert-position (new-points uint) (count uint))
  (get position (fold find-insert-iter INDEX-LIST { new-points: new-points, count: count, position: count, found: false }))
)

(define-private (find-insert-iter
  (idx uint)
  (state { new-points: uint, count: uint, position: uint, found: bool })
)
  (if (and (< idx (get count state)) (not (get found state)))
    (match (map-get? top-player-at idx)
      entry (if (<= (get points entry) (get new-points state))
              (merge state { position: idx, found: true })
              state)
      state)
    state)
)

;; Core function to update the top-players list when a user's points change.
(define-private (update-top-players (user principal) (new-points uint))
  (let (
    (count (var-get top-player-count))
    (search-result (find-player-index user))
    (existing-idx (get found-index search-result))
  )
    (if (not (is-eq existing-idx MAX-TOP-PLAYERS))
      ;; Player already in list - remove and re-insert at correct position
      (let (
        ;; Shift entries up to fill the gap
        (after-shift-up (shift-up existing-idx count))
        (new-count-after-remove (- count u1))
        ;; Find new position in the reduced list
        (insert-pos (find-insert-position new-points new-count-after-remove))
      )
        ;; Delete the last entry (now a duplicate after shift-up)
        (map-delete top-player-at (- count u1))
        ;; Shift down from insert-pos to make room
        (shift-down insert-pos new-count-after-remove)
        ;; Insert at correct position
        (map-set top-player-at insert-pos { address: user, points: new-points })
        ;; Count stays the same
        (var-set top-player-count count)
        true
      )
      ;; Player not in list
      (if (< count MAX-TOP-PLAYERS)
        ;; List not full - insert at correct position
        (let (
          (insert-pos (find-insert-position new-points count))
        )
          (shift-down insert-pos count)
          (map-set top-player-at insert-pos { address: user, points: new-points })
          (var-set top-player-count (+ count u1))
          true
        )
        ;; List is full - check if new score beats the lowest
        (let (
          (lowest-entry (map-get? top-player-at (- MAX-TOP-PLAYERS u1)))
        )
          (match lowest-entry
            entry (if (> new-points (get points entry))
                    ;; Replace the lowest entry
                    (let (
                      ;; Remove last entry
                      (new-count-after-remove (- count u1))
                      (insert-pos (find-insert-position new-points new-count-after-remove))
                    )
                      ;; Shift down from insert-pos to make room (last spot gets overwritten)
                      (shift-down insert-pos new-count-after-remove)
                      (map-set top-player-at insert-pos { address: user, points: new-points })
                      ;; Count stays at MAX-TOP-PLAYERS
                      true
                    )
                    ;; New score does not beat lowest - no change
                    false)
            false)
        )
      )
    )
  )
)

;; ============================================================================
;; Public Functions
;; ============================================================================

;; One-time initialization: store authorized contract callers
(define-public (initialize (market principal) (referral principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (not (var-get initialized)) ERR-ALREADY-INITIALIZED)
    (var-set market-contract market)
    (var-set referral-contract referral)
    (var-set initialized true)
    (print { event: "leaderboard-initialized", market-contract: market, referral-contract: referral })
    (ok true)
  )
)

;; Add points to a user and update win/loss stats (called by prediction-market)
(define-public (add-pts (user principal) (pts uint) (is-winner bool))
  (begin
    (asserts! (is-market-contract) ERR-UNAUTHORIZED)
    (let (
      (current-points (default-to u0 (map-get? points user)))
      (new-points (+ current-points pts))
    )
      (map-set points user new-points)
      (if is-winner
        (map-set won-bets user (+ (default-to u0 (map-get? won-bets user)) u1))
        (map-set lost-bets user (+ (default-to u0 (map-get? lost-bets user)) u1))
      )
      (update-top-players user new-points)
      (print { event: "points-added", user: user, points: pts, total: new-points, is-winner: is-winner })
      (ok true)
    )
  )
)

;; Add bonus points without modifying win/loss stats (called by referral-registry)
(define-public (add-bonus-pts (user principal) (pts uint))
  (begin
    (asserts! (is-referral-contract) ERR-UNAUTHORIZED)
    (let (
      (current-points (default-to u0 (map-get? points user)))
      (new-points (+ current-points pts))
    )
      (map-set points user new-points)
      (update-top-players user new-points)
      (print { event: "bonus-points-added", user: user, points: pts, total: new-points })
      (ok true)
    )
  )
)

;; Record a bet (called by prediction-market to increment total-bets)
(define-public (record-bet (user principal))
  (begin
    (asserts! (is-market-contract) ERR-UNAUTHORIZED)
    (map-set total-bets user (+ (default-to u0 (map-get? total-bets user)) u1))
    (print { event: "bet-recorded", user: user })
    (ok true)
  )
)

;; ============================================================================
;; Read-Only Functions
;; ============================================================================

;; Get points for a user (default 0)
(define-read-only (get-points (user principal))
  (default-to u0 (map-get? points user))
)

;; Get full stats for a user
(define-read-only (get-stats (user principal))
  {
    points: (default-to u0 (map-get? points user)),
    total-bets: (default-to u0 (map-get? total-bets user)),
    won-bets: (default-to u0 (map-get? won-bets user)),
    lost-bets: (default-to u0 (map-get? lost-bets user))
  }
)

;; Get top players (up to limit)
(define-read-only (get-top-players (limit uint))
  (let (
    (count (var-get top-player-count))
    (effective-limit (if (< limit count) limit count))
  )
    (fold collect-top-players INDEX-LIST { limit: effective-limit, result: (list) })
  )
)

(define-private (collect-top-players
  (idx uint)
  (state { limit: uint, result: (list 50 { address: principal, points: uint }) })
)
  (if (< idx (get limit state))
    (match (map-get? top-player-at idx)
      entry (merge state { result: (unwrap-panic (as-max-len? (append (get result state) entry) u50)) })
      state)
    state)
)

;; Get the rank of a user (1-based). Returns u0 if not in top list.
(define-read-only (get-rank (user principal))
  (let (
    (search-result (find-player-index user))
    (found-idx (get found-index search-result))
  )
    (if (is-eq found-idx MAX-TOP-PLAYERS)
      u0
      (+ found-idx u1)
    )
  )
)
