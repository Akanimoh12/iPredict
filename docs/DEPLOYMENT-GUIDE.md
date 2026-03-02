# iPredict — Deployment Guide

## Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) (v2.x+)
- [Node.js](https://nodejs.org/) 18+ with npm
- A funded Stacks testnet account

### Admin Wallet

Use a Stacks testnet address. Fund via the Hiro faucet.

```bash
# Fund your testnet account
# Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet
# Or use Clarinet devnet accounts for local testing
```

---

## Step 1: Verify Contracts Compile

```bash
cd contracts

# Check all contracts compile successfully
clarinet check

# Expected output: 4 contracts checked, 0 errors
```

---

## Step 2: Run Contract Tests

```bash
cd contracts

# Install test dependencies
npm install

# Run all Clarinet SDK tests (unit + integration)
npx vitest run

# Run with verbose output
npx vitest run --reporter=verbose

# Run with coverage report (target: >= 90% line coverage)
npm run test:report
```

---

## Step 2b: Run Fuzz Tests (Rendezvous)

```bash
cd contracts

# Run property-based fuzz tests
npm run test:fuzz

# This runs Rendezvous, which:
# - Generates random sequences of contract calls
# - Checks all invariant-* functions after each call
# - Reports any invariant violations
```

Fuzz test files are in `contracts/fuzz/*.fuzz.clar` (written in Clarity). They verify critical invariants like pool balance consistency, no insolvency, supply-balance equality, sorted leaderboard, etc.

See https://stacks-network.github.io/rendezvous/ for more details.

---

## Step 3: Local Development with Devnet

```bash
cd contracts

# Start local Stacks devnet
clarinet devnet start

# This spins up:
# - Stacks node
# - Bitcoin node
# - Stacks API
# - Contract deployments (auto-deploys all contracts in Clarinet.toml)
```

Devnet accounts (from `settings/Devnet.toml`):
- `deployer` — admin, 100M STX
- `wallet_1` through `wallet_5` — test users, 100M STX each

---

## Step 4: Deploy to Testnet

### 4a. Configure Testnet Account

Edit `settings/Testnet.toml` with your testnet deployer mnemonic:

```toml
[accounts.deployer]
mnemonic = "<YOUR_TESTNET_DEPLOYER_MNEMONIC>"
```

### 4b. Generate Deployment Plan

```bash
clarinet deployments generate --testnet
# Generates deployments/default.testnet-plan.yaml
```

### 4c. Deploy

```bash
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

This deploys all 4 contracts in the correct dependency order.

---

## Step 5: Initialize Contracts

After deployment, initialize the contracts via the Stacks Explorer sandbox or a script.

### 5a. Initialize Leaderboard

```
Contract: leaderboard
Function: initialize
Args:
  admin: (deployer principal)
  market-contract: (prediction-market principal)
  referral-contract: (referral-registry principal)
```

### 5b. Authorize Token Minters

```
Contract: ipredict-token
Function: set-minter
Args:
  minter: (prediction-market principal)

Contract: ipredict-token
Function: set-minter
Args:
  minter: (referral-registry principal)
```

### 5c. Initialize Referral Registry

```
Contract: referral-registry
Function: initialize
Args:
  admin: (deployer principal)
  market-contract: (prediction-market principal)
```

### 5d. Initialize Prediction Market

```
Contract: prediction-market
Function: initialize
Args:
  admin: (deployer principal)
```

---

## Step 6: Create Seed Markets

Create 4 seed markets after initialization:

```
Contract: prediction-market
Function: create-market

Market 1:
  question: "Will Bitcoin surpass $150,000 by June 30, 2026?"
  image-url: "/images/markets/btc.png"
  duration-blocks: u1785600

Market 2:
  question: "Will STX reach $5 by May 15, 2026?"
  image-url: "/images/markets/stx.png"
  duration-blocks: u1123200

Market 3:
  question: "Will Ethereum surpass $8,000 by July 31, 2026?"
  image-url: "/images/markets/eth.png"
  duration-blocks: u2228480

Market 4:
  question: "Will Solana flip BNB in market cap by April 30, 2026?"
  image-url: "/images/markets/sol.png"
  duration-blocks: u907200
```

> **Note:** Block duration estimates assume Stacks Nakamoto ~5s blocks. Adjust based on actual deploy date.

---

## Step 7: Deploy Frontend

### 7a. Configure Environment

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local` with deployed contract details:

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=<DEPLOYER_STX_ADDRESS>
NEXT_PUBLIC_PREDICTION_MARKET_NAME=prediction-market
NEXT_PUBLIC_TOKEN_NAME=ipredict-token
NEXT_PUBLIC_REFERRAL_NAME=referral-registry
NEXT_PUBLIC_LEADERBOARD_NAME=leaderboard
NEXT_PUBLIC_ADMIN_ADDRESS=<DEPLOYER_STX_ADDRESS>
```

### 7b. Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 7c. Run Tests

```bash
npm test
```

### 7d. Production Build

```bash
npm run build
```

### 7e. Deploy to Vercel

1. Connect GitHub repository to [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add all `NEXT_PUBLIC_*` environment variables in Vercel dashboard
4. Deploy — Vercel auto-deploys on push to `main`

---

## Verification Checklist

After deployment, verify each feature end-to-end:

- [ ] All contract tests pass (`npx vitest run`)
- [ ] Test coverage >= 90% (`npm run test:report`)
- [ ] Fuzz tests pass with no invariant violations (`npm run test:fuzz`)
- [ ] Landing page loads with live stats
- [ ] Markets page shows seed markets
- [ ] Market detail page shows odds and betting panel
- [ ] Wallet connects via Leather / Xverse
- [ ] Placing a bet succeeds (check transaction on Stacks Explorer)
- [ ] Leaderboard shows rankings
- [ ] Profile page shows bet history after placing bets
- [ ] Admin page accessible only by admin wallet
- [ ] Resolving a market works
- [ ] Claiming rewards works (winner gets STX + points + tokens)
- [ ] Referral registration works
- [ ] Social sharing generates correct URLs

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `clarinet check` fails | Verify Clarity syntax — Clarity is strict about parentheses and types |
| `Contract not found` | Verify contract address and name in `.env.local` |
| `Post-condition failed` | Ensure post-conditions match exact STX amounts being transferred |
| `Insufficient funds` | Fund account via testnet faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet |
| `Wallet not connecting` | Ensure Leather/Xverse is set to Testnet network |
| `Tests fail` | Run `npm install` in contracts/ to install Clarinet SDK dependencies |
| `Devnet won't start` | Ensure Docker is running (required for `clarinet devnet start`) |
