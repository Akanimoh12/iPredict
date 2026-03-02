;; referral-registry.tests.clar
;; Rendezvous invariant tests for the referral-registry contract.
;; Merged into the contract by rv -- full access to maps and data vars.
;; Run: cd contracts && npx rv . referral-registry invariant

;; ============================================================================
;; Invariants
;; ============================================================================

;; ---------- No Self Referral ----------
;; For any user, if they have a referrer it must not be themselves.
;; The contract enforces this in register-referral; this verifies the
;; state is never corrupted by any sequence of calls.
(define-read-only (invariant-no-self-referral (user principal))
  (match (map-get? referrers user)
    ref (not (is-eq ref user))
    true))

;; ---------- Registration Consistent ----------
;; If a user is marked as registered, they must have a display name.
;; register-referral always sets both registered and display-names;
;; these two maps must stay in sync.
(define-read-only (invariant-registration-consistent (user principal))
  (let (
    (is-reg (default-to false (map-get? registered user)))
    (has-name (is-some (map-get? display-names user)))
  )
    (if is-reg
      has-name
      true)))

;; ---------- Earnings Non-Negative With Context ----------
;; If credit has never been successfully called, no user should have
;; any referral earnings. Earnings can only increase through credit.
(define-read-only (invariant-earnings-monotonic (user principal))
  (let (
    (credit-calls (default-to u0 (get called (map-get? context "credit"))))
    (earnings (default-to u0 (map-get? referral-earnings user)))
  )
    (if (is-eq credit-calls u0)
      (is-eq earnings u0)
      true)))

;; ---------- Registration Once ----------
;; If a user is registered, the registered map entry must be true.
;; Additionally, if register-referral was never successfully called,
;; no user should be registered.
(define-read-only (invariant-registration-once (user principal))
  (let (
    (reg-calls (default-to u0
      (get called (map-get? context "register-referral"))))
    (is-reg (default-to false (map-get? registered user)))
  )
    (if (is-eq reg-calls u0)
      (not is-reg)
      true)))
