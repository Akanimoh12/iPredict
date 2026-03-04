<p align="center">
  <img src="frontend/public/favicon.svg" width="64" height="64" alt="iPredict logo" />
</p>

<h1 align="center">iPredict — Prediction Market on Stacks</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Stacks-Clarity-purple?logo=stacks" alt="Stacks" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/Bitcoin-Secured-orange?logo=bitcoin" alt="Bitcoin" />
</p>

> **Predict. Win or Lose — You Always Earn.** Decentralized prediction market on Stacks, secured by Bitcoin via Proof of Transfer.

---

## Live Demo

**Frontend:** [https://ipredict-stacks.vercel.app](https://ipredict-stacks.vercel.app)

## Demo Video

[Watch Full MVP Flow on YouTube](https://youtu.be/k3XKU__0uVs) — *Wallet connect → browse markets → place bet → view leaderboard → claim reward → referral flow*

## Screenshots

| Landing Page | Markets Browser | Market Detail |
|:---:|:---:|:---:|
| ![Landing](docs/screenshots/landing.png) | ![Markets](docs/screenshots/markets.png) | ![Detail](docs/screenshots/detail.png) |

| Betting Panel | Leaderboard | Profile |
|:---:|:---:|:---:|
| ![Betting](docs/screenshots/betting.png) | ![Leaderboard](docs/screenshots/leaderboard.png) | ![Profile](docs/screenshots/profile.png) |

---

## Features

- **Binary Prediction Markets** — Bet YES or NO on any question with STX
- **Bitcoin-Secured** — Every transaction anchored to Bitcoin via Stacks PoX
- **Inclusive Reward System** — Both winners AND losers earn points + IPREDICT tokens
- **Onchain Referral Program** — Share your link, earn 0.5% of every referred bet + bonus points
- **Real-Time Leaderboard** — Rankings by points, volume, and win rate from onchain data
- **Social Sharing** — One-tap sharing to X, Telegram, WhatsApp after every bet
- **4 Clarity Smart Contracts** — Single responsibility, independently testable
- **Low Fees** — Only 2% total (1.5% platform + 0.5% referrer)
- **Stacks Nakamoto Speed** — Fast block times with Bitcoin finality
- **Mobile-First Design** — Fully responsive glassmorphic UI
- **Non-Custodial** — Your keys, your funds. Smart contracts handle everything

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 14 Frontend                        │
│  (App Router • Tailwind CSS • @stacks/connect)                 │
└──────────────┬──────────────┬──────────────┬──────────────┬─────┘
               │              │              │              │
         Stacks API      Stacks API    Stacks API     Stacks API
               │              │              │              │
  ┌────────────▼──┐ ┌────────▼────┐ ┌───────▼──────┐ ┌────▼────────┐
  │  prediction-  │ │  ipredict-  │ │   referral-  │ │ leaderboard │
  │  market.clar  │ │  token.clar │ │ registry.clar│ │    .clar    │
  │               │ │  (SIP-010)  │ │              │ │             │
  │ create-market │ │ mint        │ │ register     │ │ add-pts     │
  │ place-bet  ───┼─┼─► mint ◄───┼─┤ credit ──────┼─┤ record-bet  │
  │ resolve    ───┼─┼─► mint     │ │ get-referrer │ │ get-stats   │
  │ claim      ───┼─┼─► mint     │ │ get-earnings │ │ get-top     │
  │ cancel        │ │ transfer   │ │ is-registered│ │ get-rank    │
  │ withdraw-fees │ │ balance    │ │              │ │             │
  └───────────────┘ └────────────┘ └──────────────┘ └─────────────┘
```

### Inter-Contract Call Flow

**Place Bet:** `prediction-market.place-bet()` → `(stx-transfer?)` moves STX → `(contract-call? .referral-registry credit ...)` (splits fee: 0.5% to referrer, 1.5% to platform) → `(contract-call? .leaderboard record-bet ...)` → `(print { event: "bet-placed", ... })`

**Resolve Market:** `prediction-market.resolve-market()` → Stores outcome onchain

**Claim Reward:** `prediction-market.claim()` → Calculates pro-rata payout → `(as-contract (stx-transfer? ...))` to user → `(contract-call? .leaderboard add-pts ...)` (win: 30 pts / lose: 10 pts) → `(contract-call? .ipredict-token mint ...)` (win: 10 IPRED / lose: 2 IPRED)

**Referral Registration:** `referral-registry.register-referral()` → `(contract-call? .leaderboard add-bonus-pts ...)` (5 pts) → `(contract-call? .ipredict-token mint ...)` (1 IPRED welcome bonus)

---

## Reward System

| Outcome | STX Payout | Points | IPREDICT Tokens |
|---------|-----------|--------|-----------------|
| **Win** | Pro-rata share of losing pool | +30 pts | +10 IPRED |
| **Lose** | 0 STX | +10 pts | +2 IPRED |
| **Cancelled** | Full refund | 0 pts | 0 IPRED |
| **Referral Registration** | — | +5 pts | +1 IPRED |
| **Referred Bet** (referrer earns) | 0.5% of bet | +3 pts | — |

### Payout Formula

$$\text{Payout} = \frac{\text{UserBet}}{\text{WinningSidePool}} \times \text{TotalPool}$$

### Fee Model

| Component | Rate | Recipient |
|-----------|------|-----------|
| Platform fee | 1.5% | Admin (accumulated, withdrawable) |
| Referral fee | 0.5% | Referrer's STX address |
| **Total** | **2.0%** | Deducted at bet time |

*If bettor has no referrer, full 2% goes to platform.*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contracts** | Clarity (Clarity 2, Epoch 2.5) |
| **Contract Tooling** | Clarinet v2 + Clarinet SDK |
| **Frontend** | Next.js 14 (App Router) |
| **UI** | React + Tailwind CSS |
| **Language** | TypeScript |
| **Wallet** | Leather, Xverse via `@stacks/connect` |
| **Stacks SDK** | `@stacks/transactions`, `@stacks/network`, `@stacks/connect` |
| **Testing** | Vitest + Clarinet SDK (contracts) + Rendezvous fuzz testing + React Testing Library (frontend) |
| **Deployment** | Vercel (frontend) + Stacks Testnet (contracts) |

---

## Project Structure

```
ipredict-stacks/
├── .github/workflows/ci.yml       # CI pipeline
├── contracts/
│   ├── Clarinet.toml               # Clarinet project manifest
│   ├── settings/
│   │   ├── Devnet.toml             # Local devnet config
│   │   └── Testnet.toml            # Testnet config
│   ├── contracts/
│   │   ├── prediction-market.clar  # Core market logic
│   │   ├── ipredict-token.clar     # SIP-010 platform token
│   │   ├── referral-registry.clar  # Referral tracking
│   │   └── leaderboard.clar        # Rankings & stats
│   ├── tests/
│   │   ├── prediction-market.test.ts
│   │   ├── ipredict-token.test.ts
│   │   ├── referral-registry.test.ts
│   │   ├── leaderboard.test.ts
│   │   └── integration.test.ts     # Cross-contract integration tests
│   ├── fuzz/
│   │   ├── prediction-market.fuzz.clar  # Rendezvous fuzz tests
│   │   ├── ipredict-token.fuzz.clar
│   │   ├── referral-registry.fuzz.clar
│   │   └── leaderboard.fuzz.clar
│   └── vitest.config.js
├── frontend/
│   ├── public/                     # Favicon, OG image, market images
│   ├── src/
│   │   ├── app/                    # Next.js pages (7 routes)
│   │   ├── components/             # 30+ React components
│   │   │   ├── layout/             # Navbar, Footer, MobileMenu
│   │   │   ├── market/             # MarketCard, BettingPanel, OddsBar…
│   │   │   ├── leaderboard/        # LeaderboardTable, Tabs, PlayerRow
│   │   │   ├── profile/            # BetHistory, PointsCard, Referral…
│   │   │   ├── social/             # ShareBetButton, SocialShareModal
│   │   │   ├── wallet/             # WalletConnect, WalletModal
│   │   │   ├── admin/              # CreateMarket, Resolve, Stats
│   │   │   └── ui/                 # Spinner, Skeleton, Toast, Badge…
│   │   ├── hooks/                  # useMarket, useWallet, useBet…
│   │   ├── services/               # Stacks API service layer
│   │   ├── utils/                  # Helpers, cache, formatting
│   │   ├── config/                 # Network constants
│   │   └── types/                  # TypeScript interfaces
│   ├── __tests__/                  # Frontend test suites
│   └── .env.local.example          # Environment template
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT-GUIDE.md
│   ├── USER-FEEDBACK.md
│   └── ITERATION-LOG.md
└── README.md
```

---

## Getting Started

### Prerequisites

- **Clarinet** v2+ ([install guide](https://docs.hiro.so/clarinet/getting-started))
- **Node.js** >= 18
- **Leather** or **Xverse** wallet browser extension (for testnet interaction)

### Setup

```bash
# Clone
git clone https://github.com/AkanEf);/ipredict-stacks.git
cd ipredict-stacks

# Verify contracts compile
cd contracts
clarinet check

# Install test dependencies and run contract tests
npm install
npx vitest run

# Run with coverage report (target: >= 90%)
npm run test:report

# Run fuzz tests (Rendezvous)
npm run test:fuzz

# Setup frontend
cd ../frontend
cp .env.local.example .env.local
# Edit .env.local with your deployed contract details
npm install
npm test
npm run build
npm run dev  # http://localhost:3000
```

### Deploy Contracts (Testnet)

See [docs/DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md) for the full step-by-step deployment guide.

---

## Smart Contract Functions

### prediction-market.clar

| Function | Description |
|----------|-------------|
| `(initialize (admin principal))` | One-time admin setup |
| `(create-market (question ...) (image-url ...) (duration-blocks uint))` | Create new prediction market |
| `(place-bet (market-id uint) (is-yes bool) (amount uint))` | Place or increase bet (2% fee deducted) |
| `(resolve-market (market-id uint) (outcome bool))` | Admin resolves with YES/NO outcome |
| `(cancel-market (market-id uint))` | Cancel market, refund all bettors |
| `(claim (market-id uint))` | Claim payout + points + tokens |
| `(withdraw-fees)` | Admin withdraws accumulated platform fees |
| `(get-market (market-id uint))` | Read market data |
| `(get-bet (market-id uint) (user principal))` | Read user's bet |
| `(get-market-count)` | Total markets created |
| `(get-odds (market-id uint))` | Current YES/NO percentages |
| `(get-accumulated-fees)` | Total unclaimed platform fees |

### ipredict-token.clar (SIP-010)

| Function | Description |
|----------|-------------|
| `(set-minter (minter principal))` | Authorize address to mint |
| `(remove-minter (minter principal))` | Revoke minting rights |
| `(mint (to principal) (amount uint))` | Mint tokens (authorized minters only, uses `contract-caller`) |
| `(transfer (amount uint) (from principal) (to principal) (memo ...))` | SIP-010 transfer |
| `(burn (amount uint))` | Burn tokens |
| `(get-balance (account principal))` | Get token balance |
| `(get-total-supply)` | Total tokens minted |
| `(get-name)` / `(get-symbol)` / `(get-decimals)` | Token metadata |

### referral-registry.clar

| Function | Description |
|----------|-------------|
| `(initialize (admin principal) (market-contract principal))` | One-time setup |
| `(register-referral (display-name ...) (referrer (optional principal)))` | Register with optional referrer |
| `(credit (user principal) (referral-fee uint))` | Credit referral fee (called by market contract) |
| `(get-referrer (user principal))` | Get user's referrer address |
| `(get-display-name (user principal))` | Get registered display name |
| `(get-referral-count (user principal))` | Number of referrals |
| `(get-earnings (user principal))` | Total referral earnings |
| `(has-referrer (user principal))` / `(is-registered (user principal))` | Status checks |

### leaderboard.clar

| Function | Description |
|----------|-------------|
| `(initialize (admin principal) (market-contract principal) (referral-contract principal))` | One-time setup |
| `(add-pts (user principal) (pts uint) (is-winner bool))` | Add win/loss points + update stats |
| `(add-bonus-pts (user principal) (pts uint))` | Add bonus points (no stat inflation) |
| `(record-bet (user principal))` | Increment total bets count |
| `(get-points (user principal))` | Get user's total points |
| `(get-stats (user principal))` | Full player stats |
| `(get-top-players (limit uint))` | Sorted leaderboard |
| `(get-rank (user principal))` | User's current rank |

---

## Seed Markets

| # | Question | Image | End Date |
|---|----------|-------|----------|
| 1 | Will Bitcoin surpass $150,000 by June 30, 2026? | BTC | June 30, 2026 |
| 2 | Will STX reach $5 by May 15, 2026? | STX | May 15, 2026 |
| 3 | Will Ethereum surpass $8,000 by July 31, 2026? | ETH | July 31, 2026 |
| 4 | Will Solana flip BNB in market cap by April 30, 2026? | SOL | April 30, 2026 |

---

## Roadmap

| Phase | Timeline | Milestone |
|-------|----------|-----------|
| **Foundation** | Feb 2026 | MVP launch, testnet, core markets |
| **Growth** | Q2 2026 | User-created markets, oracle resolution, categories |
| **Token Utility** | Q3 2026 | IPREDICT staking, governance, reward tiers |
| **Scale** | Q4 2026 | Mainnet launch, mobile app, sBTC integration |

---

## License

[MIT](LICENSE)

---

## Author

Built by **Akan** for the Stacks ecosystem.
