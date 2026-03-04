# iPredict — Milestone Plan

## 10 Weeks. 3 Achievements. Testnet to Mainnet.

### Where we are right now

The MVP is done. Four Clarity contracts deployed on testnet, 400+ tests green, full Next.js frontend live on Vercel, four seed markets accepting bets. This plan covers what comes next: hardening the contracts, launching on mainnet, and building a community around it.

---

## Achievement 1: Lock It Down

**Timeline:** Weeks 1–3
**Goal:** Make the contracts bulletproof and prepare everything for a clean mainnet deployment.

### 1A — Expand the Test Suite (Week 1)

The test suite is already solid, but mainnet-ready means going further:

- Property-based tests for the pari-mutuel math
  - Total payouts never exceed total pool (this is the big one)
  - Fee calculations stay consistent across all bet sizes
  - Cancel refunds return exactly what was deposited
- Stress tests for the edge cases that matter
  - Markets with 200 bettors (maximum capacity)
  - Minimum bet amounts and rounding behavior
  - Concurrent bets landing on the same block
  - Single-bettor markets (what happens when only one person bets?)
- Hit 95%+ branch coverage on all 4 contracts
- Publish the coverage report

**How we know it's done:** 250+ contract tests passing, coverage report published.

### 1B — Security Review (Week 2)

Not hiring an audit firm — that's not realistic at this stage. But there are things we can and should do:

- Walk every contract through the Stacks Security Checklist
  - Authorization: every tx-sender and contract-caller check is correct
  - Integer safety: no overflow scenarios (Clarity already prevents underflow)
  - STX conservation: contract balance always covers all outstanding bets
  - Fee math: accumulation stays consistent across bet/claim/cancel
- Post contracts to the Stacks developer Discord for community peer review
- Address all findings and document what was changed and why
- Add an emergency-pause capability so the admin can freeze betting if something goes wrong
- Document the safety guarantees Clarity gives us for free (no reentrancy, no unchecked calls)

**How we know it's done:** Security review document published, all findings addressed.

### 1C — Mainnet Preparation (Week 3)

- Write formal contract spec (function signatures, preconditions, postconditions)
- Build the mainnet deployment checklist — every step, every verification  
- Do a full dry-run deployment on testnet using mainnet configuration
- Prepare post-deployment smoke tests (every public function gets called)
- Update all contract references for mainnet SIP-010 trait
- Document the emergency playbook (pause, cancel all, fee withdrawal)

**How we know it's done:** Deployment checklist complete, dry-run verified.

### Achievement 1 — Proof of Delivery

| What | Evidence |
|------|----------|
| Extended tests | Test run output showing 250+ tests + coverage report |
| Security review | Published review document with findings and mitigations |
| Mainnet prep | Deployment checklist + dry-run screenshots |

**Funding checkpoint:** 50% of grant released after Achievement 1 is verified.

---

## Achievement 2: Go Live

**Timeline:** Weeks 4–7
**Goal:** Deploy to mainnet and ship the features that turn testnet users into real users.

### 2A — Mainnet Deployment (Week 4)

This is launch day.

- Deploy all 4 contracts to Stacks mainnet
- Run the initialization sequence (wire up inter-contract dependencies, authorize minters)
- Verify every function via direct contract calls on the explorer
- Create the first batch of mainnet markets — 5 to 10 interesting prediction questions
- Set up monitoring: bet events, TVL, fee accumulation

**How we know it's done:** Contracts live on mainnet, initial markets created and accepting bets.

### 2B — User-Created Markets (Weeks 5–6)

Right now, only the admin can create markets. That needs to change:

- Build a market proposal system — users submit questions through the frontend
- Admin review queue — proposals get approved or rejected before going live
- Market categories: Crypto, Sports, Politics, Tech, Pop Culture
- Market search and filtering
- Sorting: trending, newest, ending soon, most volume

**How we know it's done:** Users can propose markets, admin can approve them, categories and search are working.

### 2C — Analytics + Polish (Weeks 6–7)

Numbers tell the story:

- Platform-wide analytics dashboard: total volume, active markets, unique bettors, fee revenue
- Per-user analytics on the profile page: win rate over time, favorite categories, earnings history
- Performance tuning: bundle splitting, faster load times (target: under 2 seconds)
- Mobile UX audit and fixes
- Better error messages when transactions fail (clear text, retry options)
- Testnet/mainnet network switching

**How we know it's done:** Analytics dashboard live, mobile-responsive, page load under 2 seconds.

### 2D — Referral Growth Push (Week 7)

The referral system is built into the contracts already. Now we make it easy to use:

- Referral landing pages with unique links
- Referral leaderboard (top referrers by earnings and count)
- Guided onboarding flow for referred users (walk them through their first bet)
- Referral tracking analytics

**How we know it's done:** Referral pages live, onboarding flow complete, tracking working.

### Achievement 2 — Proof of Delivery

| What | Evidence |
|------|----------|
| Mainnet contracts | Contract addresses on Stacks Explorer |
| User-created markets | Video demo: proposal → approval → live market |
| Analytics | Screenshot of dashboard with real data |
| Referral campaign | Landing page + tracking dashboard |

**Funding checkpoint:** Remaining 50% of grant released after Achievement 2 and 3 are verified.

---

## Achievement 3: Open the Doors

**Timeline:** Weeks 8–10
**Goal:** Turn iPredict into a proper open-source project and grow the community around it.

### 3A — Developer Documentation (Week 8)

If other devs can't fork it, extend it, or learn from it, it's not truly open source:

- Full developer docs: how to fork and deploy your own prediction market
- API reference for all 4 contracts (every public and read-only function)
- Integration guide for building on top of iPredict (reading market data, placing bets programmatically)
- Contributing guide with coding standards and PR process
- GitHub issue templates for bugs and feature requests
- Label and organize issues: "good first issue" and "help wanted" tags

**How we know it's done:** Developer docs published, 10+ labeled GitHub issues ready for contributors.

### 3B — Community Launch (Week 9)

Building something is one thing. Getting people to care is another:

- Launch a Discord or Telegram community for iPredict users
- Publish a technical blog post about how pari-mutuel math works in Clarity
- Create a user guide with walkthroughs for every feature
- Host or join a Stacks Twitter Space about prediction markets
- Submit iPredict to the Stacks ecosystem directory and app listings

**How we know it's done:** Community channel launched, blog post published, ecosystem listing submitted.

### 3C — What Comes Next (Week 10)

Plan for life after the grant:

- Publish the post-grant roadmap (oracle integration, sBTC, IPREDICT utility, mobile app)
- Pitch to Stacks DAOs about using iPredict as a community engagement tool
- Document the revenue model and path to self-sustainability
- Write a case study: "Building a Prediction Market on Stacks — What Worked and What Didn't"
- Evaluate whether to apply for Builder or Ecosystem track funding based on traction

**How we know it's done:** Roadmap published, at least 2 partnership conversations started.

### Achievement 3 — Proof of Delivery

| What | Evidence |
|------|----------|
| Developer docs | Published documentation (repo docs or external site) |
| Community | Channel link + blog post URL |
| Ecosystem listing | Listing URL on Stacks directory |
| Roadmap | Published roadmap document |

---

## What Could Go Wrong (And How We Handle It)

| Risk | Chance | Impact | Plan B |
|------|--------|--------|--------|
| Smart contract bug found | Low | High | Emergency-pause capability built in Achievement 1. Clarity prevents reentrancy by design. |
| Low user adoption at launch | Medium | Medium | Referral incentives, STX rewards for early testers, community push in Achievement 3 |
| Network congestion slows things down | Low | Medium | Transaction queuing with retry logic, clear "pending" states in the UI |
| Market resolution disputes | Medium | Low | Clear criteria in market descriptions, admin dispute process, oracle integration planned for post-grant |
| Open source contributors don't show up | Medium | Low | Good docs + labeled issues + active maintainer. If nobody shows up, we keep building. |

---

## After the Grant — Where iPredict Goes Next

The 10-week plan gets us to mainnet with real users. After that, the roadmap expands:

1. **Oracle-based resolution** — automated outcomes from real data feeds, removing admin dependency
2. **sBTC betting** — accept sBTC alongside STX to tap into broader Bitcoin liquidity
3. **IPREDICT token utility** — staking for reduced fees, governance votes on market approval
4. **Mobile app** — native iOS and Android experience
5. **Multi-outcome markets** — beyond YES/NO, proper multi-choice pari-mutuel distribution
