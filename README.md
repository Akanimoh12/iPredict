# iPredict

**Decentralized prediction markets on Injective EVM.**

> 🔮 Bet on outcomes. Earn rewards. Shape the future.

🌐 **Live:** [i-predict.vercel.app](https://i-predict.vercel.app/)

📄 **Contract:** [`0xfd2f67cD354545712f9d8230170015d7e30d133A`](https://testnet.blockscout.injective.network/address/0xfd2f67cD354545712f9d8230170015d7e30d133A)

---

## What is iPredict?

iPredict lets anyone create and participate in prediction markets—from crypto price movements to real-world events. Users stake INJ on YES/NO outcomes, and winners split the pool proportionally.

Built on **Injective EVM** for near-instant finality and minimal gas fees, iPredict demonstrates how prediction markets can drive community governance and collective intelligence at scale.

## Why Injective EVM?

- ⚡ **Fast & Cheap** — Sub-second blocks, negligible transaction costs
- 🔗 **EVM Compatible** — Deploy existing Solidity contracts seamlessly
- 🌍 **Mass Adoption Ready** — Familiar tooling (Foundry, wagmi, viem) lowers the barrier for builders
- 🏦 **DeFi Native** — Built for a chain designed around financial applications.

## The Problem

Traditional prediction markets are either centralized (custody risk, censorship, geographic restrictions) or built on congested L1s with high fees that price out everyday users. Meanwhile, valuable collective intelligence—what crowds *actually* believe will happen—remains locked behind paywalls or scattered across unreliable polls.

**On Injective specifically:** The ecosystem is growing fast, but lacks native DeFi primitives that engage users beyond trading. Prediction markets offer a missing piece—a way to gamify community sentiment, forecast governance outcomes, and bootstrap engagement around ecosystem events.

## Our Solution

iPredict brings permissionless prediction markets to Injective EVM:

- **Anyone can create markets** — No gatekeepers. Propose a question, set a deadline, let the crowd decide.
- **Skin in the game** — Stake INJ on YES/NO outcomes. Winners share the losing pool proportionally.
- **Transparent & trustless** — All logic on-chain. No custody, no counterparty risk.
- **Governance-ready** — Communities can use prediction markets to gauge sentiment before proposals, forecast adoption metrics, or crowdsource alpha.


## Tech Stack

| Layer | Stack |
|-------|-------|
| Contract | Solidity, Foundry |
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Web3 | wagmi v2, viem, RainbowKit |
| Network | Injective EVM Testnet |

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Contracts
cd contracts && forge build && forge test
```

## Building Notes

- Use `forge script` for deployments—see `/contracts/script/`
- ABI auto-exports to `/contracts/abi/` for frontend consumption
- Environment: `PRIVATE_KEY`, `RPC_URL` in `.env`

---

**Built for the Injective EVM ecosystem** 🚀
