# iPredict Frontend

A decentralized prediction market frontend built on Injective EVM. Predict outcomes, earn rewards, and compete on the leaderboard.

## Features

- 🎯 **Prediction Markets** - Bet on real-world outcomes across multiple categories
- ⚡ **Instant Finality** - Powered by Injective's high-performance blockchain
- 💰 **Near-Zero Fees** - Minimal transaction costs on Injective EVM
- 🏆 **Gamified Rewards** - Earn points for correct predictions
- 📊 **Real-time Updates** - Live odds and activity feed via contract events
- 🌙 **Dark Theme** - Sleek, modern UI optimized for dark mode

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **Web3**: wagmi v2, viem, RainbowKit
- **State Management**: TanStack Query
- **Icons**: Lucide React
- **Animations**: canvas-confetti

## Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/ipredict.git
cd ipredict/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the frontend directory:

```env
# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xfd2f67cD354545712f9d8230170015d7e30d133A

# Injective EVM Testnet
NEXT_PUBLIC_CHAIN_ID=1439
NEXT_PUBLIC_RPC_URL=https://testnet.rpc.inevm.com/http
NEXT_PUBLIC_EXPLORER_URL=https://testnet.blockscout.injective.network

# WalletConnect Project ID (get one at https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Site URL for Open Graph
NEXT_PUBLIC_SITE_URL=https://ipredict.app
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

## Network Configuration

### Injective EVM Testnet
- **Chain ID**: 1439
- **RPC URL**: https://testnet.rpc.inevm.com/http
- **Explorer**: https://testnet.blockscout.injective.network
- **Faucet**: https://testnet.faucet.injective.network

### Injective EVM Mainnet
- **Chain ID**: 2525
- **RPC URL**: https://mainnet.rpc.inevm.com/http
- **Explorer**: https://explorer.inevm.com

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── markets/           # Markets list & detail
│   │   ├── leaderboard/       # Leaderboard page
│   │   ├── profile/           # User profile
│   │   └── admin/             # Admin dashboard
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── providers/        # Context providers
│   │   ├── navigation.tsx    # Header & mobile nav
│   │   ├── market-card.tsx   # Market card component
│   │   ├── betting-panel.tsx # Betting interface
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   │   └── useContract.ts    # Contract interaction hooks
│   ├── lib/                   # Utilities
│   │   ├── contract.ts       # Contract config & ABI
│   │   ├── wagmi.ts          # wagmi configuration
│   │   ├── chains.ts         # Chain definitions
│   │   └── utils.ts          # Helper functions
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
└── tailwind.config.ts        # Tailwind configuration
```

## Key Features

### Landing Page
- Hero section with live platform stats
- Featured trending markets
- How it works guide
- Live activity feed
- Top predictors leaderboard preview
- Why iPredict features
- Roadmap timeline
- Community links

### Markets Page
- Search by market question
- Filter by status (Live, Ending Soon, Resolved)
- Filter by category (Crypto, Sports, Politics, etc.)
- Sort by trending, volume, newest, ending soon
- URL-based filtering for shareable links

### Market Detail Page
- Full market information with countdown
- Real-time odds breakdown
- Betting panel with potential return calculator
- Live activity feed for the market
- Multiple states: betting, resolved, cancelled

### Betting Flow
- YES/NO selection with visual feedback
- Amount input with quick select buttons
- Real-time potential return calculation
- Confetti celebration on success
- Transaction toasts with explorer links

## Contract Hooks

The frontend uses custom hooks for all contract interactions:

```typescript
// Read hooks
useMarkets(offset, limit)     // Fetch paginated markets
useMarket(marketId)           // Fetch single market
useMarketOdds(marketId)       // Get YES/NO percentages
useUserBet(marketId, address) // Get user's bet
useUserStats(address)         // Get user stats & points

// Write hooks
usePlaceBet()                 // Place a bet
useClaimWinnings()            // Claim winnings
useClaimRefund()              // Claim refund (cancelled)

// Event hooks
useBetPlacedEvents(callback)  // Subscribe to bet events
```

## Styling

The app uses a custom dark theme with:
- Background: #09090B (base), #18181B (cards), #27272A (modals)
- Primary: Injective gradient (cyan #00F2FE to blue #4FACFE)
- Semantic: YES green (#10B981), NO red (#EF4444)
- Accent: Gold (#F59E0B) for rewards

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

## License

MIT License

## Links

- **Smart Contract**: [View on Explorer](https://testnet.blockscout.injective.network/address/0xfd2f67cD354545712f9d8230170015d7e30d133A)
- **Injective**: [injective.com](https://injective.com)
- **Documentation**: [docs.injective.network](https://docs.injective.network)

---

Built with ❤️ on Injective

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
