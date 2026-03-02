;; ipredict-token.clar
;; iPredict - SIP-010 Fungible Token Contract
;;
;; Implements the SIP-010 standard for the IPREDICT reward token.
;; Supports multi-minter authorization (prediction-market + referral-registry).
;; Uses Clarity built-in `define-fungible-token` primitive.

;; ============================================================================
;; Fungible Token Definition
;; ============================================================================

(define-fungible-token ipredict-token)

;; ============================================================================
;; Data Variables
;; ============================================================================

(define-data-var admin principal tx-sender)
(define-data-var token-name (string-ascii 32) "IPREDICT")
(define-data-var token-symbol (string-ascii 10) "IPRED")
(define-data-var token-decimals uint u6)
(define-data-var token-uri (optional (string-utf8 256)) none)

;; ============================================================================
;; Maps
;; ============================================================================

;; Supports multiple minters (prediction-market + referral-registry)
(define-map authorized-minters principal bool)

;; ============================================================================
;; Error Constants
;; ============================================================================

(define-constant ERR-NOT-ADMIN (err u100))
(define-constant ERR-UNAUTHORIZED-MINTER (err u101))
(define-constant ERR-INSUFFICIENT-BALANCE (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))

;; ============================================================================
;; Private Helpers
;; ============================================================================

(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

(define-private (is-authorized-minter)
  (default-to false (map-get? authorized-minters contract-caller))
)

;; ============================================================================
;; Public Functions - Admin
;; ============================================================================

;; Authorize a principal as a minter (admin only)
(define-public (set-minter (minter principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (map-set authorized-minters minter true)
    (print { event: "minter-added", minter: minter })
    (ok true)
  )
)

;; Remove a principal from authorized minters (admin only)
(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (map-delete authorized-minters minter)
    (print { event: "minter-removed", minter: minter })
    (ok true)
  )
)

;; ============================================================================
;; Public Functions - Minting / Burning
;; ============================================================================

;; Mint tokens to a recipient (authorized minters only)
;; Uses contract-caller for validation so prediction-market and referral-registry
;; can mint via (contract-call? .ipredict-token mint ...)
(define-public (mint (to principal) (amount uint))
  (begin
    (asserts! (is-authorized-minter) ERR-UNAUTHORIZED-MINTER)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-mint? ipredict-token amount to))
    (print { event: "tokens-minted", to: to, amount: amount })
    (ok true)
  )
)

;; Burn tokens from the sender's balance
(define-public (burn (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-burn? ipredict-token amount tx-sender))
    (print { event: "tokens-burned", burner: tx-sender, amount: amount })
    (ok true)
  )
)

;; ============================================================================
;; Public Functions - SIP-010 Transfer
;; ============================================================================

;; SIP-010 transfer: sender must be tx-sender
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender from) ERR-INSUFFICIENT-BALANCE)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-transfer? ipredict-token amount from to))
    (match memo to-print (print to-print) 0x)
    (print { event: "tokens-transferred", from: from, to: to, amount: amount })
    (ok true)
  )
)

;; ============================================================================
;; Read-Only Functions (SIP-010 Required)
;; ============================================================================

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok (var-get token-decimals))
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance ipredict-token account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply ipredict-token))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

