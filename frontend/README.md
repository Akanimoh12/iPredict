# iPredict — Frontend

Next.js 14 (App Router) frontend for the iPredict prediction market, built with React 18, Tailwind CSS, and the Stacks SDK.

## Prerequisites

- Node.js 18+ / npm
- A Stacks-compatible wallet ([Leather](https://leather.io) or [Xverse](https://xverse.app))

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.local.example .env.local

# Start dev server (http://localhost:3000)
npm run dev
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite (133 tests) |
| `npm run test:watch` | Run tests in watch mode |

## Environment Variables

Create `.env.local` (see `.env.local.example`):

```env
NEXT_PUBLIC_STACKS_API_URL=https://api.testnet.hiro.so
NEXT_PUBLIC_DEPLOYER_ADDRESS=ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV
NEXT_PUBLIC_ADMIN_ADDRESS=ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV
NEXT_PUBLIC_NETWORK=testnet
```

## Tech Stack

- **Framework**: Next.js 14 (App Router, React Server Components)
- **UI**: Tailwind CSS with custom dark theme
- **Stacks SDK**: `@stacks/connect` v8, `@stacks/transactions` v7, `@stacks/network` v7
- **Wallet**: Leather / Xverse via Stacks Connect auto-detection
- **Testing**: Vitest + React Testing Library + jsdom

## Directory Structure

```
frontend/
├── public/images/markets/    # Seed market images (btc, stx, eth, sol)
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Home — featured markets, stats, leaderboard
│   │   ├── admin/            # Admin — create & resolve markets
│   │   ├── leaderboard/      # Leaderboard — rankings by wins/volume/streak
│   │   ├── markets/          # Market list & detail ([id])
│   │   └── profile/          # User profile — bet history, referrals
│   ├── components/
│   │   ├── admin/            # CreateMarketForm, ResolveMarketPanel, PlatformStats
│   │   ├── layout/           # Navbar, MobileMenu
│   │   ├── leaderboard/      # LeaderboardTable, LeaderboardTabs, PlayerRow
│   │   ├── market/           # MarketCard, MarketGrid, BettingPanel, OddsBar, etc.
│   │   ├── profile/          # BetHistory, ReferralStats
│   │   ├── social/           # ShareBetButton
│   │   ├── ui/               # Badge, Skeleton, Spinner, TxProgress, etc.
│   │   └── wallet/           # WalletConnect
│   ├── hooks/                # React hooks — useMarket, useBet, useWallet, etc.
│   ├── services/             # Stacks API service layer
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Helpers, share utilities
│   └── __tests__/            # Test files (9 suites, 133 tests)
├── next.config.mjs
├── tailwind.config.ts
├── vitest.config.ts
└── package.json
```

## Routes

| Route | Description |
|---|---|
| `/` | Home page with featured markets, live stats, leaderboard preview |
| `/markets` | Browse all prediction markets |
| `/markets/[id]` | Market detail with betting panel |
| `/leaderboard` | Player rankings |
| `/profile` | User bet history & referral stats |
| `/admin` | Create markets, resolve outcomes, platform stats |

## Deployment

The app is ready for [Vercel](https://vercel.com) deployment:

1. Push to GitHub
2. Import the repo in Vercel
3. Set **Root Directory** to `frontend`
4. Set the environment variables from `.env.local.example`
5. Deploy
