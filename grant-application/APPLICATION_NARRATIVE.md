# iPredict — Grant Application

## Stacks Endowment: Getting Started Program

**Project:** iPredict — Decentralized Prediction Market on Stacks

**In a nutshell:** iPredict lets you bet STX on real-world outcomes. Win, and you split the pot. Lose, and you still walk away with points and tokens. Every bet, every payout, every referral — all on-chain, all powered by Clarity.

---

## What's Missing on Stacks

Prediction markets are everywhere in crypto — except Stacks. Polymarket pulled in over a billion dollars during the 2024 US election. Solana has Hedgehog. Even Base has Thales. Stacks? Zero.

That's a problem, because prediction markets are one of the stickiest product categories in this space. People come back every day to check positions, place new bets, flex on the leaderboard. They generate real on-chain volume — not pageviews, not "connected wallets," but actual STX moving between addresses on every single interaction.

And here's the thing: prediction markets are a *perfect* fit for a Bitcoin-anchored chain. The whole value proposition is "nobody can mess with the results." Clarity enforces the rules. Bitcoin anchors the settlement. That combination is exactly what you want when real money is on the line.

Right now, if a Stacks user wants to bet on whether BTC hits $150K, they have to leave the ecosystem. There's no good reason for that.

---

## How iPredict Works

It's a pari-mutuel system — simple, fair, and transparent.

1. **A market goes live** with a question, an image, and a deadline (measured in block height).
2. **Users bet STX** on YES or NO. A 2% fee gets deducted upfront — 1.5% for the platform, 0.5% for whoever referred them.
3. **When time's up**, the admin resolves the market with the actual outcome.
4. **Winners split the entire pool** proportionally based on how much they bet. Payout = `(your_bet / winning_side) × total_pool`.
5. **Losers aren't forgotten.** They still earn 10 leaderboard points and 2 IPREDICT tokens for playing. Because engagement shouldn't only reward people who guessed right.

### What makes it different from other prediction markets

- **Losers earn too.** Most platforms? You lose, you get nothing, you leave. On iPredict, every participant walks away with something. That keeps people coming back.
- **On-chain referrals.** If someone bets because of your link, you pocket 0.5% of their bet in STX. Not promises. Real STX, automatically routed by the contract.
- **Gamified leaderboard.** Points, win rates, bet counts, rankings — all computed from on-chain data. No centralized database. No tampering.
- **SIP-010 reward token.** IPREDICT tokens get minted as rewards. Winners get 10, losers get 2. Future utility includes staking and governance.

---

## What's Already Built

This isn't a pitch deck. The MVP is live, tested, and deployed. Here's the receipts:

### Smart Contracts — Deployed on Stacks Testnet

| Contract | Lines | What it does |
|----------|-------|-------------|
| prediction-market.clar | 467 | Market lifecycle: create, bet, resolve, cancel, claim winnings, fee management |
| ipredict-token.clar | 146 | SIP-010 token with multi-minter authorization and burn support |
| referral-registry.clar | 169 | User registration, referral tracking, automatic fee crediting, display names |
| leaderboard.clar | 326 | Points system, stats tracking, sorted rankings, top-player management |

**1,108 lines of production Clarity code.** Not scaffolding. Not boilerplate. Real logic — pari-mutuel math, multi-contract auth, gamified reward distribution.

Testnet deployer: `ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV`

### Test Suite — 400+ Tests Passing

- **194** contract unit tests across 5 suites (including cross-contract integration)
- **18** fuzz invariants via Rendezvous (property-based testing)
- **133** frontend tests with Vitest + React Testing Library
- CI/CD pipeline running on GitHub Actions — every push gets linted, tested, and built

### Frontend — Live on Vercel

- Next.js 14 with App Router, 7 routes, 30+ React components
- Wallet integration via @stacks/connect v8 (Leather + Xverse)
- Every contract function wired to the UI — bet, claim, resolve, cancel, referral, admin
- Social sharing to X, Telegram, WhatsApp after every bet
- Real-time countdown timers with dynamic block-time estimation (handles Nakamoto's fast blocks)
- Mobile-first responsive design with glassmorphic purple theme
- **4 seed markets** live on testnet with real betting enabled

### Zero External Funding

All of this was built before applying for anything. No grants. No investors. No incubator. Just building.

---

## The Roadmap — 10 Weeks, 3 Achievements

Full details in MILESTONE_PLAN.md. Here's the summary:

| Achievement | Weeks | Focus |
|------------|-------|-------|
| Achievement 1: Lock It Down | 1–3 | Security hardening, expanded tests, mainnet prep |
| Achievement 2: Go Live | 4–7 | Mainnet deployment, user-created markets, analytics, referral campaign |
| Achievement 3: Open the Doors | 8–10 | Developer docs, open source, community building, ecosystem integration |

---

## The Ask — $8,000 in STX

Full breakdown in BUDGET_PROPOSAL.md. Here's the split:

| Category | Amount | Share |
|----------|--------|-------|
| Security and testing | $1,800 | 22% |
| Infrastructure and hosting | $1,400 | 18% |
| Feature development | $1,600 | 20% |
| Documentation and content | $1,700 | 21% |
| Community and outreach | $1,100 | 14% |
| Contingency | $400 | 5% |
| **Total** | **$8,000** | **100%** |

The engineering is done. This money goes toward making it production-safe and getting it into people's hands.

---

## Why This Matters for Stacks

iPredict isn't just another dApp. It fills a real gap:

- **STX utility.** Every bet = STX moving on-chain. Every claim. Every referral payout. That's real usage, not vanity metrics.
- **Composable building block.** Market data, referral networks, on-chain reputation — other projects can plug into all of it.
- **Community magnet.** Leaderboards and referrals create social loops. People compete, share, and bring friends. That's organic growth.
- **Open source patterns.** MIT-licensed code gives Stacks developers real Clarity patterns to learn from — pari-mutuel math, multi-contract auth, gamification. Not tutorials. Production code.

More in ECOSYSTEM_IMPACT.md.

---

## Where This Is Headed

The 10-week plan gets iPredict to mainnet with real users. After that:

1. **Oracle-based resolution** — automated outcomes from price feeds and data sources, no more admin dependency
2. **sBTC betting** — accept sBTC alongside STX for broader Bitcoin-native appeal
3. **IPREDICT token utility** — staking for fee discounts, governance on market approval, tier-based rewards
4. **Mobile app** — native iOS and Android experience
5. **Multi-outcome markets** — not just YES/NO, but multiple choices with proper pari-mutuel distribution
6. **User-created markets** — let anyone propose a question, with community moderation

---

## Find Us

- **Live App:** https://ipredict-stacks.vercel.app
- **GitHub:** https://github.com/Akanimoh12/iPredict.git
- **X (Twitter):** [@iPredict_HQ](https://twitter.com/iPredict_HQ)
- **Feedback Form:** [Google Form Link]
- **Architecture:** See TECHNICAL_ARCHITECTURE.md
- **User Feedback:** See docs/USER-FEEDBACK.md
