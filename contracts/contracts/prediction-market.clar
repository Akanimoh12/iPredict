;; prediction-market.clar
;; iPredict - Core Prediction Market Contract
;;
;; Manages market creation, bet placement, resolution, cancellation,
;; claims (winner/loser payouts), and fee accumulation.
;; Inter-contract calls: ipredict-token, referral-registry, leaderboard.

;; ============================================================================
;; Constants
;; ============================================================================

(define-constant CONTRACT-OWNER tx-sender)

;; 1 STX = 1 000 000 micro-STX
(define-constant ONE-STX u1000000)

;; Fee model: 2% total -- 1.5% platform + 0.5% referral
(define-constant TOTAL-FEE-BPS u200)
(define-constant PLATFORM-FEE-BPS u150)
(define-constant BPS-DENOM u10000)

;; Reward constants
(define-constant WIN-POINTS u30)
(define-constant LOSE-POINTS u10)
(define-constant WIN-TOKENS u10000000)  ;; 10 IPREDICT (6 decimals)
(define-constant LOSE-TOKENS u2000000)  ;; 2 IPREDICT  (6 decimals)

;; Maximum bettors we can iterate in cancel / enumerate helpers
(define-constant MAX-BETTORS u200)

;; Error codes
(define-constant ERR-NOT-ADMIN        (err u100))
(define-constant ERR-MARKET-NOT-FOUND (err u101))
(define-constant ERR-MARKET-EXPIRED   (err u102))
(define-constant ERR-MARKET-NOT-EXPIRED (err u103))
(define-constant ERR-MARKET-RESOLVED  (err u104))
(define-constant ERR-MARKET-CANCELLED (err u105))
(define-constant ERR-MARKET-NOT-RESOLVED (err u106))
(define-constant ERR-BET-TOO-SMALL    (err u107))
(define-constant ERR-OPPOSITE-SIDE    (err u108))
(define-constant ERR-ALREADY-CLAIMED  (err u109))
(define-constant ERR-NO-BET           (err u110))
(define-constant ERR-NO-FEES          (err u111))
(define-constant ERR-TRANSFER-FAILED  (err u112))
(define-constant ERR-ZERO-POOL        (err u113))

;; Fold iteration list (u0 .. u199)
(define-constant ITER-LIST (list
  u0 u1 u2 u3 u4 u5 u6 u7 u8 u9
  u10 u11 u12 u13 u14 u15 u16 u17 u18 u19
  u20 u21 u22 u23 u24 u25 u26 u27 u28 u29
  u30 u31 u32 u33 u34 u35 u36 u37 u38 u39
  u40 u41 u42 u43 u44 u45 u46 u47 u48 u49
  u50 u51 u52 u53 u54 u55 u56 u57 u58 u59
  u60 u61 u62 u63 u64 u65 u66 u67 u68 u69
  u70 u71 u72 u73 u74 u75 u76 u77 u78 u79
  u80 u81 u82 u83 u84 u85 u86 u87 u88 u89
  u90 u91 u92 u93 u94 u95 u96 u97 u98 u99
  u100 u101 u102 u103 u104 u105 u106 u107 u108 u109
  u110 u111 u112 u113 u114 u115 u116 u117 u118 u119
  u120 u121 u122 u123 u124 u125 u126 u127 u128 u129
  u130 u131 u132 u133 u134 u135 u136 u137 u138 u139
  u140 u141 u142 u143 u144 u145 u146 u147 u148 u149
  u150 u151 u152 u153 u154 u155 u156 u157 u158 u159
  u160 u161 u162 u163 u164 u165 u166 u167 u168 u169
  u170 u171 u172 u173 u174 u175 u176 u177 u178 u179
  u180 u181 u182 u183 u184 u185 u186 u187 u188 u189
  u190 u191 u192 u193 u194 u195 u196 u197 u198 u199
))

;; ============================================================================
;; Data Variables
;; ============================================================================

(define-data-var market-count uint u0)
(define-data-var accumulated-fees uint u0)
(define-data-var self-addr principal CONTRACT-OWNER)
(define-data-var initialized bool false)

;; ============================================================================
;; Maps
;; ============================================================================

;; Market data by ID
(define-map markets uint {
  question:   (string-utf8 256),
  image-url:  (string-utf8 512),
  end-block:  uint,
  total-yes:  uint,
  total-no:   uint,
  resolved:   bool,
  outcome:    bool,
  cancelled:  bool,
  creator:    principal,
  bet-count:  uint
})

;; One bet per (market, user)
(define-map bets { market-id: uint, user: principal } {
  amount:  uint,
  is-yes:  bool,
  claimed: bool
})

;; Bettor index tracking per market
(define-map bettor-count uint uint)
(define-map bettor-at { market-id: uint, index: uint } principal)

;; ============================================================================
;; Private Helpers
;; ============================================================================

(define-private (is-admin)
  (is-eq tx-sender CONTRACT-OWNER))

;; Transfer STX from a sender into this contract
(define-private (receive-deposit (sender principal) (amount uint))
  (stx-transfer? amount sender (var-get self-addr)))

;; Transfer STX from this contract to a recipient
(define-private (send-from-contract (amount uint) (recipient principal))
  (as-contract (stx-transfer? amount tx-sender recipient)))

;; fold worker for cancel-market: refund one bettor
(define-private (refund-bettor
  (idx uint)
  (state { market-id: uint, count: uint }))
  (if (< idx (get count state))
    (let (
      (mid (get market-id state))
      (bettor (default-to CONTRACT-OWNER
        (map-get? bettor-at { market-id: mid, index: idx })))
      (bet (map-get? bets { market-id: mid, user: bettor }))
    )
      (match bet
        bet-data
          (begin
            (match (stx-transfer? (get amount bet-data) tx-sender bettor)
              ok-val true
              err-val true)
            (map-set bets { market-id: mid, user: bettor }
              (merge bet-data { claimed: true }))
            state)
        state))
    state))

;; fold worker for get-market-bettors: collect addresses into a list
(define-private (collect-bettors
  (idx uint)
  (state { market-id: uint, count: uint, result: (list 200 principal) }))
  (if (< idx (get count state))
    (match (map-get? bettor-at { market-id: (get market-id state), index: idx })
      bettor (merge state {
        result: (unwrap-panic (as-max-len? (append (get result state) bettor) u200)) })
      state)
    state))

;; Handle referral-fee routing: credit referrer or keep as platform fee.
;; Always returns (ok true) so callers can (try! ...) without aborting.
(define-private (handle-referral (user principal) (referral-fee uint))
  (let (
    (credit-result (contract-call? .referral-registry credit user referral-fee))
  )
    (match credit-result
      credit-ok
        (if credit-ok
          ;; referrer exists -- send referral-fee from contract to referrer
          (let (
            (ref-addr (unwrap-panic
              (contract-call? .referral-registry get-referrer user)))
          )
            (match (send-from-contract referral-fee ref-addr)
              ok-val
                (begin
                  (var-set accumulated-fees
                    (- (var-get accumulated-fees) referral-fee))
                  (ok true))
              err-val (ok true))) ;; transfer failed -- fee stays as platform
          (ok true))  ;; no referrer -- fees stay as platform fees
      credit-err (ok true)))) ;; credit call failed -- fees stay

;; ============================================================================
;; Public Functions
;; ============================================================================

;; --- initialize ---
;; Admin calls once after deployment. Sets the contract's own address and
;; initializes leaderboard, referral-registry, and ipredict-token minter.
(define-public (initialize (self principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (not (var-get initialized)) (err u114))
    (var-set self-addr self)
    (var-set initialized true)
    ;; Wire up dependencies
    (try! (contract-call? .leaderboard initialize self .referral-registry))
    (try! (contract-call? .referral-registry initialize self))
    ;; Authorize both prediction-market and referral-registry as minters
    (try! (contract-call? .ipredict-token set-minter self))
    (try! (contract-call? .ipredict-token set-minter .referral-registry))
    (ok true)))

;; --- create-market ---
;; Admin creates a new market with a question, image, and duration in blocks.
(define-public (create-market
  (question (string-utf8 256))
  (image-url (string-utf8 512))
  (duration-blocks uint))
  (let (
    (new-id (+ (var-get market-count) u1))
    (end-block (+ stacks-block-height duration-blocks))
  )
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (map-set markets new-id {
      question:  question,
      image-url: image-url,
      end-block: end-block,
      total-yes: u0,
      total-no:  u0,
      resolved:  false,
      outcome:   false,
      cancelled: false,
      creator:   tx-sender,
      bet-count: u0
    })
    (map-set bettor-count new-id u0)
    (var-set market-count new-id)
    (print {
      event: "market-created",
      market-id: new-id,
      question: question,
      end-block: end-block,
      creator: tx-sender
    })
    (ok new-id)))

;; --- place-bet ---
;; User bets on YES or NO. 2 % fee is deducted (1.5 % platform, 0.5 % referral).
;; If the user has a referrer in referral-registry, the referral portion is
;; forwarded to the referrer; otherwise it stays as platform fee.
(define-public (place-bet (market-id uint) (is-yes bool) (amount uint))
  (let (
    (user tx-sender)
    (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
    ;; Fee maths
    (total-fee    (/ (* amount TOTAL-FEE-BPS) BPS-DENOM))
    (platform-fee (/ (* amount PLATFORM-FEE-BPS) BPS-DENOM))
    (referral-fee (- total-fee platform-fee))
    (net          (- amount total-fee))
    ;; Existing-bet check
    (existing-bet (map-get? bets { market-id: market-id, user: user }))
    (prev-amount  (match existing-bet prev (get amount prev) u0))
    (is-new       (is-none existing-bet))
    (cur-count    (default-to u0 (map-get? bettor-count market-id)))
  )
    ;; --- validations ---
    (asserts! (< stacks-block-height (get end-block market)) ERR-MARKET-EXPIRED)
    (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)
    (asserts! (not (get cancelled market)) ERR-MARKET-CANCELLED)
    (asserts! (>= amount ONE-STX) ERR-BET-TOO-SMALL)
    (match existing-bet
      prev-bet (asserts! (is-eq (get is-yes prev-bet) is-yes) ERR-OPPOSITE-SIDE)
      true)

    ;; --- transfer STX from user to contract ---
    (try! (receive-deposit user amount))

    ;; --- accumulate ALL fees as platform fees initially ---
    (var-set accumulated-fees (+ (var-get accumulated-fees) total-fee))

    ;; --- referral: bookkeeping + fee routing (never fails) ---
    (unwrap-panic (handle-referral user referral-fee))

    ;; --- store / update bet ---
    (map-set bets { market-id: market-id, user: user } {
      amount:  (+ prev-amount net),
      is-yes:  is-yes,
      claimed: false
    })

    ;; --- index new bettor ---
    (if is-new
      (begin
        (map-set bettor-at { market-id: market-id, index: cur-count } user)
        (map-set bettor-count market-id (+ cur-count u1))
        true)
      true)

    ;; --- update market pool totals & bet-count ---
    (map-set markets market-id (merge market {
      total-yes: (if is-yes (+ (get total-yes market) net) (get total-yes market)),
      total-no:  (if is-yes (get total-no market) (+ (get total-no market) net)),
      bet-count: (if is-new (+ (get bet-count market) u1) (get bet-count market))
    }))

    ;; --- record bet on leaderboard ---
    (try! (contract-call? .leaderboard record-bet user))

    (print {
      event:        "bet-placed",
      market-id:    market-id,
      user:         user,
      is-yes:       is-yes,
      amount:       amount,
      net:          net,
      platform-fee: platform-fee,
      referral-fee: referral-fee
    })
    (ok true)))

;; --- resolve-market ---
;; Admin resolves after end-block: pick YES (true) or NO (false) as outcome.
(define-public (resolve-market (market-id uint) (outcome bool))
  (let (
    (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
  )
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)
    (asserts! (not (get cancelled market)) ERR-MARKET-CANCELLED)
    (asserts! (>= stacks-block-height (get end-block market)) ERR-MARKET-NOT-EXPIRED)
    (map-set markets market-id (merge market {
      resolved: true,
      outcome:  outcome
    }))
    (print {
      event:     "market-resolved",
      market-id: market-id,
      outcome:   outcome
    })
    (ok true)))

;; --- cancel-market ---
;; Admin cancels an unresolved market and bulk-refunds all bettors.
(define-public (cancel-market (market-id uint))
  (let (
    (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
    (num-bettors (default-to u0 (map-get? bettor-count market-id)))
  )
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)
    (asserts! (not (get cancelled market)) ERR-MARKET-CANCELLED)
    (map-set markets market-id (merge market { cancelled: true }))
    (as-contract
      (fold refund-bettor ITER-LIST { market-id: market-id, count: num-bettors }))
    (print {
      event:            "market-cancelled",
      market-id:        market-id,
      bettors-refunded: num-bettors
    })
    (ok true)))

;; --- claim ---
;; After resolution bettors call claim:
;;   Winner -- proportional STX payout + 30 pts + 10 IPRED
;;   Loser  -- 0 STX + 10 pts + 2 IPRED
(define-public (claim (market-id uint))
  (let (
    (user       tx-sender)
    (market     (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
    (bet        (unwrap! (map-get? bets { market-id: market-id, user: user }) ERR-NO-BET))
    (user-amt   (get amount bet))
    (total-pool (+ (get total-yes market) (get total-no market)))
    (is-winner  (is-eq (get is-yes bet) (get outcome market)))
  )
    (asserts! (get resolved market) ERR-MARKET-NOT-RESOLVED)
    (asserts! (not (get cancelled market)) ERR-MARKET-CANCELLED)
    (asserts! (not (get claimed bet)) ERR-ALREADY-CLAIMED)

    ;; Mark claimed (rolled back if any subsequent try! fails)
    (map-set bets { market-id: market-id, user: user }
      (merge bet { claimed: true }))

    (if is-winner
      (let (
        (winning-pool (if (get outcome market)
                        (get total-yes market)
                        (get total-no market)))
        (payout (/ (* user-amt total-pool) winning-pool))
      )
        (asserts! (> winning-pool u0) ERR-ZERO-POOL)
        (try! (send-from-contract payout user))
        (try! (contract-call? .leaderboard add-pts user WIN-POINTS true))
        (try! (contract-call? .ipredict-token mint user WIN-TOKENS))
        (print {
          event:     "reward-claimed",
          market-id: market-id,
          user:      user,
          is-winner: true,
          payout:    payout,
          points:    WIN-POINTS,
          tokens:    WIN-TOKENS
        })
        (ok true))
      (begin
        (try! (contract-call? .leaderboard add-pts user LOSE-POINTS false))
        (try! (contract-call? .ipredict-token mint user LOSE-TOKENS))
        (print {
          event:     "reward-claimed",
          market-id: market-id,
          user:      user,
          is-winner: false,
          payout:    u0,
          points:    LOSE-POINTS,
          tokens:    LOSE-TOKENS
        })
        (ok true)))))

;; --- withdraw-fees ---
;; Admin withdraws accumulated platform fees.
(define-public (withdraw-fees)
  (let (
    (fees (var-get accumulated-fees))
  )
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (> fees u0) ERR-NO-FEES)
    (try! (send-from-contract fees CONTRACT-OWNER))
    (var-set accumulated-fees u0)
    (print {
      event:  "fees-withdrawn",
      admin:  CONTRACT-OWNER,
      amount: fees
    })
    (ok fees)))

;; ============================================================================
;; Read-Only Functions
;; ============================================================================

(define-read-only (get-market (market-id uint))
  (map-get? markets market-id))

(define-read-only (get-bet (market-id uint) (user principal))
  (map-get? bets { market-id: market-id, user: user }))

(define-read-only (get-market-count)
  (var-get market-count))

(define-read-only (get-odds (market-id uint))
  (match (map-get? markets market-id)
    market
      (let (
        (ty (get total-yes market))
        (tn (get total-no market))
        (tp (+ ty tn))
      )
        (if (is-eq tp u0)
          { yes-percent: u50, no-percent: u50 }
          { yes-percent: (/ (* ty u100) tp),
            no-percent:  (/ (* tn u100) tp) }))
    { yes-percent: u0, no-percent: u0 }))

(define-read-only (get-market-bettors (market-id uint))
  (let (
    (count (default-to u0 (map-get? bettor-count market-id)))
  )
    (get result (fold collect-bettors ITER-LIST {
      market-id: market-id,
      count: count,
      result: (list)
    }))))

(define-read-only (get-accumulated-fees)
  (var-get accumulated-fees))

(define-read-only (get-bettor-count (market-id uint))
  (default-to u0 (map-get? bettor-count market-id)))

