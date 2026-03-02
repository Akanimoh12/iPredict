# iPredict — Project Structure & Architecture

> A comprehensive project structure and development guide for building the iPredict prediction market MVP on **Stacks**. **No code implementation** — this document defines the folder structure, file responsibilities, component flow, contract architecture, and development patterns.

---

## Root Folder Structure

```
ipredict-stacks/
├── .github/
│   └── workflows/
│       └── ci.yml
├── contracts/
│   ├── Clarinet.toml                # Clarinet project manifest
│   ├── settings/
│   │   └── Devnet.toml              # Devnet deployment settings
│   │   └── Testnet.toml             # Testnet deployment settings
│   ├── contracts/
│   │   ├── prediction-market.clar    # Core market logic
│   │   ├── ipredict-token.clar       # SIP-010 platform token
│   │   ├── referral-registry.clar    # Referral tracking
│   │   └── leaderboard.clar          # Rankings & stats
│   ├── tests/
│   │   ├── prediction-market.test.ts # Clarinet SDK unit tests
│   │   ├── ipredict-token.test.ts
│   │   ├── referral-registry.test.ts
│   │   ├── leaderboard.test.ts
│   │   └── integration.test.ts       # Cross-contract integration tests
│   ├── fuzz/
│   │   ├── prediction-market.fuzz.clar  # Rendezvous fuzz tests (Clarity)
│   │   ├── ipredict-token.fuzz.clar
│   │   ├── referral-registry.fuzz.clar
│   │   └── leaderboard.fuzz.clar
│   ├── deployments/
│   │   ├── default.devnet-plan.yaml
│   │   └── default.testnet-plan.yaml
│   └── vitest.config.js              # Vitest config for Clarinet SDK
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── og-image.png
│   │   └── images/
│   │       └── markets/
│   │           ├── btc.png            # CoinMarketCap BTC logo
│   │           ├── stx.png            # CoinMarketCap STX logo
│   │           ├── eth.png            # CoinMarketCap ETH logo
│   │           ├── sol.png            # CoinMarketCap SOL logo
│   │           └── default-market.png
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── providers.tsx
│   │   │   ├── markets/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── leaderboard/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── admin/
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── MobileMenu.tsx
│   │   │   ├── market/
│   │   │   │   ├── MarketCard.tsx
│   │   │   │   ├── MarketGrid.tsx
│   │   │   │   ├── MarketFilters.tsx
│   │   │   │   ├── BettingPanel.tsx
│   │   │   │   ├── OddsBar.tsx
│   │   │   │   ├── CountdownTimer.tsx
│   │   │   │   └── MarketImage.tsx
│   │   │   ├── leaderboard/
│   │   │   │   ├── LeaderboardTable.tsx
│   │   │   │   ├── LeaderboardTabs.tsx
│   │   │   │   └── PlayerRow.tsx
│   │   │   ├── profile/
│   │   │   │   ├── BetHistory.tsx
│   │   │   │   ├── PointsCard.tsx
│   │   │   │   ├── TokenBalance.tsx
│   │   │   │   └── ReferralStats.tsx
│   │   │   ├── social/
│   │   │   │   ├── ShareBetButton.tsx
│   │   │   │   └── SocialShareModal.tsx
│   │   │   ├── wallet/
│   │   │   │   ├── WalletConnect.tsx
│   │   │   │   └── WalletModal.tsx
│   │   │   ├── admin/
│   │   │   │   ├── CreateMarketForm.tsx
│   │   │   │   ├── ResolveMarketPanel.tsx
│   │   │   │   └── PlatformStats.tsx
│   │   │   └── ui/
│   │   │       ├── Spinner.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       ├── TxProgress.tsx
│   │   │       ├── Toast.tsx
│   │   │       ├── Badge.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── hooks/
│   │   │   ├── useMarkets.ts
│   │   │   ├── useMarket.ts
│   │   │   ├── useBet.ts
│   │   │   ├── useClaim.ts
│   │   │   ├── useLeaderboard.ts
│   │   │   ├── useReferral.ts
│   │   │   ├── useToken.ts
│   │   │   ├── useProfile.ts
│   │   │   └── useWallet.tsx
│   │   ├── services/
│   │   │   ├── stacks.ts            # Stacks API client + callReadOnly + openContractCall
│   │   │   ├── market.ts
│   │   │   ├── token.ts
│   │   │   ├── referral.ts
│   │   │   ├── leaderboard.ts
│   │   │   ├── events.ts
│   │   │   └── cache.ts
│   │   ├── config/
│   │   │   └── network.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── helpers.ts
│   │   │   └── share.ts
│   │   ├── wallet/
│   │   │   └── types.ts
│   │   └── __tests__/
│   │       ├── helpers.test.ts
│   │       ├── cache.test.ts
│   │       ├── market.test.ts
│   │       ├── leaderboard.test.ts
│   │       ├── components/
│   │       │   ├── Navbar.test.tsx
│   │       │   ├── MarketCard.test.tsx
│   │       │   ├── BettingPanel.test.tsx
│   │       │   ├── LeaderboardTable.test.tsx
│   │       │   └── WalletConnect.test.tsx
│   │       └── test-setup.ts
│   ├── next.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   └── .env.local
├── docs/
│   ├── ARCHITECTURE.md
│   ├── USER-FEEDBACK.md
│   ├── DEPLOYMENT-GUIDE.md
│   └── ITERATION-LOG.md
├── .gitignore
├── README.md
└── LICENSE
```

---

## Smart Contracts — Clarity on Stacks

### Clarinet Project Layout

Stacks contracts use **Clarity**, a decidable (non-Turing-complete) smart contract language. The project is managed via **Clarinet**, the official Stacks development toolkit.

```
contracts/
├── Clarinet.toml              # [project] lists all 4 contracts + settings
├── settings/
│   ├── Devnet.toml            # Local devnet config (accounts, balances)
│   └── Testnet.toml           # Stacks testnet config
├── contracts/
│   ├── prediction-market.clar # Core market logic
│   ├── ipredict-token.clar    # SIP-010 token
│   ├── referral-registry.clar # Referral system
│   └── leaderboard.clar       # Rankings & stats
├── tests/
│   ├── prediction-market.test.ts   # Unit tests (Vitest + Clarinet SDK)
│   ├── ipredict-token.test.ts
│   ├── referral-registry.test.ts
│   ├── leaderboard.test.ts
│   └── integration.test.ts         # Cross-contract integration tests
├── fuzz/
│   ├── prediction-market.fuzz.clar  # Rendezvous property-based fuzz tests
│   ├── ipredict-token.fuzz.clar
│   ├── referral-registry.fuzz.clar
│   └── leaderboard.fuzz.clar
└── vitest.config.js
```

**Clarinet.toml** lists each contract with its path and dependencies. Unlike Rust/Soroban, Clarity contracts are single `.clar` files — no separate build step. Clarinet handles compile-check, testing, and deployment.

**Key Clarity Patterns:**
- `define-data-var` for single-value storage (admin, market-count)  
- `define-map` for key-value storage (markets, bets, balances, points)  
- `define-public` for state-changing functions (returns `(response ...)`)  
- `define-read-only` for view functions  
- `define-private` for internal helpers  
- `(contract-call? .contract-name function-name args...)` for inter-contract calls  
- `(stx-transfer? amount sender recipient)` for native STX transfers  
- `(asserts! condition (err ...))` for validation checks  
- `tx-sender` — the principal (address) of the transaction sender  
- `block-height` — current Stacks block height (used for deadlines)  

**Testing:** Uses **Clarinet SDK** + **Vitest** (TypeScript tests), not the legacy `clarinet test` system. All tests run with `npx vitest run` inside the `contracts/` directory. **Fuzz tests** use **Rendezvous** — property-based tests written in Clarity that verify contract invariants hold under randomized call sequences.

---

### Testing Strategy

iPredict uses a **three-layer testing strategy** targeting **at least 90% test coverage** across all contracts.

#### 1. Unit Tests (Clarinet SDK + Vitest)

- **Location:** `contracts/tests/*.test.ts`
- **Framework:** Vitest + `@stacks/clarinet-sdk`
- **Docs:** https://docs.stacks.co/build/clarinet-js-sdk/unit-testing
- **Run:** `cd contracts && npx vitest run`
- **Coverage:** `cd contracts && npx vitest run -- --coverage --costs`
- **Scope:** Test each contract function in isolation with deterministic inputs. Verify error cases, edge cases, access control, and state transitions.
- **Target:** Every public and read-only function must have at least one positive and one negative test case.

#### 2. Integration Tests (Clarinet SDK + Vitest)

- **Location:** `contracts/tests/integration.test.ts`
- **Framework:** Same Vitest + Clarinet SDK setup
- **Docs:** https://docs.stacks.co/build/clarinet-js-sdk/integration-testing
- **Run:** Same `npx vitest run` command
- **Scope:** Test end-to-end user flows across all 4 contracts:
  - Full bet lifecycle: create market -> register referral -> place bet -> resolve -> claim
  - Fee routing: 1.5% platform + 0.5% referrer split across prediction-market, referral-registry, and leaderboard
  - Token minting: prediction-market and referral-registry both mint via ipredict-token
  - Leaderboard updates: points, stats, and top-50 ranking across bet + claim + referral flows
  - Cancel/refund flow across all contracts
  - Edge cases: no referrer (full 2% to platform), opposite-side bet rejection, double-claim prevention

#### 3. Fuzz Tests (Rendezvous)

- **Location:** `contracts/fuzz/*.fuzz.clar`
- **Framework:** [Rendezvous](https://stacks-network.github.io/rendezvous/) — property-based fuzz testing for Clarity
- **Language:** Tests are written **in Clarity** (not TypeScript)
- **Run:** `npx @stacks-network/rendezvous` (from `contracts/` directory)
- **Scope:** Define **invariant properties** that must hold true regardless of the sequence or combination of contract calls. Rendezvous generates random transaction sequences and verifies invariants after each step.

**Key invariants to test:**

| Contract | Invariant Property |
|----------|--------------------|
| **prediction-market** | Total pool (total-yes + total-no) must always equal the sum of all net bets for that market |
| **prediction-market** | `accumulated-fees` must never exceed the sum of all fees deducted from bets |
| **prediction-market** | A resolved market's outcome must never change once set |
| **prediction-market** | After all claims on a resolved market, the contract's STX balance must be >= 0 (no insolvency) |
| **prediction-market** | A cancelled market must refund exactly the net bet amount to every bettor |
| **ipredict-token** | `ft-get-supply` must always equal the sum of all `ft-get-balance` calls |
| **ipredict-token** | Only authorized minters can increase total supply |
| **ipredict-token** | A burn must decrease both the user's balance and total supply by exactly the burned amount |
| **leaderboard** | `top-player-at` entries must always be sorted in descending order by points |
| **leaderboard** | `top-player-count` must never exceed MAX-TOP-PLAYERS (50) |
| **leaderboard** | `get-points(user)` must equal the sum of all `add-pts` and `add-bonus-pts` calls for that user |
| **referral-registry** | A registered user's referrer must never change |
| **referral-registry** | `referral-earnings` must equal the sum of all `credit` calls routed to that referrer |
| **referral-registry** | Self-referral must always be rejected |

**Rendezvous fuzz test pattern:**
```clarity
;; Example: prediction-market.fuzz.clar
;;
;; Rendezvous calls contract functions in random order with random args.
;; After each call, it checks all (define-public) functions prefixed with
;; "invariant-" to verify they return (ok true).

(define-public (invariant-pool-balance-consistency)
  ;; Total pool must equal sum of all net bets
  ;; Implementation verifies onchain state
  (ok true)
)

(define-public (invariant-no-insolvency)
  ;; Contract STX balance must be >= outstanding obligations
  (ok true)
)
```

#### Coverage Requirements

| Metric | Target | Tool |
|--------|--------|------|
| **Line coverage** | >= 90% | `npx vitest run -- --coverage` |
| **Branch coverage** | >= 85% | `npx vitest run -- --coverage` |
| **Function coverage** | 100% | Every public/read-only function tested |
| **Fuzz testing** | All critical invariants | Rendezvous |
| **Cost analysis** | All functions profiled | `npx vitest run -- --costs` |

Run the full test suite with coverage report:
```bash
cd contracts
npm run test:report   # vitest run -- --coverage --costs
```

---

### Contract 1: `prediction-market.clar` — Core Logic

**Data Variables:**
- `(define-data-var admin principal tx-sender)` — admin address
- `(define-data-var market-count uint u0)` — total markets created
- `(define-data-var accumulated-fees uint u0)` — platform fees, withdrawable by admin
- `(define-data-var token-contract principal ...)` — IPREDICT token contract principal
- `(define-data-var referral-contract principal ...)` — referral-registry principal
- `(define-data-var leaderboard-contract principal ...)` — leaderboard principal

**Maps:**
- `(define-map markets uint { question: (string-utf8 256), image-url: (string-utf8 512), end-block: uint, total-yes: uint, total-no: uint, resolved: bool, outcome: bool, cancelled: bool, creator: principal, bet-count: uint })` — market data by ID
- `(define-map bets { market-id: uint, user: principal } { amount: uint, is-yes: bool, claimed: bool })` — one bet per (market, user)
- `(define-map bettor-count uint uint)` — unique bettors per market
- `(define-map bettor-at { market-id: uint, index: uint } principal)` — bettor address at index (bounded enumeration, avoids unbounded list)

**Constants:**
```clarity
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-ADMIN (err u100))
(define-constant ERR-MARKET-NOT-FOUND (err u101))
(define-constant ERR-MARKET-EXPIRED (err u102))
(define-constant ERR-MARKET-NOT-EXPIRED (err u103))
(define-constant ERR-MARKET-RESOLVED (err u104))
(define-constant ERR-MARKET-CANCELLED (err u105))
(define-constant ERR-MARKET-NOT-RESOLVED (err u106))
(define-constant ERR-BET-TOO-SMALL (err u107))
(define-constant ERR-OPPOSITE-SIDE (err u108))
(define-constant ERR-ALREADY-CLAIMED (err u109))
(define-constant ERR-NO-BET (err u110))
(define-constant ERR-NO-FEES (err u111))
(define-constant ERR-ALREADY-INITIALIZED (err u112))
(define-constant ONE-STX u1000000)         ;; 1 STX = 1,000,000 micro-STX
(define-constant TOTAL-FEE-BPS u200)       ;; 2%
(define-constant PLATFORM-FEE-BPS u150)    ;; 1.5%
(define-constant BPS-DENOM u10000)
(define-constant WIN-POINTS u30)
(define-constant LOSE-POINTS u10)
(define-constant WIN-TOKENS u10000000)     ;; 10 IPREDICT (6 decimals)
(define-constant LOSE-TOKENS u2000000)     ;; 2 IPREDICT (6 decimals)
```

**Public Functions:**

| Function | Access | Flow |
|----------|--------|------|
| `(initialize (admin principal))` | Admin | Store admin principal. One-time setup. |
| `(create-market (question (string-utf8 256)) (image-url (string-utf8 512)) (duration-blocks uint))` | Admin | Increment market-count, store new Market with `end-block = (+ block-height duration-blocks)`, emit print event |
| `(place-bet (market-id uint) (is-yes bool) (amount uint))` | Public | Validate market active + not expired + not cancelled + amount >= 1 STX + user not on opposite side → calculate fees: `total-fee = (/ (* amount TOTAL-FEE-BPS) BPS-DENOM)`, `platform-fee = (/ (* amount PLATFORM-FEE-BPS) BPS-DENOM)`, `referral-fee = (- total-fee platform-fee)`, `net = (- amount total-fee)` → `(stx-transfer? amount tx-sender (as-contract tx-sender))` → add `platform-fee` to `accumulated-fees` → `(contract-call? .referral-registry credit tx-sender referral-fee)` → if `(ok false)` add `referral-fee` to `accumulated-fees` → store/update bet with `net` amount → `(contract-call? .leaderboard record-bet tx-sender)` → emit print event |
| `(resolve-market (market-id uint) (outcome bool))` | Admin | Validate market exists + not resolved + not cancelled + past deadline → set resolved=true, outcome → emit print event |
| `(cancel-market (market-id uint))` | Admin | Validate exists + not resolved → set cancelled=true → iterate `bettor-at` entries → `(as-contract (stx-transfer? net-bet (as-contract tx-sender) bettor))` refund each → emit print event |
| `(claim (market-id uint))` | Public | Validate market resolved + not cancelled + user has bet + not claimed → determine if winner → if winner: calculate payout = `(/ (* user-net-bet total-pool) winning-side-total)`, `(as-contract (stx-transfer? payout ...))` → `(contract-call? .leaderboard add-pts tx-sender WIN-POINTS true)` + `(contract-call? .ipredict-token mint tx-sender WIN-TOKENS)` → if loser: `(contract-call? .leaderboard add-pts tx-sender LOSE-POINTS false)` + `(contract-call? .ipredict-token mint tx-sender LOSE-TOKENS)` → mark claimed → emit print event |
| `(withdraw-fees)` | Admin | Transfer `accumulated-fees` STX to admin → reset to 0 → emit print event |

**Read-Only Functions:**
- `(get-market (market-id uint))` — returns market tuple or none
- `(get-bet (market-id uint) (user principal))` — returns bet tuple or none
- `(get-market-count)` — returns uint
- `(get-odds (market-id uint))` — returns `{ yes-percent: uint, no-percent: uint }`
- `(get-market-bettors (market-id uint))` — returns list of bettor principals via indexed reads
- `(get-accumulated-fees)` — returns uint

**Events (Clarity `print` statements):**
- `{ event: "market-created", market-id: uint, question: ..., end-block: uint }`
- `{ event: "bet-placed", market-id: uint, user: principal, is-yes: bool, amount: uint, net: uint }`
- `{ event: "market-resolved", market-id: uint, outcome: bool }`
- `{ event: "market-cancelled", market-id: uint }`
- `{ event: "reward-claimed", market-id: uint, user: principal, payout: uint, points: uint, tokens: uint }`
- `{ event: "fees-withdrawn", admin: principal, amount: uint }`

**Tests in `prediction-market.test.ts`:**
- Initialize contract
- Create market successfully
- Place YES bet and verify net amount (after 2% fee) added to totals
- Place NO bet and verify net amount added to totals
- Verify fee split: 1.5% to accumulated-fees, 0.5% routed to referrer via inter-contract call
- Verify full 2% to accumulated-fees when user has no custom referrer
- Verify referrer earns 3 bonus points per referred bet
- Reject bet on expired market (block-height >= end-block)
- Reject bet on resolved market
- Reject bet on cancelled market
- Reject bet below minimum (< 1 STX)
- Increase existing YES position and verify cumulative net amount
- Reject opposite-side bet (user bet YES, tries to bet NO → error)
- Resolve market and verify state
- Reject double resolution
- Cancel market and verify all bettors refunded their net amounts
- Reject cancel on already resolved market
- Claim as winner — verify STX payout from full pool (no additional fee) + inter-contract calls
- Claim as loser — verify no STX payout + still gets points & tokens
- Reject double claim
- Reject claim on unresolved market
- Reject claim on cancelled market
- Get odds calculation accuracy on net totals
- Admin withdraw-fees transfers accumulated-fees and resets to 0
- Reject withdraw-fees by non-admin
- BettorCount and BettorAt indexed enumeration

---

### Contract 2: `ipredict-token.clar` — SIP-010 Platform Token

Implements the **SIP-010 fungible token standard** for the iPredict reward token.

**Data Variables:**
- `(define-data-var admin principal tx-sender)`
- `(define-data-var token-name (string-ascii 32) "IPREDICT")`
- `(define-data-var token-symbol (string-ascii 10) "IPRED")`
- `(define-data-var token-decimals uint u6)`

**Maps:**
- `(define-map authorized-minters principal bool)` — multiple minters (prediction-market + referral-registry)

**Fungible Token:**
- `(define-fungible-token ipredict-token)` — Clarity built-in FT primitive (handles balances + total supply automatically)

**Public Functions:**

| Function | Access | Flow |
|----------|--------|------|
| `(set-minter (minter principal))` | Admin | Store `authorized-minters[minter] = true` — authorize both prediction-market and referral-registry |
| `(remove-minter (minter principal))` | Admin | Delete from `authorized-minters` |
| `(mint (to principal) (amount uint))` | Authorized minter | Validate `authorized-minters[contract-caller] == true` → `(ft-mint? ipredict-token amount to)` → emit print event |
| `(transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))` | Public | SIP-010 standard: `(asserts! (is-eq tx-sender from))` → `(ft-transfer? ipredict-token amount from to)` |
| `(burn (amount uint))` | Public | `(ft-burn? ipredict-token amount tx-sender)` |

**Read-Only Functions (SIP-010 required):**
- `(get-name)` → `"IPREDICT"`
- `(get-symbol)` → `"IPRED"`
- `(get-decimals)` → `u6`
- `(get-balance (account principal))` → uint
- `(get-total-supply)` → uint
- `(get-token-uri)` → `(ok none)`

**Important Clarity details:**
- `contract-caller` is used (not `tx-sender`) to validate that the calling **contract** is an authorized minter. This means `prediction-market.clar` and `referral-registry.clar` can mint when they call via `(contract-call? .ipredict-token mint ...)`.
- `define-fungible-token` provides built-in `ft-mint?`, `ft-transfer?`, `ft-burn?`, `ft-get-balance`, `ft-get-supply` — no manual balance tracking needed.

**Tests:**
- Set minter (prediction-market & referral-registry)
- Mint by first authorized minter (prediction-market)
- Mint by second authorized minter (referral-registry)
- Reject mint by non-minter
- Remove minter and reject subsequent mint
- Balance check after mint
- Transfer between accounts (SIP-010)
- Reject transfer with insufficient balance
- Burn tokens
- Total supply tracking
- SIP-010 trait compliance (get-name, get-symbol, get-decimals)

---

### Contract 3: `referral-registry.clar` — Onchain Referral & Identity

**Data Variables:**
- `(define-data-var admin principal tx-sender)`
- `(define-data-var market-contract principal ...)` — authorized caller for `credit`

**Maps:**
- `(define-map display-names principal (string-utf8 64))` — user-chosen display name
- `(define-map referrers principal principal)` — who referred this user
- `(define-map referral-counts principal uint)` — number of people referred
- `(define-map referral-earnings principal uint)` — total STX earned from referrals
- `(define-map registered principal bool)` — whether user has registered

**Public Functions:**

| Function | Access | Flow |
|----------|--------|------|
| `(initialize (admin principal) (market-contract principal))` | Admin | Store admin + market-contract as authorized caller |
| `(register-referral (display-name (string-utf8 64)) (referrer (optional principal)))` | Public | Validate not already registered, tx-sender != referrer → store display name → if referrer provided: store referrer + increment count → `(contract-call? .leaderboard add-bonus-pts tx-sender u5)` → `(contract-call? .ipredict-token mint tx-sender u1000000)` (1 IPRED) → emit print event |
| `(credit (user principal) (referral-fee uint))` | market-contract only | Validate `contract-caller == market-contract` → check if user has referrer → if YES: `(as-contract (stx-transfer? referral-fee tx-sender referrer))` + `(contract-call? .leaderboard add-bonus-pts referrer u3)` + accumulate earnings → `(ok true)`. If NO: `(ok false)` (no transfer — caller adds fee to accumulated-fees) |

**Read-Only Functions:**
- `(get-referrer (user principal))` → `(optional principal)`
- `(get-display-name (user principal))` → `(optional (string-utf8 64))`
- `(get-referral-count (user principal))` → uint
- `(get-earnings (user principal))` → uint
- `(has-referrer (user principal))` → bool
- `(is-registered (user principal))` → bool

**Important:** Registration is optional — users can bet without registering. However, registering gives a **5-point + 1 IPREDICT welcome bonus** and lets users set a **display name** shown on the leaderboard. Users who never register have no custom referrer, so the full 2% fee from their bets stays as platform revenue.

**Tests:**
- Register with display name + custom referrer successfully
- Register with display name + no referrer → no custom referrer stored
- Welcome bonus: 5 points via `add-bonus-pts` + 1 IPREDICT minted on registration
- Reject self-referral
- Reject double registration
- Display name stored and retrievable
- Credit routes 0.5% to custom referrer when exists + awards 3 bonus points
- Credit returns `(ok false)` when no custom referrer
- Earnings accumulation across multiple credits
- Referrer bonus points accumulate (3 per referred bet)
- Referral count tracking

---

### Contract 4: `leaderboard.clar` — Onchain Points & Rankings

**Data Variables:**
- `(define-data-var admin principal tx-sender)`
- `(define-data-var market-contract principal ...)` — authorized caller
- `(define-data-var referral-contract principal ...)` — authorized caller

**Maps:**
- `(define-map points principal uint)` — total points per user
- `(define-map total-bets principal uint)` — total bet count per user
- `(define-map won-bets principal uint)` — won bet count
- `(define-map lost-bets principal uint)` — lost bet count

**Data Variables for Top Players:**
- `(define-data-var top-player-count uint u0)` — current size of top list
- `(define-map top-player-at uint { address: principal, points: uint })` — indexed top-50 list, sorted descending by points

> **Note:** Clarity does not have dynamic arrays/Vecs. The top-50 list is implemented as a map from index (0..49) to player entry + a counter. Insertion/update uses manual sorting logic (iterate from position, shift entries down). This is capped at 50 entries.

**Public Functions:**

| Function | Access | Flow |
|----------|--------|------|
| `(initialize (admin principal) (market-contract principal) (referral-contract principal))` | Admin | Store admin + authorized callers |
| `(add-pts (user principal) (pts uint) (is-winner bool))` | market-contract | Validate `contract-caller` → add points → if is-winner: increment won-bets, else: increment lost-bets → update sorted top-players list → emit print event |
| `(add-bonus-pts (user principal) (pts uint))` | referral-contract | Validate `contract-caller` → add points → update sorted top-players → emit print event. **Does NOT modify won-bets or lost-bets** |
| `(record-bet (user principal))` | market-contract | Increment total-bets for user |

**Read-Only Functions:**
- `(get-points (user principal))` → uint
- `(get-stats (user principal))` → `{ points: uint, total-bets: uint, won-bets: uint, lost-bets: uint }`
- `(get-top-players (limit uint))` → list of `{ address: principal, points: uint }`
- `(get-rank (user principal))` → uint (position in top-players or 0 if unranked)

**Tests:**
- Add points and verify balance
- Accumulate points across multiple adds
- `add-bonus-pts` awards points without modifying won/lost counters
- Top players sorted correctly after inserts
- Top 50 cap — 51st player doesn't enter if below threshold
- Record bet increments counter
- Get stats returns correct aggregate
- Rank calculation

---

### Inter-Contract Call Flow (Complete)

```
USER PLACES A BET (2% fee deducted at bet time)
────────────────────────────────────────────────
User → (contract-call? .prediction-market place-bet u1 true u100000000)
  │                                            ;; 100 STX = 100,000,000 micro-STX
  ├─ 1. Validate: market active, side matches existing bet (if any)
  ├─ 2. (stx-transfer? u100000000 tx-sender (as-contract tx-sender))
  ├─ 3. Calculate fees:
  │     total-fee = 2,000,000 (2%)
  │     platform-fee = 1,500,000 (1.5%)
  │     referral-fee = 500,000 (0.5%)
  ├─ 4. Add platform-fee to accumulated-fees
  ├─ 5. (contract-call? .referral-registry credit tx-sender referral-fee)
  │     ├── (ok true): referrer received 0.5% + 3 bonus pts
  │     └── (ok false): add referral-fee to accumulated-fees (platform keeps full 2%)
  ├─ 6. Store bet: net = 98,000,000 micro-STX added to YES pool
  ├─ 7. (contract-call? .leaderboard record-bet tx-sender)
  └─ 8. (print { event: "bet-placed", ... })


ADMIN RESOLVES MARKET
─────────────────────
Admin → (contract-call? .prediction-market resolve-market u1 true)
  ├─ 1. Set resolved = true, outcome = true (YES)
  ├─ 2. Store resolution block-height
  └─ 3. (print { event: "market-resolved", ... })


ADMIN CANCELS MARKET
────────────────────
Admin → (contract-call? .prediction-market cancel-market u1)
  ├─ 1. Set cancelled = true
  ├─ 2. Iterate bettor-at entries, refund each bettor's net amount via stx-transfer?
  └─ 3. (print { event: "market-cancelled", ... })


USER CLAIMS REWARDS (winner or loser)
─────────────────────────────────────
User → (contract-call? .prediction-market claim u1)
  │
  ├─ WINNER (bet matches outcome):
  │   ├─ 1. payout = (/ (* user-net-bet total-pool) winning-side-total)
  │   ├─ 2. (as-contract (stx-transfer? payout (as-contract tx-sender) user))
  │   ├─ 3. (contract-call? .leaderboard add-pts tx-sender u30 true)
  │   └─ 4. (contract-call? .ipredict-token mint tx-sender u10000000)
  │
  ├─ LOSER:
  │   ├─ 1. No STX payout
  │   ├─ 2. (contract-call? .leaderboard add-pts tx-sender u10 false)
  │   └─ 3. (contract-call? .ipredict-token mint tx-sender u2000000)
  │
  └─ CANCELLED:
      └─ 1. Refund net bet amount via stx-transfer?


USER REGISTERS FOR REFERRAL (optional but incentivized)
────────────────────────────────────────────────────────
User → (contract-call? .referral-registry register-referral u"CryptoKing" (some referrer))
  ├─ 1. Store display name
  ├─ 2. Link referrer (if provided)
  ├─ 3. (contract-call? .leaderboard add-bonus-pts tx-sender u5)    ;; welcome bonus
  ├─ 4. (contract-call? .ipredict-token mint tx-sender u1000000)    ;; 1 IPRED
  └─ 5. (print { event: "referral-registered", ... })
```

---

## Frontend — Next.js App Structure & Flow

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Stacks SDK | `@stacks/transactions`, `@stacks/network`, `@stacks/connect` |
| Wallet | Leather, Xverse via `@stacks/connect` |
| Icons | `react-icons` (Feather icons `fi` set — real SVG icons, no emoji characters) |
| Testing | Vitest + React Testing Library |
| Hosting | Vercel |

### Stacks Frontend Integration Patterns

Stacks uses:

1. **Read-only calls** via `callReadOnlyFunction()` from `@stacks/transactions` — free, no wallet needed
2. **Write calls** via `openContractCall()` from `@stacks/connect` — opens wallet popup (Leather/Xverse) for signing
3. **Events** via Stacks API `GET /extended/v1/contract/{id}/events` with `print` event parsing
4. **STX balances** via Stacks API `GET /v2/accounts/{address}` endpoint

**Service layer pattern (`services/stacks.ts`):**
```
- getStacksNetwork() → returns StacksTestnet or StacksMainnet
- callReadOnly(contractAddress, contractName, functionName, args) → ClarityValue
- buildContractCallOptions(contractAddress, contractName, functionName, args, postConditions) → ContractCallOptions
- openContractCall(options) → opens Leather/Xverse wallet popup
- getStxBalance(address) → number (in micro-STX)
```

**Post-conditions:** Stacks requires **post-conditions** on transactions to protect users. For `place-bet`, include `makeStandardSTXPostCondition(sender, FungibleConditionCode.Equal, amount)` so the wallet shows the exact STX being transferred.

### Next.js App Router Pages

All page components are server components by default. Interactive components use `'use client'` directive.

#### `app/layout.tsx` — Root Layout

- Wraps entire app in `<Providers>` (wallet context, toast provider)
- Imports global CSS (`globals.css` with Tailwind)
- Sets metadata: title, description, Open Graph image
- Contains `<Navbar />` (sticky with rounded bottom corners) and `<Footer />`
- Google Fonts: Inter (body) + Space Grotesk (headings)
- **React error boundaries** wrapping each major page section

#### `app/providers.tsx` — Client Context Wrapper

- `'use client'` component
- Wraps children in `<WalletProvider>` from `hooks/useWallet.tsx`
- Initializes `@stacks/connect` with app details (name, icon)

#### `app/page.tsx` — Landing Page (`/`)

**Sections in order:**

1. **Hero Section**
   - Bold headline: "Predict. Win or Lose — You Always Earn."
   - Subheading with description
   - Two CTA buttons: "Start Predicting" → `/markets` and "Connect Wallet"
   - Badge: "Live on Stacks Testnet | Low 2% fee"

2. **Feature Cards (3-column grid)**
   - "Bitcoin-Secured" — icon: `FiZap` — "Every transaction anchored to Bitcoin via Stacks"
   - "Everyone Earns" — icon: `FiGift` — "Win: 30 pts + 10 IPRED. Lose: 10 pts + 2 IPRED"
   - "Fully Onchain" — icon: `FiShield` — "All bets, payouts, and rankings stored on Stacks"

3. **How It Works (numbered steps)**
   - Step 01: "Connect Wallet" — Connect Leather or Xverse. No signup needed.
   - Step 02: "Pick a Market" — Browse active predictions. Crypto, markets, events.
   - Step 03: "Bet YES or NO" — Stake STX on your prediction. See live odds.
   - Step 04: "Earn Rewards" — Win or lose, you earn points + IPREDICT tokens.

4. **Featured Markets (horizontal scroll or 3-card grid)**
   - Pulls from `useMarkets()` hook — top 3 by volume or ending soonest
   - Each card: `<MarketCard />` with market image, question, odds bar, pool, countdown, "Bet Now"

5. **Top Creators / Leaderboard Preview**
   - Shows top 3 players from `useLeaderboard()` hook
   - "View All" link → `/leaderboard`

6. **Additional Features Grid (6-card, 2-column)**
   - "Onchain Referrals" — Share your link, earn 0.5% + 3 bonus points
   - "Social Sharing" — Share your prediction on X, Telegram, WhatsApp with one tap
   - "Live Activity" — Real-time event feed of all bets and claims
   - "IPREDICT Token" — Platform token earned by every participant, win or lose
   - "Non-Custodial" — Your keys, your funds. Smart contracts handle everything
   - "Mobile-First" — Full experience on mobile. Bet on the go

7. **Roadmap / Journey (timeline)**
   - Feb 2026: Foundation — MVP launch, testnet, core markets
   - Q2 2026: Growth — User-created markets, oracle resolution, categories
   - Q3 2026: Token Utility — IPREDICT staking, governance, rewards tiers
   - Q4 2026: Scale — Mainnet launch, mobile app, sBTC integration

8. **CTA Footer Section**
   - "Start Predicting Today"
   - Links to: Twitter, GitHub, Stacks Discord

#### `app/markets/page.tsx` — Market Browser (`/markets`)

- **Filter Tabs**: All | Active | Ending Soon | Resolved | Cancelled
- **Search Bar**: keyword search by question text
- **Sort Dropdown**: Newest | Most Volume | Ending Soon | Most Bettors
- **Market Grid**: responsive grid of `<MarketCard />`
- Empty state with illustration when no markets match

#### `app/markets/[id]/page.tsx` — Market Detail (`/markets/:id`)

- **Market Header**: Large market image, question, status badge, countdown timer
- **Odds Bar**: Full-width animated YES%/NO% bar
- **Betting Panel** (`<BettingPanel />`):
  - YES / NO toggle buttons (green / red)
  - Amount input with validation (min 1 STX, max wallet balance)
  - Quick amount buttons: [1] [5] [10] [50] [100] [MAX]
  - Live payout calculation
  - Reward preview showing both win and lose outcomes
  - Submit → opens Leather/Xverse popup via `openContractCall`
  - After bet: `<ShareBetButton />` for social sharing
- **Market Stats Row**: Total Pool | YES Pool | NO Pool | Bettors | Your Bet
- **Claim Section** (shown when market resolved + user has bet)
- **Activity Feed**: Recent bets pulled from Stacks API events

#### `app/leaderboard/page.tsx` — Leaderboard (`/leaderboard`)

- **Tabs**: "Top Predictors" | "Most Active" | "Top Referrers"
- **Table**: Rank | Player (display name or truncated STX address) | Points | Bets | Won | Win Rate
- Current user highlighted + "Your Rank" pinned at top

#### `app/profile/page.tsx` — User Profile (`/profile`)

- **Requires wallet connected** — shows connect prompt if not
- **Stats Overview Cards**: Points + Rank, IPREDICT Balance, Total Bets/Wins, Referral Earnings
- **Bet History**: Table with Market | Bet | Amount | Outcome | Payout | Points | Status
- **Referral Section**: Registration form, referral link, share buttons

#### `app/admin/page.tsx` — Admin Dashboard (`/admin`)

- **Gated**: Only renders if connected wallet === admin address
- **Create Market Form**: Question, image URL, duration (in blocks), submit
- **Pending Resolutions**: Markets past deadline, "Resolve YES" / "Resolve NO" buttons
- **Platform Stats**: Accumulated fees balance, "Withdraw Fees" button, total markets, total bets

---

### Components Breakdown

#### Layout Components (`components/layout/`)

**`Navbar.tsx`** — `'use client'`
- Sticky top with rounded bottom corners
- Logo "iPredict" on left
- Nav links center: Home | Markets | Leaderboard
- Right side: `<WalletConnect />` button (shows Leather/Xverse options)
- Mobile: hamburger → `<MobileMenu />`

**`Footer.tsx`** — Links, copyright, Stacks attribution
**`MobileMenu.tsx`** — Full-screen overlay for mobile nav

#### Market Components (`components/market/`)

**`MarketCard.tsx`** — Card with image, question, odds bar, pool, countdown, "Bet Now"
**`MarketGrid.tsx`** — CSS Grid: 3 cols desktop, 2 tablet, 1 mobile
**`MarketFilters.tsx`** — Filter tabs + search + sort
**`BettingPanel.tsx`** — `'use client'` — Main betting interface, uses `openContractCall` with post-conditions
**`OddsBar.tsx`** — Animated YES/NO percentage bar
**`CountdownTimer.tsx`** — `'use client'` — Shows blocks remaining or "Ended"
**`MarketImage.tsx`** — Market cover image via `next/image`

#### Leaderboard Components (`components/leaderboard/`)

**`LeaderboardTable.tsx`** — Ranking table
**`LeaderboardTabs.tsx`** — Tab switcher for ranking modes
**`PlayerRow.tsx`** — Single leaderboard row with rank, name, stats

#### Profile Components (`components/profile/`)

**`BetHistory.tsx`** — Table of user's bets
**`PointsCard.tsx`** — Points + rank card
**`TokenBalance.tsx`** — IPREDICT balance
**`ReferralStats.tsx`** — Referral link + count + earnings

#### Social Components (`components/social/`)

**`ShareBetButton.tsx`** — Opens share modal after betting
**`SocialShareModal.tsx`** — Portal-rendered modal: X, Telegram, WhatsApp, Copy Link

#### Wallet Components (`components/wallet/`)

**`WalletConnect.tsx`** — Connect/disconnect button
- Shows "Connect Wallet" when disconnected
- Shows truncated STX address + disconnect when connected
- Uses `@stacks/connect` → `showConnect()` to open Leather/Xverse

**`WalletModal.tsx`** — `'use client'`
- Rendered via `createPortal`
- Lists Leather, Xverse with logos
- Uses `@stacks/connect` for wallet connection

#### UI Components (`components/ui/`)

**`Spinner.tsx`** — CSS spinner
**`Skeleton.tsx`** — Loading placeholder with shimmer
**`TxProgress.tsx`** — Multi-step transaction tracker (Building → Signing → Submitting → Confirmed)
**`Toast.tsx`** — Success/error notification with auto-dismiss
**`Badge.tsx`** — Status badge (Active / Resolved / Cancelled)
**`EmptyState.tsx`** — Empty state illustration

---

### Hooks

| Hook | Purpose |
|------|---------|
| `useMarkets` | Fetch all markets, apply filter/sort/search, auto-poll every 30s |
| `useMarket` | Fetch single market + user's bet |
| `useBet` | Wraps `openContractCall` for placing bets. Manages tx lifecycle |
| `useClaim` | Wraps `openContractCall` for claiming rewards |
| `useLeaderboard` | Fetch top 50 players, tabbed views |
| `useReferral` | Fetch referral info for user |
| `useToken` | Fetch IPREDICT balance + token info |
| `useProfile` | Aggregate stats, token, referral info |
| `useWallet` | Context provider: connect/disconnect Leather/Xverse, sign transactions |

### Services

| Service | Purpose |
|---------|---------|
| `stacks.ts` | Core: network config, `callReadOnly`, `openContractCall`, STX balance |
| `market.ts` | All prediction-market contract calls (read + write) |
| `token.ts` | IPREDICT token calls |
| `referral.ts` | Referral registry calls |
| `leaderboard.ts` | Leaderboard calls |
| `events.ts` | Stacks API event polling for activity feed |
| `cache.ts` | TTL localStorage cache (`ip_` prefix, SSR-safe) |

---

## Seed Markets

Create these 4 markets at deploy time:

| # | Question | Image Source | End Date | Duration (est. blocks) |
|---|----------|-------------|----------|----------------------|
| 1 | "Will Bitcoin surpass $150,000 by June 30, 2026?" | [CoinMarketCap BTC](https://s2.coinmarketcap.com/static/img/coins/200x200/1.png) → `public/images/markets/btc.png` | June 30, 2026 | ~1,785,600 blocks |
| 2 | "Will STX reach $5 by May 15, 2026?" | [CoinMarketCap STX](https://s2.coinmarketcap.com/static/img/coins/200x200/4847.png) → `public/images/markets/stx.png` | May 15, 2026 | ~1,123,200 blocks |
| 3 | "Will Ethereum surpass $8,000 by July 31, 2026?" | [CoinMarketCap ETH](https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png) → `public/images/markets/eth.png` | July 31, 2026 | ~2,228,480 blocks |
| 4 | "Will Solana flip BNB in market cap by April 30, 2026?" | [CoinMarketCap SOL](https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png) → `public/images/markets/sol.png` | April 30, 2026 | ~907,200 blocks |

> **Block duration estimates:** Stacks Nakamoto ~5s blocks. Adjust `duration-blocks` based on deploy date. These markets represent real crypto predictions with clear resolution criteria.
