# iPredict — Ecosystem Impact

## What iPredict Brings to Stacks

### A quick reality check

Ethereum has Polymarket, Augur, and Gnosis. Solana has Hedgehog and Drift. Base has Thales. Stacks has zero prediction markets.

That's not a small thing. Prediction markets are one of the highest-engagement categories in all of DeFi. Polymarket alone moved over $1 billion in volume during the 2024 US election cycle. These platforms generate daily active users, real token volume, and the kind of community buzz that keeps people talking about a chain.

iPredict brings this entire product category to Stacks for the first time.

---

## Real STX Volume, Not Vanity Metrics

Every single interaction on iPredict creates on-chain economic activity:

- **Placing a bet** — STX moves from user wallet to contract
- **Claiming a reward** — STX moves from contract back to winner
- **Referral payouts** — STX moves from contract to the referrer's wallet
- **Fee withdrawal** — accumulated fees move to the admin

This isn't a dashboard people look at and close. It's an app that moves STX every time someone uses it. That's the kind of activity that matters for ecosystem health.

---

## Why Bitcoin-Anchored Settlement Matters Here

Prediction markets are about one thing: trust. Can you trust that the rules won't change after you bet? Can you trust that the payout math is right? Can you trust that nobody can drain the pool?

Building on Stacks gives iPredict answers to all of those:

- Every transaction is anchored to Bitcoin through Proof of Transfer
- Clarity's deterministic execution means the settlement logic can't be tampered with
- No reentrancy attacks — the most common exploit in DeFi is literally impossible in Clarity
- Block-height-based deadlines give markets Bitcoin-grade finality

That's not marketing. That's a real technical advantage for a product where people are putting money on the line.

---

## Composable Pieces Other Projects Can Use

iPredict doesn't just exist as a standalone app. It creates on-chain primitives that other Stacks projects can plug into.

### Market Data — Open and Readable

Any contract or frontend on Stacks can query iPredict market data:

- Current odds for any prediction question (YES pool vs NO pool)
- Total volume per market
- Number of unique participants
- Resolution outcomes

No API key needed. No permission required. It's all on-chain and public.

### Referral Network — Reusable

The referral registry is its own contract. Other projects could:

- Check whether a user was referred (reuse the referral graph)
- Read display names for user-facing features
- Build their own referral program using the same infrastructure

### On-Chain Reputation — Portable

The leaderboard tracks points, win rates, total bets, and rankings. All readable by any contract or frontend. This could be used for:

- Access gating (e.g., "must have 100+ points to access early features")
- Reputation scoring for other apps
- DAO governance weighting — active predictors get more voting power

### IPREDICT Token — SIP-010 Compatible

IPREDICT is a standard SIP-010 token. Once it has real distribution through market activity:

- Tradeable on Stacks DEXes
- Stakeable for governance or fee discounts
- Usable as a reputation signal anywhere in the ecosystem

---

## How We Stack Up

| Feature | iPredict (Stacks) | Polymarket (Polygon) | Hedgehog (Solana) |
|---------|-------------------|---------------------|-------------------|
| Chain | Stacks (Bitcoin L2) | Polygon | Solana |
| Settlement model | Pari-mutuel | Order book | AMM |
| Losers earn rewards | Yes | No | No |
| Referral system | On-chain, 0.5% of bets | Off-chain | None |
| Leaderboard | On-chain, real-time | Centralized | Limited |
| Platform token | IPREDICT (SIP-010) | None | None |
| Open source | Yes (MIT) | No | Partial |
| Bitcoin-secured | Yes (PoX) | No | No |

We're not trying to out-volume Polymarket. We're bringing a proven product category to an ecosystem that doesn't have it, with features that don't exist anywhere else — loser rewards, on-chain referrals, and a fully gamified leaderboard.

---

## Growth Game Plan

### Numbers We're Tracking

| Metric | 10-Week Target | How we measure it |
|--------|---------------|-------------------|
| Total markets created | 25+ | On-chain market-count |
| Unique bettors | 100+ | Unique addresses in bet events |
| Total STX volume | 5,000+ STX | Sum of all bet amounts |
| Registered users (with username) | 200+ | referral-registry registrations |
| Referral chains | 30+ | Users who signed up through a referrer |
| Leaderboard participants | 50+ | Unique addresses with points > 0 |
| GitHub stars | 25+ | Repo metrics |
| Community members | 50+ | Discord/Telegram count |

### How People Find iPredict

1. **Referral links** — existing users share links, earn real STX from referred bets
2. **X/Twitter** — regular posts about market outcomes, leaderboard standings, new markets
3. **Stacks community** — Discord, Telegram, developer forums, Twitter Spaces
4. **Ecosystem directory** — listed on the Stacks app listings
5. **GitHub** — developers discover it through the open-source codebase

---

## Open Source Contribution

Everything is MIT-licensed. The Stacks developer community gets:

- **Pari-mutuel math patterns** — fee calculation, proportional payouts, pool management in Clarity
- **Multi-contract auth patterns** — contract-caller based access control across 4 interconnected contracts
- **Gamification patterns** — points, rankings, sorted leaderboard maintenance in Clarity
- **SIP-010 integration patterns** — multi-minter model, conditional minting based on game outcomes
- **Full-stack reference app** — Next.js 14 + @stacks/connect v8 + Vitest testing suite

These aren't toy examples. This is production code that real users interact with. Other builders can fork it, learn from it, and build on top of it.

---

## The Bigger Picture

Even at modest adoption, iPredict creates compounding value for the Stacks ecosystem:

1. **Daily active users.** Prediction markets are time-sensitive. People come back to check countdowns, odds shifts, and new markets. That's organic daily engagement.
2. **STX demand.** Every bet requires STX. More users = more demand. Simple.
3. **Developer signal.** A working, open-source prediction market proves Stacks can handle real DeFi applications. That attracts more builders.
4. **Organic content.** Every resolved market generates community discussion. "Who predicted BTC at 150K?" is content that writes itself.
5. **Network effects.** As more Stacks projects launch, the value of shared market data, reputation scores, and referral networks goes up — for everyone.
