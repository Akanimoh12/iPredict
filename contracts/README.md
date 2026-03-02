# iPredict — Clarity Smart Contracts

Four Clarity v3 smart contracts powering the iPredict decentralized prediction market on Stacks.

## Contracts

| Contract | Purpose | Methods |
|---|---|---|
| `ipredict-token` | SIP-010 fungible token (iPREDICT) for staking & rewards | mint, transfer, burn, balance queries |
| `prediction-market` | Core market engine — create, bet, resolve, claim, refund | create-market, place-bet, resolve-market, claim-winnings |
| `referral-registry` | On-chain referral tracking with tiered commission rates | register-referral, get-referral-info, update-commission |
| `leaderboard` | Player rankings by wins, volume, and streak | record-win, get-leaderboard, get-player-stats |

## Prerequisites

- [Clarinet](https://docs.hiro.so/clarinet/getting-started) v3.11+
- Node.js 18+ / npm

## Quick Start

```bash
# Install test dependencies
npm install

# Check all contracts compile
clarinet check

# Run the full unit + integration test suite (194 tests)
npx vitest run

# Run tests with coverage & cost reports
npm run test:report

# Watch mode (re-runs on file changes)
npm run test:watch
```

## Fuzz Testing

18 property-based invariants powered by [Rendezvous](https://github.com/stacks-network/rendezvous):

```bash
# Full run (100 iterations per contract)
npm run test:fuzz

# Quick run (25 iterations per contract)
npm run test:fuzz:quick
```

## Run Everything

```bash
npm run test:all   # unit tests + coverage + fuzz
```

## Testnet Deployment

A deployment plan is pre-generated at `deployments/default.testnet-plan.yaml`.

1. Fund the deployer address shown in `settings/Testnet.toml` with testnet STX from the [Stacks Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet).
2. Deploy:
   ```bash
   clarinet deployments apply --testnet
   ```
3. Confirm each transaction in the Clarinet dashboard.

## Directory Structure

```
contracts/
├── contracts/               # Clarity source files
│   ├── ipredict-token.clar
│   ├── leaderboard.clar
│   ├── prediction-market.clar
│   └── referral-registry.clar
├── tests/                   # Vitest unit & integration tests
├── fuzz/                    # Rendezvous fuzz invariants
├── settings/                # Devnet / Testnet / Mainnet configs
├── deployments/             # Generated deployment plans
├── Clarinet.toml            # Project manifest
├── vitest.config.ts         # Test runner config
└── package.json             # npm scripts & dependencies
```

## Test Configuration

Tests use the Clarinet SDK Vitest environment with forked pool execution:

- **Environment**: `clarinet` (simnet)
- **Pool**: `forks` (process isolation)
- **Epoch**: `3.0` (Clarity v3)
