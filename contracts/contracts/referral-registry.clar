;; referral-registry.clar
;; iPredict - Onchain Referral and Identity Contract
;;
;; Manages user registration, display names, referrer linking,
;; referral fee crediting, and earnings tracking.
;; Inter-contract calls: ipredict-token, leaderboard.

;; ============================================================================
;; Constants
;; ============================================================================

(define-constant WELCOME-BONUS-POINTS u5)
(define-constant WELCOME-BONUS-TOKENS u1000000) ;; 1 IPREDICT (6 decimals)
(define-constant REFERRAL-BET-POINTS u3)
(define-constant ERR-NOT-ADMIN (err u300))
(define-constant ERR-UNAUTHORIZED (err u301))
(define-constant ERR-ALREADY-REGISTERED (err u302))
(define-constant ERR-SELF-REFERRAL (err u303))
(define-constant ERR-ALREADY-INITIALIZED (err u304))

;; ============================================================================
;; Data Variables
;; ============================================================================

(define-data-var admin principal tx-sender)
(define-data-var market-contract principal tx-sender)
(define-data-var initialized bool false)

;; ============================================================================
;; Maps
;; ============================================================================

(define-map display-names principal (string-utf8 64))
(define-map referrers principal principal)
(define-map referral-counts principal uint)
(define-map referral-earnings principal uint)
(define-map registered principal bool)

;; ============================================================================
;; Private Helpers
;; ============================================================================

(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

(define-private (is-market-contract)
  (is-eq contract-caller (var-get market-contract))
)

;; ============================================================================
;; Public Functions
;; ============================================================================

;; One-time initialization: store authorized market-contract caller
(define-public (initialize (market principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (not (var-get initialized)) ERR-ALREADY-INITIALIZED)
    (var-set market-contract market)
    (var-set initialized true)
    (print { event: "referral-initialized", market-contract: market })
    (ok true)
  )
)

;; Register a user with a display name and optional referrer.
;; Awards welcome bonus: 5 points via leaderboard + 1 IPREDICT token.
(define-public (register-referral (display-name (string-utf8 64)) (referrer (optional principal)))
  (begin
    ;; Must not already be registered
    (asserts! (not (default-to false (map-get? registered tx-sender))) ERR-ALREADY-REGISTERED)
    ;; If referrer provided, must not be self
    (match referrer
      ref-addr (asserts! (not (is-eq tx-sender ref-addr)) ERR-SELF-REFERRAL)
      true
    )
    ;; Store display name and mark registered
    (map-set display-names tx-sender display-name)
    (map-set registered tx-sender true)
    ;; If referrer provided, store referrer and increment referral count
    (match referrer
      ref-addr (begin
        (map-set referrers tx-sender ref-addr)
        (map-set referral-counts ref-addr
          (+ (default-to u0 (map-get? referral-counts ref-addr)) u1))
        true
      )
      true
    )
    ;; Welcome bonus: 5 points via leaderboard
    (try! (contract-call? .leaderboard add-bonus-pts tx-sender WELCOME-BONUS-POINTS))
    ;; Welcome bonus: 1 IPREDICT token
    (try! (contract-call? .ipredict-token mint tx-sender WELCOME-BONUS-TOKENS))
    (print {
      event: "referral-registered",
      user: tx-sender,
      display-name: display-name,
      referrer: referrer
    })
    (ok true)
  )
)

;; Credit referral fee to a user's referrer.
;; Called by prediction-market to record a referral credit (bookkeeping only).
;; The prediction-market contract handles the actual STX transfer to the referrer.
;; Returns (ok true) if referrer exists, (ok false) if no referrer.
(define-public (credit (user principal) (referral-fee uint))
  (let (
    (maybe-referrer (map-get? referrers user))
  )
    (asserts! (is-market-contract) ERR-UNAUTHORIZED)
    (if (is-some maybe-referrer)
      (let (
        (ref-addr (unwrap-panic maybe-referrer))
      )
        ;; Award 3 bonus points to the referrer
        (try! (contract-call? .leaderboard add-bonus-pts ref-addr REFERRAL-BET-POINTS))
        ;; Accumulate earnings for the referrer
        (map-set referral-earnings ref-addr
          (+ (default-to u0 (map-get? referral-earnings ref-addr)) referral-fee))
        (print {
          event: "referral-credited",
          user: user,
          referrer: ref-addr,
          amount: referral-fee
        })
        (ok true)
      )
      ;; No referrer - return false so caller keeps the fee
      (ok false)
    )
  )
)

;; ============================================================================
;; Read-Only Functions
;; ============================================================================

;; Get the referrer for a user (none if not set)
(define-read-only (get-referrer (user principal))
  (map-get? referrers user)
)

;; Get the display name for a user (none if not registered)
(define-read-only (get-display-name (user principal))
  (map-get? display-names user)
)

;; Get how many users a referrer has referred
(define-read-only (get-referral-count (user principal))
  (default-to u0 (map-get? referral-counts user))
)

;; Get total STX earnings from referrals
(define-read-only (get-earnings (user principal))
  (default-to u0 (map-get? referral-earnings user))
)

;; Check if a user has a referrer
(define-read-only (has-referrer (user principal))
  (is-some (map-get? referrers user))
)

;; Check if a user is registered
(define-read-only (is-registered (user principal))
  (default-to false (map-get? registered user))
)
