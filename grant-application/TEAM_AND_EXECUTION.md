# iPredict — Team & Execution

## Who's Behind This

iPredict is built by **Akan** — full-stack developer, smart contract engineer, and the person who wrote every line of code in this project. Solo builder. No team. No outsourced work. No AI-generated contracts pasted in without understanding.

This isn't a "team of 5 with impressive LinkedIn profiles" play. It's one person who built the entire thing from scratch, deployed it, tested it, and is now asking for support to take it to mainnet.

---

## The Proof Is the Product

The best way to evaluate execution capability is to look at what already exists:

### Smart Contracts — 1,108 Lines of Production Clarity

- **prediction-market.clar** (467 lines) — Full market lifecycle: creation, betting, pari-mutuel settlement, fee distribution, cancel-with-bulk-refund, claim logic
- **ipredict-token.clar** (146 lines) — SIP-010 fungible token with a multi-minter authorization model
- **referral-registry.clar** (169 lines) — User registration, referral chain tracking, automatic fee crediting, display names
- **leaderboard.clar** (326 lines) — Points, stats (wins/losses/bets), sorted top-player ranking with O(n) maintenance

All 4 deployed and initialized on Stacks testnet. Inter-contract authorization fully wired and working.

### Testing — 400+ Tests, All Green

- 194 contract unit tests across 5 suites (including cross-contract integration)
- 18 fuzz invariants with Rendezvous for property-based testing
- 133 frontend tests with Vitest + React Testing Library
- CI/CD on GitHub Actions — everything runs on every push

### Frontend — Shipped and Live

- Next.js 14 with 7 routes, 30+ React components
- Full wallet integration (@stacks/connect v8 — Leather and Xverse)
- Every contract function is wired to the UI: bet, claim, resolve, cancel, referral, admin
- Social sharing after every bet (X, Telegram, WhatsApp)
- Real-time countdowns with dynamic block-time estimation
- Mobile-responsive glassmorphic design
- Live on Vercel with 4 seed markets

### Infrastructure — Ready for Real Use

- 4 seed markets active on testnet
- Reproducible market creation via seed script
- Deployment plans for both testnet and mainnet
- Sensitive keys excluded from git (proper .gitignore)

---

## Hard Problems That Got Solved

This wasn't a tutorial project. Building iPredict meant solving real engineering challenges in Clarity:

### Pari-Mutuel Math Without Floating Point

Clarity has no floats. The payout formula — `user_bet × total_pool ÷ winning_pool` — needs to handle rounding correctly without losing anyone's money. The contract guarantees total payouts never exceed the total pool, even with integer-only arithmetic.

### Four Contracts That Trust Each Other (But Nobody Else)

The prediction market mints tokens, records leaderboard points, and credits referral fees — but it needs to do that through the other three contracts without those contracts being callable by random users. The solution: contract-caller checks against stored principal addresses, set during a one-time initialization. It's simple, but getting it right across 4 contracts takes care.

### Dynamic Block Time on Nakamoto

Stacks Nakamoto changed everything about block timing — from ~10 minutes per block to seconds. The frontend dynamically computes block time from the chain's `tenure_height` and `stacks_tip_height`, so countdown timers stay accurate without hardcoded values. This was a real debugging session.

### Refunding 200 People in One Transaction

The cancel-market function refunds up to 200 bettors in a single tx using Clarity's `fold` with an `as-contract` wrapper for STX transfers. Getting the state management right — so you never end up with partial refunds — was tricky.

### Post-Conditions That Don't Break Everything

Stacks post-conditions protect users, but they can also block legitimate contract-internal transfers (referral fee routing, token minting). Figuring out the right `PostConditionMode.Allow` configuration without losing user-side safety took iteration.

---

## How I Build Things

I have a process that works, and I stick to it:

1. **Contract first.** Every feature starts in Clarity. If it can't be expressed safely on-chain, it doesn't ship.
2. **Tests alongside code.** No function exists without tests. Literally none.
3. **Fuzz after unit tests.** Once the happy path works, property-based tests verify invariants hold across random inputs.
4. **Frontend last.** The UI is built against working, tested contracts. No mock data in production.
5. **Ship, test with real wallets, fix, repeat.** Deploy to testnet, connect Leather, click through everything, find bugs, fix them.

### Toolbox

| Tool | What it does for this project |
|------|------|
| Clarinet v3 | Contract development, testing, deployment |
| Clarinet SDK | Programmatic contract calls in test suites |
| Vitest | Test runner for contracts and frontend |
| Rendezvous | Property-based fuzz testing for Clarity |
| Next.js 14 | Frontend framework (App Router) |
| @stacks/connect v8 | Wallet integration |
| @stacks/transactions v7 | Contract call construction, ClarityValue parsing |
| Tailwind CSS | UI styling |
| React Testing Library | Component testing |
| GitHub Actions | CI/CD pipeline |
| Vercel | Frontend hosting |

---

## This Isn't a Grant-and-Disappear Project

Some real talk about long-term commitment:

- The codebase is going MIT-licensed. It stays open and actively maintained.
- The post-grant roadmap is real: oracle integration, sBTC support, IPREDICT token utility, mobile app.
- The 2% fee model generates revenue at modest volume. At even 1,000 STX/day in bets, the platform covers its own costs.
- Open source contributions from the community will grow the project beyond what one person can do.
- If traction warrants it, a follow-up application to the Builder or Ecosystem track is on the table.

### Why Stacks (Honestly)

I'm building on Stacks because prediction markets need the one thing Bitcoin provides better than any other chain: trust. Stacks inherits that trust through Proof of Transfer. Every bet on iPredict is ultimately anchored to Bitcoin.

That's not fluff. For a product where people put real money on the line, settlement security matters more than TPS or gas costs. Stacks gives iPredict something Solana and Polygon can't.

---

## Connect

- **GitHub:** https://github.com/Akanimoh12/iPredict.git
- **X (Twitter):** [@iPredict_HQ](https://twitter.com/iPredict_HQ)
- **App:** https://ipredict-stacks.vercel.app
