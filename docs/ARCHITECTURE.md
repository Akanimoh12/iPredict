# iPredict — Architecture

## System Overview

iPredict is a decentralized prediction market built on **Stacks** using **Clarity** smart contracts with a Next.js 14 frontend. Every transaction is anchored to Bitcoin via Stacks' Proof of Transfer (PoX) consensus.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Pages    │  │  Hooks   │  │  Services    │  │  Wallet       │  │
│  │  (7 routes)│ │  (9 hooks)│ │  (7 modules) │  │  (Leather,    │  │
│  └──────────┘  └──────────┘  └──────┬───────┘  │  Xverse)      │  │
│                                     │           └───────┬───────┘  │
└─────────────────────────────────────┼───────────────────┼──────────┘
                                      │ Stacks API        │ Sign TX
                                      ▼                   ▼
┌─────────────────────────── Stacks Testnet ──────────────────────────┐
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │             prediction-market.clar                          │    │
│  │  create-market · place-bet · resolve-market · cancel-market │    │
│  │  claim · get-market · get-odds · withdraw-fees              │    │
│  │                                                             │    │
│  │  Calls ──►  (contract-call? .ipredict-token mint ...)      │    │
│  │  Calls ──►  (contract-call? .leaderboard add-pts ...)      │    │
│  │  Calls ──►  (contract-call? .referral-registry credit ...) │    │
│  └─────────────────────────────────────────────────────────────┘    │
│           │                 │                    │                   │
│           ▼                 ▼                    ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐     │
│  │ipredict-token│  │ leaderboard  │  │  referral-registry    │     │
│  │  (SIP-010)   │  │   .clar      │  │       .clar           │     │
│  │  mint·burn   │  │  add-pts     │  │  register-referral    │     │
│  │  transfer    │  │  record-bet  │  │  credit (fee split)   │     │
│  │  balance     │  │  get-top     │  │  get-display-name     │     │
│  │  set-minter  │  │  get-stats   │  │                       │     │
│  └──────────────┘  └──────────────┘  └───────────────────────┘     │
│                                                                     │
│                    ┌─ Anchored to Bitcoin via PoX ─┐                │
└────────────────────┴───────────────────────────────┴────────────────┘
```

## Inter-Contract Call Flow

### User Places a Bet (2% fee)

```
User → (contract-call? .prediction-market place-bet u1 true u100000000)
  │                                         ;; 100 STX = 100,000,000 micro-STX
  ├─ 1. Validate: market active, side matches existing bet (if any)
  ├─ 2. (stx-transfer? u100000000 tx-sender (as-contract tx-sender))
  ├─ 3. Deduct 2% fee (2,000,000 micro-STX):
  │     ├─ (contract-call? .referral-registry credit tx-sender u500000)
  │     │   ├── (ok true): referrer received 0.5% + 3 bonus pts
  │     │   └── (ok false): add referral-fee to accumulated-fees
  │     └─ Platform keeps 1.5% (or full 2% if no referrer)
  ├─ 4. Net bet: 98,000,000 micro-STX added to YES pool
  ├─ 5. (contract-call? .leaderboard record-bet tx-sender)
  ├─ 6. Update bettor-at index for the market
  └─ 7. (print { event: "bet-placed", ... })
```

### Admin Resolves Market

```
Admin → (contract-call? .prediction-market resolve-market u1 true)
  │
  ├─ 1. Set resolved = true, outcome = true (YES)
  ├─ 2. Store resolution block-height
  ├─ 3. No funds move yet (payouts happen at claim time)
  └─ 4. (print { event: "market-resolved", ... })
```

### User Claims Rewards

```
User → (contract-call? .prediction-market claim u1)
  │
  ├─ WINNER (bet matches outcome):
  │   ├─ 1. payout = (/ (* user-net-bet total-pool) winning-side-total)
  │   ├─ 2. (as-contract (stx-transfer? payout (as-contract tx-sender) user))
  │   ├─ 3. (contract-call? .leaderboard add-pts tx-sender u30 true)
  │   ├─ 4. (contract-call? .ipredict-token mint tx-sender u10000000)
  │   └─ 5. (print { event: "reward-claimed", ... })
  │
  ├─ LOSER (bet doesn't match outcome):
  │   ├─ 1. No STX payout
  │   ├─ 2. (contract-call? .leaderboard add-pts tx-sender u10 false)
  │   ├─ 3. (contract-call? .ipredict-token mint tx-sender u2000000)
  │   └─ 4. (print { event: "reward-claimed", ... })
  │
  └─ CANCELLED:
      ├─ 1. Refund net bet amount to user via stx-transfer?
      └─ 2. (print { event: "reward-claimed", ... })
```

### User Registers for Referral (Optional)

```
User → (contract-call? .referral-registry register-referral u"CryptoKing" (some referrer))
  │
  ├─ 1. Store display name
  ├─ 2. Link referrer (if provided and valid, no self-referral)
  ├─ 3. (contract-call? .leaderboard add-bonus-pts tx-sender u5)  ;; welcome bonus
  ├─ 4. (contract-call? .ipredict-token mint tx-sender u1000000)  ;; 1 IPRED
  └─ 5. (print { event: "referral-registered", ... })
```

## Data Flow Summary

### Storage Layout

| Contract | Key Storage Items |
|----------|-------------------|
| **prediction-market** | `market-count` (data-var), `markets` (map: uint → tuple), `bets` (map: {market-id, user} → tuple), `bettor-count` (map), `bettor-at` (map), `accumulated-fees` (data-var) |
| **ipredict-token** | `admin` (data-var), `authorized-minters` (map: principal → bool), built-in `define-fungible-token` handles balances + supply |
| **leaderboard** | `points` (map), `total-bets` (map), `won-bets` (map), `lost-bets` (map), `top-player-at` (map: uint → tuple), `top-player-count` (data-var) |
| **referral-registry** | `display-names` (map), `referrers` (map), `referral-counts` (map), `referral-earnings` (map), `registered` (map) |

### Fee Model

| Source | Platform (accumulated-fees) | Referrer | Total |
|--------|----------------------------|----------|-------|
| User has referrer | 1.5% (150 BPS) | 0.5% (50 BPS) | 2.0% |
| User has no referrer | 2.0% (200 BPS) | 0% | 2.0% |

### Reward Model

| Outcome | Points | IPREDICT Tokens | STX Payout |
|---------|--------|-----------------|------------|
| Win | +30 | +10 | proportional share of pool |
| Lose | +10 | +2 | none |
| Cancel | 0 | 0 | net bet refund |
| Register (referral) | +5 | +1 | — |
| Referrer per bet | +3 | 0 | +0.5% of referred bet |

## Frontend Architecture

```
Next.js 14 (App Router)
├── Server Components (pages, layout)
├── Client Components ('use client')
│   ├── Data hooks (useMarkets, useLeaderboard, etc.)
│   ├── Action hooks (useBet, useClaim)
│   └── Context (WalletProvider via useWallet)
├── Services Layer
│   ├── stacks.ts — callReadOnly, openContractCall, getStxBalance
│   ├── market.ts — prediction-market calls
│   ├── token.ts — ipredict-token calls
│   ├── leaderboard.ts — leaderboard calls
│   ├── referral.ts — referral-registry calls
│   ├── events.ts — Stacks API event polling (print events)
│   └── cache.ts — TTL localStorage cache (ip_ prefix)
└── Wallet (@stacks/connect → Leather, Xverse)
```

### Error Handling Strategy

- **React Error Boundaries** wrap every major section (market grid, betting panel, leaderboard table, claim section)
- **Service-level errors** classified into `AppError` types: `NETWORK`, `WALLET`, `CONTRACT`, `VALIDATION`, `TIMEOUT`
- **Toast notifications** for transaction success/failure feedback
- **Graceful fallbacks** — failed contract calls return `null` / empty arrays instead of crashing

### Stacks-Specific Patterns

| Pattern | Details |
|---------|---------|
| **Read-only calls** | `callReadOnlyFunction()` from `@stacks/transactions` — free, no wallet |
| **Write calls** | `openContractCall()` from `@stacks/connect` — Leather/Xverse popup |
| **Post-conditions** | Required on STX transfers to protect users |
| **Events** | `GET /extended/v1/contract/{id}/events` — parse `print` events |
| **Deadlines** | `block-height` instead of Unix timestamps |
| **Native transfers** | `(stx-transfer?)` instead of SAC token transfers |

## Testing Strategy

iPredict uses a three-layer testing approach targeting **at least 90% test coverage** on all smart contracts.

### Unit Tests (Clarinet SDK + Vitest)

- **Location:** `contracts/tests/*.test.ts`
- **Run:** `cd contracts && npx vitest run`
- **Docs:** https://docs.stacks.co/build/clarinet-js-sdk/unit-testing
- Each contract has its own test file testing every public and read-only function in isolation
- Tests cover: positive cases, error branches, access control, edge cases (zero amounts, max values)

### Integration Tests (Clarinet SDK + Vitest)

- **Location:** `contracts/tests/integration.test.ts`
- **Run:** Same `npx vitest run` command
- **Docs:** https://docs.stacks.co/build/clarinet-js-sdk/integration-testing
- Tests the full user flow across all 4 contracts: create market -> register referral -> place bet -> resolve -> claim
- Verifies fee routing (1.5% platform + 0.5% referrer), token minting, leaderboard updates, cancel/refund

### Fuzz Tests (Rendezvous)

- **Location:** `contracts/fuzz/*.fuzz.clar`
- **Run:** `cd contracts && npm run test:fuzz`
- **Docs:** https://stacks-network.github.io/rendezvous/
- **Written in Clarity** (not TypeScript) — defines invariant properties that must hold under any random sequence of contract calls
- Key invariants: pool balance consistency, no insolvency, supply-balance equality, sorted leaderboard, immutable referrer links

### Coverage Targets

| Metric | Target |
|--------|--------|
| Line coverage | >= 90% |
| Branch coverage | >= 85% |
| Function coverage | 100% |
| Fuzz invariants | All critical financial properties |

Run full test suite: `cd contracts && npm run test:all`
