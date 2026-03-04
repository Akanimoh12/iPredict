# iPredict — Technical Architecture

## How It's Built Under the Hood

iPredict is a full-stack prediction market. The backend is four Clarity smart contracts on Stacks. The frontend is a Next.js 14 app that talks directly to the blockchain through the Hiro API. There's no server in between — all state lives on-chain.

---

## The Four Contracts

Each contract has one job. They talk to each other through Clarity's `contract-call?` mechanism.

```
prediction-market.clar (467 lines)
├── Core logic: create markets, accept bets, resolve outcomes, cancel with refunds, claim rewards, manage fees
├── Calls → ipredict-token.mint (reward winners and losers)
├── Calls → referral-registry.credit (route referral fees)
└── Calls → leaderboard.record-bet, leaderboard.add-pts (track stats and points)

ipredict-token.clar (146 lines)
└── SIP-010 fungible token with multi-minter auth (only authorized contracts can mint)

referral-registry.clar (169 lines)
├── User registration, referral chains, fee crediting, display names
├── Calls → leaderboard.add-bonus-pts (referral bonus points)
└── Calls → ipredict-token.mint (token rewards for referrers)

leaderboard.clar (326 lines)
└── Points, stats (wins/losses/bets), sorted top-player ranking with O(n) maintenance
```

**Total:** 1,108 lines of Clarity.

### How the Contracts Trust Each Other

Two layers of access control:

1. **Admin stuff** (create market, resolve, cancel, withdraw fees) — the contract checks `tx-sender` against `CONTRACT-OWNER`. Only the deployer can do these.
2. **Cross-contract stuff** (mint tokens, record stats, credit fees) — checked via `contract-caller` against stored contract addresses.

The `initialize` function on each contract runs once after deployment. It stores the addresses of the other contracts so they can talk to each other securely. No one else gets in.

---

## What Happens When You Place a Bet

Step by step, this is the flow inside the contracts when someone clicks "Place Bet":

1. `prediction-market` receives `(bet market-id is-yes amount)`
2. Validates everything: market exists, hasn't expired, isn't resolved or cancelled, amount ≥ 1 STX
3. Calculates the 2% fee: 1.5% platform + 0.5% referral
4. Transfers the full amount from the user to the contract via `stx-transfer?`
5. Stores the fee breakdown in contract state
6. Calls `referral-registry.credit` — if the user has a referrer, routes 0.5% to them as real STX
7. Stores (or updates) the bet record: amount net of fees, which side they chose, claimed flag
8. Updates the market totals: adds to the YES or NO pool
9. Calls `leaderboard.record-bet` to bump the user's bet count
10. Fires a `print` event with all the bet details

That's 10 steps in a single transaction. All atomic — if any step fails, the whole thing rolls back.

## What Happens When You Claim a Reward

After the market resolves:

1. Checks: market is resolved, your bet exists, you haven't claimed yet
2. **If you won:** payout = `(your_bet ÷ winning_pool) × total_pool`
3. Transfers your payout from the contract to your wallet via `as-contract stx-transfer?`
4. Calls `leaderboard.add-pts` — 30 points for a win, 10 for a loss
5. Calls `ipredict-token.mint` — 10 IPRED for a win, 2 for a loss
6. Fires a `reward-claimed` event

Everyone gets something. Winners get STX + more points + more tokens. Losers get points and tokens for showing up.

---

## The Pari-Mutuel Math

All bets on the losing side get redistributed to the winning side, proportionally.

**Example:** 100 STX total pool (after fees)
- YES pool: 60 STX (3 bettors)
- NO pool: 40 STX (2 bettors)
- Outcome: YES wins

| Bettor | Side | Bet | Payout | Calculation |
|--------|------|-----|--------|-------------|
| A | YES | 30 STX | 50.00 STX | (30/60) × 100 |
| B | YES | 20 STX | 33.33 STX | (20/60) × 100 |
| C | YES | 10 STX | 16.67 STX | (10/60) × 100 |
| D | NO | 25 STX | 0 STX | (lost, but earns 10 pts + 2 IPRED) |
| E | NO | 15 STX | 0 STX | (lost, but earns 10 pts + 2 IPRED) |

The math is clean: everybody's payout comes from the same pool. The contract enforces that total payouts never exceed total deposits.

### Fee Breakdown

| Fee | Rate | Where it goes |
|-----|------|---------------|
| Platform | 1.5% | Accumulates in the contract, admin can withdraw |
| Referral | 0.5% | Sent directly to referrer's wallet (or becomes platform fee if no referrer) |
| **Total** | **2.0%** | Deducted from bet amount before it enters the pool |

---

## Frontend Architecture

### The Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, server components where it makes sense) |
| UI | React 18, Tailwind CSS, glassmorphic design system |
| Wallet | @stacks/connect v8 (Leather + Xverse) |
| Blockchain | @stacks/transactions v7, @stacks/network v7 |
| Testing | Vitest, React Testing Library |
| Hosting | Vercel |

### Routes

| Route | What's there |
|-------|-------------|
| `/` | Landing page — featured markets, live stats, leaderboard preview |
| `/markets` | Browse all markets — status badges, countdown timers, odds bars |
| `/markets/[id]` | Market detail — full view, betting panel, bettor list |
| `/leaderboard` | Rankings — sortable by points, volume, win rate |
| `/profile` | Your stats — bet history, referral info, token balance |
| `/admin` | Admin controls — create, resolve, cancel markets, withdraw fees |

### Service Layer

The frontend wraps all blockchain calls in a service layer:

- **stacks.ts** — read-only calls, balance fetching, ClarityValue parsing, block height estimation
- **market.ts** — market CRUD, bet placement, claims, fee withdrawal
- **leaderboard.ts** — player stats, rankings, top players
- **referral.ts** — registration, display names, referral tracking
- **token.ts** — IPREDICT balance and supply queries
- **cache.ts** — in-memory TTL cache to cut down on API calls
- **events.ts** — event parsing for transaction history

### Block Time — The Nakamoto Problem

Stacks Nakamoto changed block speed from ~10 minutes to seconds. Hardcoding block time would break every countdown timer.

The solution: the frontend calls `/v2/info` and computes block time dynamically from the ratio of `stacks_tip_height` to `tenure_height`. Fast blocks? Timer updates faster. Slow blocks? Timer adjusts. No magic numbers.

### Component Layout

```
components/
  layout/      — Navbar, Footer, MobileMenu
  market/      — MarketCard, BettingPanel, OddsBar, CountdownTimer, MarketImage
  leaderboard/ — LeaderboardTable, PlayerRow, Tabs
  profile/     — BetHistory, PointsCard, ReferralCard, TokenBalance
  social/      — ShareBetButton, SocialShareModal
  admin/       — CreateMarket, ResolveMarket, MarketStats
  wallet/      — WalletConnect
  ui/          — Spinner, Skeleton, Toast, Badge, TxProgress
```

30+ components, organized by domain. No component dump.

---

## Testing Strategy

### Contract Tests (Clarinet SDK + Vitest)

194 unit tests across 5 suites:

- **prediction-market.test.ts** — market lifecycle, betting, resolution, claims, cancellation, edge cases
- **ipredict-token.test.ts** — SIP-010 compliance, multi-minter auth, burn, transfer
- **referral-registry.test.ts** — registration, referral chains, fee crediting
- **leaderboard.test.ts** — points, rankings, sorted insert, stats
- **integration.test.ts** — cross-contract flows (bet → referral → leaderboard → token)

### Fuzz Tests (Rendezvous)

18 invariants across 4 fuzz files:

- Token supply never exceeds total minted
- Market pool totals match the sum of individual bets
- Fee accumulation stays mathematically consistent
- Leaderboard ordering holds after mutations

### Frontend Tests (Vitest + React Testing Library)

133 tests across 9 files:

- Service layer: market calls, leaderboard queries, cache behavior, helpers
- Components: MarketCard, BettingPanel, LeaderboardTable, Navbar, WalletConnect

---

## Deployment Setup

### Contracts

- **Current:** Stacks Testnet (mainnet in Achievement 2)
- **Deployer:** `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV`
- **Tool:** Clarinet with deployment plans
- **Post-deploy:** `initialize` function wires up all inter-contract references

### Frontend

- **Platform:** Vercel
- **Build:** Next.js static + dynamic routes
- **Env vars:** `NEXT_PUBLIC_DEPLOYER_ADDRESS`, `NEXT_PUBLIC_STACKS_API_URL`
- **URL:** https://ipredict-stacks.vercel.app (custom domain planned for mainnet)

### CI/CD

- GitHub Actions pipeline
- Matrix build: Node 18 and 20
- Steps: lint → test → build → clarinet check
