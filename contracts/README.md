# iPredict Smart Contracts

Decentralized prediction market on Injective EVM.

## Overview

iPredict allows users to bet YES or NO on prediction markets. Winners split the loser pool minus a 2% platform fee. Points are awarded for correct predictions, powering a leaderboard.

## Features

- Create prediction markets with custom questions and durations
- Place YES/NO bets with INJ tokens
- Automatic payout calculations with proportional distribution
- Points system for leaderboard rankings
- Admin controls: pause, fee adjustment, market resolution/cancellation
- Two-step admin transfer for security

## Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- Testnet INJ from [faucet](https://testnet.faucet.injective.network)

## Installation

```bash
git clone <repo>
cd iPredict-contracts
forge install
```

## Configuration

Copy `.env.example` to `.env` and set your private key:

```bash
cp .env.example .env
# Edit .env with your PRIVATE_KEY
```

## Build & Test

```bash
# Build contracts
forge build

# Run all tests
forge test -vvv

# Run specific test
forge test --match-test test_PlaceBet -vvv

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

## Deploy

### Testnet (Injective EVM)

```bash
source .env
forge script script/Deploy.s.sol:DeployiPredict \
    --rpc-url https://testnet.rpc.inevm.com/http \
    --broadcast \
    --legacy \
    -vvvv
```

### Mainnet

```bash
source .env
forge script script/Deploy.s.sol:DeployiPredict \
    --rpc-url https://mainnet.rpc.inevm.com/http \
    --broadcast \
    --legacy \
    -vvvv
```

## Contract Addresses

| Network | Address |
|---------|---------|
| Testnet | TBD |
| Mainnet | TBD |

## ABI

After building, export ABI for frontend:

```bash
forge inspect iPredict abi > abi/iPredict.json
```

## Architecture

- `src/iPredict.sol` - Main contract
- `src/interfaces/IiPredict.sol` - Interface with structs, events, errors
- `test/iPredict.t.sol` - Comprehensive test suite (75+ tests)
- `script/Deploy.s.sol` - Deployment script

## Security Considerations

- Two-step admin transfer prevents accidental lockout
- Custom errors for gas efficiency
- Checks-Effects-Interactions pattern throughout
- Pausable for emergency stops
- Maximum fee cap (10%) protects users
- Minimum bet prevents dust attacks

## License

MIT
