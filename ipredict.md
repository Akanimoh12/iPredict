# iPredict

**Predict. Win or Lose — You Always Earn.**

A decentralized prediction market on **Stacks** where users bet STX on YES/NO outcomes, winners split the pool, and **every participant** earns points + IPREDICT tokens — whether they win or lose. Fully onchain referral system and leaderboard drive viral growth.

![CI/CD](https://github.com/AkanEf);/ipredict-stacks/actions/workflows/ci.yml/badge.svg)
![Stacks](https://img.shields.io/badge/Stacks-Clarity-5546FF?logo=stacks&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Overview

- Users bet STX on YES/NO prediction markets
- Winners split the pool (minus 2% fee: 1.5% platform + 0.5% referrer)
- **All participants earn rewards** — winners AND losers
- IPREDICT token minted as reward via inter-contract calls
- Onchain referral system: register a display name + referrer, earn 0.5% + 3 bonus points on every bet your referrals place
- Referral registration bonus: 5 points + 1 IPREDICT token as welcome gift
- No referrer? Platform keeps the full 2% fee — sustainable revenue model
- Onchain leaderboard ranked by points — shows display names instead of wallet addresses
- Social sharing: share your bet on X, Telegram, WhatsApp after placing a bet

### Why Stacks?

- **Bitcoin-secured finality** — every Stacks transaction is anchored to Bitcoin
- **Fast blocks (~5s)** — bets confirm quickly via Stacks Nakamoto upgrade
- **< $0.01 fees** — micro-bets of 1 STX are practical
- **Clarity smart contracts** — decidable language with no reentrancy by design
- **Built-in STX support** — native STX transfers + custom SIP-010 tokens

---

## Reward System

Every user who participates in a resolved market earns rewards, regardless of outcome. This keeps users engaged and coming back.

| Outcome | Points | IPREDICT Tokens |
|---------|--------|-----------------|
| **Win** (correct prediction) | **30 points** | **10 IPREDICT** |
| **Loss** (wrong prediction) | **10 points** | **2 IPREDICT** |
| **Referral Registration** | **5 points** | **1 IPREDICT** |

### Payout Formula (Winners Only)

```
Each Bet:     2% fee deducted at bet time
              → 1.5% kept by platform (AccumulatedFees)
              → 0.5% sent to referrer (+ 3 bonus pts)
              → If no referrer: full 2% kept by platform
Net Amount:   Amount - 2% fee (enters the pool)
Total Pool:   All net YES bets + All net NO bets
User Payout:  (User Net Bet / Winning Side Net Total) × Total Pool
```

> **Split fee model:** The 2% is collected once at bet time. **1.5% stays in the contract** as platform revenue (`accumulated-fees`, withdrawable by admin). **0.5% goes to the user's referrer** (+ 3 bonus points per referred bet). If the user has **no referrer**, the full 2% stays as platform revenue. No additional fee at claim time.

### Worked Example

```
Market: "Will STX reach $5 by May 15, 2026?"

Total bets placed: 800 STX (before fee)
  → 2% fee deducted at bet time: 16 STX total
  → Fee split: ~12 STX platform (1.5%) + ~4 STX to referrers (0.5%)
     (unregistered users' 0.5% also goes to platform → platform keeps more)
  → Net pool: 784 STX (490 YES + 294 NO)

Outcome: YES wins ✅

Alice bet 50 STX on YES (winner) — has referrer Bob:
  → Total fee: 1 STX (2%)
     → 0.75 STX (1.5%) → accumulated-fees (platform keeps)
     → 0.25 STX (0.5%) → sent to Bob (her referrer) + Bob earns 3 pts
  → Net bet: 49 STX entered the YES pool
  → Payout: (49/490) × 784 = 78.4 STX  (+56.8% profit)
  → Earns:  30 points + 10 IPREDICT tokens

Alice later increased her position with another 20 STX on YES:
  → Total fee: 0.4 STX (2%)
     → 0.30 STX (1.5%) → platform  |  0.10 STX (0.5%) → Bob + 3 pts
  → Additional net: 19.6 STX added to her YES position (total: 68.6 STX)
  → Total payout recalculated with her combined position

Dave bet 30 STX on NO (loser) — has a referrer:
  → Total fee: 0.6 STX (2%)
     → 0.45 STX (1.5%) → platform  |  0.15 STX (0.5%) → referrer + 3 pts
  → Net bet: 29.4 STX entered the NO pool
  → Payout: 0 STX (lost his bet)
  → Earns:  10 points + 2 IPREDICT tokens  ← still rewarded!

Dave tried to bet YES on the same market:
  → REJECTED — cannot bet on opposite side of existing position

Eve bet 20 STX on YES, never registered (no referrer):
  → Total fee: 0.4 STX (2%) → ALL stays as platform revenue
     → 0.30 STX (1.5%) → accumulated-fees
     → 0.10 STX (0.5%) → also accumulated-fees (no referrer → platform keeps full 2%)
  → Net bet: 19.6 STX entered the YES pool
```

### Referral Registration Bonus

Users can optionally register a **display name** and a **referrer**. On registration they receive a **welcome bonus** of 5 points + 1 IPREDICT token. If no referrer is provided, the user has no custom referrer and the full 2% fee on their bets stays as platform revenue. Display names appear on the leaderboard instead of raw wallet addresses.

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Prediction Markets** | Admin creates YES/NO markets with cover images and deadlines (block-height based) |
| **STX Betting** | Users stake STX on their prediction — can increase position on the same side, but cannot bet both sides |
| **Auto Payout** | Winners claim proportional share of the pool |
| **Points + Tokens for All** | Win = 30 pts + 10 IPREDICT, Lose = 10 pts + 2 IPREDICT |
| **IPREDICT Token** | SIP-010 platform token minted via inter-contract call on claim |
| **Onchain Leaderboard** | Top 50 ranked by points — shows display name if registered |
| **Referral with Display Name** | Register a display name + optional referrer, earn 5 pts + 1 IPREDICT welcome bonus |
| **Platform Fee: 1.5% guaranteed** | Platform always keeps at least 1.5% — full 2% when user has no referrer |
| **Social Sharing** | Share your bet on X, Telegram, WhatsApp with one tap after betting |
| **Market Browser** | Filter by active, ending soon, resolved, cancelled with search and sort |
| **Market Images** | Each market has a cover image (e.g. coin logos from CoinMarketCap) |
| **Activity Feed** | Live stream of bets and claims via Stacks API event polling |
| **Mobile-First Design** | Fully responsive with sticky rounded navbar |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Clarity (Stacks native smart contract language) |
| Contract Testing | Clarinet SDK + Vitest |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Wallet | Leather, Xverse via `@stacks/connect` |
| Stacks SDK | `@stacks/transactions`, `@stacks/network`, `@stacks/connect` |
| Icons | `react-icons` (Feather SVG set) |
| Hosting | Vercel |
| CI/CD | GitHub Actions |

---

## Smart Contract Architecture

Four Clarity contracts connected via inter-contract calls:

```
┌──────────────────────────────────────────┐
│            iPredict System               │
│                                          │
│  ┌──────────────────┐                    │
│  │ prediction-market│  (core logic)      │
│  └───────┬──────────┘                    │
│          │ contract-call?                │
│    ┌─────┼──────────┐                    │
│    ▼     ▼          ▼                    │
│  ┌─────┐ ┌────────┐ ┌──────────────┐    │
│  │refer│ │leader- │ │  ipredict-   │    │
│  │ral  │ │board   │ │  token       │    │
│  └─────┘ └────────┘ └──────────────┘    │
└──────────────────────────────────────────┘
```

### Inter-Contract Flow

```
place-bet(market-id, YES, 100 STX)
  ├─ Deduct 2% fee: 2 STX (1.5% platform + 0.5% referrer)
  ├─ stx-transfer? 100 STX → contract
  ├─ Add 1.5 STX to accumulated-fees (platform revenue)
  ├─ (contract-call? .referral-registry credit user 0.5 STX)
  │   └─ If custom referrer: send 0.5 STX + 3 pts to referrer
  │   └─ If no referrer: returns (ok false) → market adds to accumulated-fees (full 2%)
  ├─ If new bet: store bet (net 98 STX); if existing same-side bet: add 98 STX to position
  └─ (contract-call? .leaderboard record-bet user)

resolve-market(market-id, YES)
  └─ Mark market resolved onchain

cancel-market(market-id)  ← admin can cancel if event voided
  └─ Refund net bet amounts to all bettors (2% fee already distributed, not refunded)

claim(market-id)  ← called by ALL users (winners + losers)
  ├─ If winner: stx-transfer? payout from total pool (no additional fee deducted)
  ├─ (contract-call? .leaderboard add-pts user 30 or 10)
  └─ (contract-call? .ipredict-token mint user 10 or 2)

register-referral("CryptoKing", referrer?)  ← optional but incentivized
  ├─ Store display name (shown on leaderboard)
  ├─ Assign referrer (if provided; otherwise no custom referrer → full 2% stays as platform fee)
  ├─ (contract-call? .leaderboard add-bonus-pts user 5)
  └─ (contract-call? .ipredict-token mint user 1)
```

### Key Contract Functions

| Contract | Function | Description |
|----------|----------|-------------|
| **prediction-market** | `create-market` | Admin creates YES/NO market with image |
| **prediction-market** | `place-bet` | User bets STX (or increases existing position on same side), 2% fee split: 1.5% platform + 0.5% referrer |
| **prediction-market** | `resolve-market` | Admin declares outcome |
| **prediction-market** | `claim` | User claims rewards (winners get STX + tokens, losers get tokens) |
| **prediction-market** | `cancel-market` | Admin cancels market, refunds net bet amounts to all bettors |
| **prediction-market** | `withdraw-fees` | Admin withdraws accumulated platform fees |
| **ipredict-token** | `mint` | Mint IPREDICT tokens to user (called by authorized contracts) |
| **referral-registry** | `register-referral` | Register display name + optional referrer, earn 5 pts + 1 IPREDICT welcome bonus |
| **referral-registry** | `credit` | Route 0.5% to referrer + 3 bonus pts (returns bool; false = no referrer, caller keeps fee) |
| **referral-registry** | `get-display-name` | Return user's display name (used on leaderboard) |
| **leaderboard** | `add-pts` | Award 30 (win) or 10 (loss) points |
| **leaderboard** | `add-bonus-pts` | Award welcome bonus points without affecting win/loss counters |
| **leaderboard** | `get-top-players` | Get sorted top-N ranking with display names |

---

## Seed Markets (4 Launch Markets)

| # | Question | Image | End Date |
|---|----------|-------|----------|
| 1 | "Will Bitcoin surpass $150,000 by June 30, 2026?" | [BTC Logo](https://s2.coinmarketcap.com/static/img/coins/200x200/1.png) | June 30, 2026 |
| 2 | "Will STX reach $5 by May 15, 2026?" | [STX Logo](https://s2.coinmarketcap.com/static/img/coins/200x200/4847.png) | May 15, 2026 |
| 3 | "Will Ethereum surpass $8,000 by July 31, 2026?" | [ETH Logo](https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png) | July 31, 2026 |
| 4 | "Will Solana flip BNB in market cap by April 30, 2026?" | [SOL Logo](https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png) | April 30, 2026 |

> **Images:** Use CoinMarketCap coin logos or download and host in `public/images/markets/`. Markets should be created at deploy time to seed the platform.

---

## Frontend Pages

| Page | Purpose |
|------|---------|
| **Landing** | Hero, featured markets, how-it-works, stats |
| **Markets** | Browse/filter/search all markets |
| **Market Detail** | Bet panel, odds bar, countdown, activity feed |
| **Leaderboard** | Top 50 by points with win rates |
| **Profile** | Bet history, points, IPREDICT balance, referral link |
| **Admin** | Create markets, resolve outcomes, cancel markets, withdraw platform fees |

---

## Deployment

```bash
# Install Clarinet
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
# Or: brew install clarinet

# Test all contracts
cd contracts
clarinet test

# Deploy to testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml --no-dashboard

# Initialize contracts via Stacks CLI or frontend admin panel
# (inter-contract links are set at deploy time in Clarity via contract principals)

# Frontend
cd frontend
npm install && npm run dev     # development
npm run build                  # production → Vercel auto-deploys
```

---

## User Acquisition (20 Users in 24h)

| Channel | Action |
|---------|--------|
| Twitter/X | Thread with screenshots + demo link |
| Stacks Discord | Share in #showcase |
| Referral chain | First 5 users refer 2+ each (0.5% + 3 pts per bet incentive) |
| Telegram | Crypto groups |
| Direct | WhatsApp friends with faucet link |

**Seed markets before launch:** BTC/STX/ETH price predictions — things people have strong opinions on.

---

## Roadmap

- **Feb 2026 (MVP):** Markets, betting, claim, IPREDICT token rewards, referrals, leaderboard
- **v2:** User-created markets, oracle auto-resolution, categories
- **v3:** IPREDICT governance staking, mobile app, sBTC integration
- **v4:** Mainnet launch with real STX

---

## License

MIT

---

*Built on Stacks — Bitcoin-secured prediction markets*
*Author: Akanimoh | 2026*
