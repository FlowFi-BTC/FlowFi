# FlowFi-BTC — Grant Application Form Q&A (Q3 2026, Getting Started · $10,000)

Copy-paste answers for each form field, grounded in the files in this folder.
Action items before submitting are marked with ⚠️ — see the top of each affected answer.

---

## 01 — Applicant identity

**Q: Applicant**
A: Individual · Oyewale Prudence

**Q: Contact**
A: Oyewale · Founder

**Q: Jurisdiction**
A: NG

---

## 02 — Project

**Q: Name**
A: FlowFi-BTC

**Q: Category**
A: Other

**Q: Website or repo**
A: https://github.com/FlowFi-BTC/FlowFi-BTC (live frontend: https://flowfi-btc.vercel.app/)

---

## 03 — Audience and ecosystem fit

**Q: Primary audience — Describe the user, customer, or ecosystem audience that benefits from this work.**
A: Two distinct participants connected by one financing rail: (1) small businesses holding unpaid 30–90-day invoices who need working capital before the invoice is due, and (2) sBTC holders looking for a way to deploy Bitcoin-denominated capital into real-world, short-duration, asset-backed financing rather than only DeFi lending, liquidity provision, or trading.

**Q: Audience segmentation — Break down the audience into the specific segments, user types, or ecosystem actors this project serves.**
A: Capital seekers: small and growing businesses (initially trade, logistics, and service invoices) with a real receivable and a specific, verifiable due date. For this grant, exactly one real business.

Capital providers: individual sBTC holders willing to fund a verified receivable directly through their own wallet, retaining full custody of their funds until the moment they choose to fund. For this grant, exactly one real provider.

Future segment (explicitly out of scope for this grant): protocols or applications that could compose with FlowFi BTC's contracts as a financing primitive, and additional businesses/providers once the single-pilot mechanism is proven.

**Q: Why Stacks? — Explain the Stacks-specific reason this should exist, including any sBTC, Clarity, Bitcoin, wallet, or ecosystem dependency.**
A: FlowFi BTC depends on sBTC specifically, not a stablecoin substitute: it lets a Bitcoin holder finance a real-world receivable without ever leaving the Bitcoin asset or off-ramping to fiat rails. Settlement and repayment states are anchored to Bitcoin finality through Stacks, giving both parties a Bitcoin-verifiable record of an off-chain economic event (an invoice being paid). Clarity's decidable execution and lack of reentrancy risk also make the fund-movement logic safer to reason about at small scale without a full external audit.

**Q: Maintenance plan — Describe who will maintain the work after the grant, how issues are handled, and what support users can expect.**
A: ⚠️ Replace the `[LICENSE, e.g. MIT]` placeholder with the text below, and add an MIT `LICENSE` file to the contracts repo in M1.
> The core Clarity contracts and test suite are open-sourced under MIT and maintained by me. Post-grant, maintenance responsibilities are: responding to issues on the public repository, monitoring the one pilot receivable through to resolution, and publishing an honest outcome report regardless of result. Any expansion beyond the single pilot (additional businesses, additional providers, or protocol-level composability) is treated as future work requiring its own resourcing and, if multi-provider funding is considered, proper legal review before build.

**Q: Ecosystem fit — Describe how this work fits the current Stacks ecosystem and quarterly cycle theme.**
A: This cycle's focus names new utility for Bitcoin capital and stronger markets for Bitcoin-native finance. FlowFi BTC is a direct, narrow answer to the first: it is a concrete, real-money use case for sBTC outside DeFi lending, liquidity, and trading — real-world receivables financing. It intentionally stays out of the Distribution & Integrations track, since a single-pilot project has no existing user base or distribution channel to bring onto Stacks yet; that claim would be premature. The application is scoped to prove the mechanism, not to claim ecosystem scale it does not yet have.

---

## 04 — Risk and prior history

**Q: Referral source**
A: Stacks Endowment website

**Q: Risk disclosure — Disclose material delivery, legal, operational, technical, or market risks.**
A: Material risks, disclosed plainly (each maps to `RISK_DISCLOSURE.md`):

Verification risk: business and receivable verification for this pilot is a demo-stage flow (manual pilot review, with the verification result structured to accept a future third-party KYB provider without changing the contract). It reduces but does not eliminate the risk of a dishonest originator or a mistaken reviewer.

Technical risk: the smart contract is unaudited. Risk is bounded by design — small pilot ticket size, one counterparty pair, and a test suite covering authorization, funding, repayment, and default paths — but a formal audit has not been performed and should precede any scale beyond this pilot.

Counterparty risk: the pilot depends on securing one real, willing business and one real, willing sBTC provider within the grant timeline. Pre-mitigated: 2 SME leads and 1 provider lead already contacted (see `PILOT_READINESS.md`). If either falls through, the milestone plan's final deliverable is delayed until replacements are found.

Legal risk: this pilot is structured as one bilateral financing transaction between two known, named parties, with no public solicitation of capital and no pooled or advertised yield, specifically to avoid securities/crowdfunding-adjacent exposure. Any future move toward multi-provider or public funding would require legal structuring not undertaken in this grant.

Outcome risk: the receivable may default rather than repay. This is disclosed as a valid, reportable outcome of the pilot, not treated as a failure condition for the grant.

**Q: Prior grants**
A: None — this is my first grant.

**Q: Prior Stacks work**
A: Built and testnet-deployed two Clarity contracts (`flowfi-registry`, 385 lines; `flowfi-escrow`, 257 lines) at `ST1WNVWY7WCJESTHM050RAMRRE44KJTKZKJCSRFCQ`, with a 46-test Vitest/Clarinet suite covering registration, funding, repayment, and default states. Built a demo verification flow producing an on-chain-hashed verification record, connected through a real off-chain API layer (11 routers). Built a 21-page frontend allowing a business to manage a receivable and a capital provider to view verification information and fund with sBTC. No prior grant funding has been used for this work.

---

## 05 — Track and qualification

**Q: Track / Requested**
A: Getting Started · $10,000 (open track, no gates)

---

## 06 — Track-specific context (Getting Started)

**Q: What are you proposing to explore or build?**
A: Whether a real trade receivable can be financed end-to-end with real sBTC — registered, verified, funded, and resolved (repaid or defaulted) — using a minimal, transparent, non-custodial smart contract, with one real business and one real capital provider, before any attempt to scale the mechanism.

**Q: What user or ecosystem problem motivates the project?**
A: sBTC holders currently have very few ways to deploy Bitcoin capital into real-world economic activity; sBTC utility is concentrated in DeFi lending, liquidity, and trading, which mostly recirculates capital rather than financing real businesses. Meanwhile, small businesses routinely have capital locked in unpaid invoices for 30–90 days with no simple, transparent way to access it early. FlowFi BTC connects these two unmet needs through one narrow, real financing primitive.

**Q: Why is Stacks the right environment for this work?**
A: sBTC lets a Bitcoin holder fund a real-world receivable without leaving the Bitcoin asset, and Clarity's decidable, non-reentrant execution model makes the fund-movement logic safer to reason about at small scale. Stacks is the only environment where this specific primitive — Bitcoin-backed, non-custodial, transparently settled receivables financing — can exist natively.

**Q: What have you already validated, prototyped, or learned?**
A: Two Clarity contracts built, testnet-deployed, and wired (`set-escrow-contract` / `set-sbtc-contract`), with 46 tests passing across registry + escrow. A demo verification flow producing an on-chain-hashed record is built, connected to a real off-chain API. A 21-page frontend lets both roles (business and capital provider) interact with the contracts through their own wallets (Leather/Xverse). What remains is hardening the test suite to 70+ tests, finalizing the verification path for real use, shipping frontend QA fixes, deploying to mainnet, and executing one real transaction with named real counterparties.

**Q: Who will do the work and what experience do they bring?**
A: ⚠️ Fix the grammar in the current draft ("I brings… across Clarity ,") — use this:
> The work will be carried out by Oyewale Prudence (founder). I bring hands-on Stacks experience: I designed and shipped the FlowFi MVP — two Clarity contracts (`flowfi-registry`, 385 lines; `flowfi-escrow`, 257 lines) deployed to testnet, a 46-test Vitest/Clarinet suite, an Express + Prisma API layer (11 routers), and a 21-page React frontend with Leather/Xverse wallet integration. No team, no subcontractors — one builder who already built the thing this grant hardens.

**Q: What is the smallest useful outcome this grant should produce?**
A: One real receivable, from one real verified business, funded with real sBTC by one real provider, resolved on-chain (repaid or defaulted) and reported honestly — proving the mechanism works, without claiming more scale or adoption than that single cycle demonstrates.

**Q: What evidence will show the concept is worth continuing?**
A: A completed, transparent financing cycle on mainnet: a real receivable registered and verified, real sBTC moved and tracked entirely through the contract (no custody by the team), and a clear on-chain record of the final outcome. A successfully completed cycle — repaid or defaulted, either is informative — with willing repeat interest from either the business or the provider is the strongest signal to continue.

**Q: What dependencies or risks could affect delivery?**
A: Securing a real, willing business and a real, willing sBTC provider within the grant timeline is the primary dependency — pre-mitigated with 2 SME leads and 1 provider lead already contacted (see `PILOT_READINESS.md`). Verification tooling is a secondary dependency: if a third-party KYB provider's onboarding process takes longer than expected, verification proceeds through a documented manual review path instead, so the timeline does not depend on any single vendor's sales process.

**Q: What support from the Stacks ecosystem would help?**
A: Introductions to Stacks-based businesses or DAOs that might have a real receivable suitable for the pilot, and to sBTC holders interested in real-world financing use cases, would materially help secure the two real counterparties this grant depends on.

**Q: How will you share progress or learnings publicly?**
A: Open-source repository updates throughout the grant (contracts, tests, and documentation, including an honest risk-disclosure document). A published outcome report (`PILOT_RESULT.md`) after the pilot resolves, reporting the actual result rather than a curated success narrative.

**Q: What happens after the grant if the work succeeds?**
A: The natural next step is a second and third receivable with different real counterparties, generalizing the verification and contract layer gradually. Any move toward multi-provider funding or a public-facing marketplace would be pursued only with proper legal structuring, and would be the subject of a separate future funding conversation — not assumed or promised by this grant.

**Q: Any other context reviewers should consider?**
A: This application is deliberately narrow. Earlier drafts of this project explored a full two-sided marketplace, multi-contract protocol architecture, and consumer-facing investment product; all of that was cut back to a single verified, non-custodial, bilateral transaction specifically to keep legal exposure and execution risk low for a first grant. That larger vision is documented in the project's roadmap as future work, not part of this request.

---

## 07 — Compliance readiness

**Q: Individual applicant readiness**
A: I have reviewed the Vouched ID requirements and will be able to complete the required KYC through Vouched if selected. (No documents to upload at this stage.)

---

## 08 — Milestones (20 / 30 / 50 · $2,000 / $3,000 / $5,000)

### Milestone 1 — Contract Hardening, Testing & Verification Integration (20% · $2,000 · Nov 29, 2026)

**Description (paste):**
> Finalize and harden the Clarity contracts covering receivable registration, sBTC funding, repayment, and default. Expand the existing test suite (46 passing today) to 70+ tests covering authorization failures, double-funding prevention, due-date boundary conditions, and funding-math fuzz invariants. Finalize the verification flow — either completing integration with a third-party KYB provider, or formalizing the existing manual pilot-review process — so that either path produces a normalized, on-chain-hashed verification record. Plus a full frontend QA pass over all 21 pages with a published fix log and clean production build.

**Success criteria (paste — ⚠️ updates the stale "20-30 tests" line):**
> 70+ passing tests on Clarinet simnet covering happy path, default path, and authorization checks. Contracts deployed and functioning on testnet. One test business produces a real, reviewable verification record through the finalized verification path. Security self-review published. Frontend QA log published with a clean `tsc` + `vite build`.

### Milestone 2 — Mainnet Launch & Public Transparency Layer (30% · $3,000 · Jan 10, 2027)

**Description (paste — ⚠️ adds the transparency page the title promises):**
> Deploy the hardened contracts to Stacks mainnet. Ship the public receivable page (wallet-aware: business sees management actions, provider sees funding actions, others see read-only status), the public transparency page showing the full funding trail with explorer links on every step (no wallet required), and the business dashboard. Publish full documentation: README, risk disclosure, and roadmap, all open-source.

**Success criteria (paste — ⚠️ replaces the blanket "no custody" line, which contradicts `RISK_DISCLOSURE.md` §1):**
> Contracts live and independently verifiable on Stacks mainnet. Public receivable and transparency pages reachable and functional without a wallet. Complete documentation set published in the open-source repository. Risk disclosure states the precise custody position: sBTC sits briefly in `flowfi-escrow` between funding and admin-gated release; no team-controlled wallet ever custodies funds.

**Adoption metric:** Contract deployed and independently verifiable on mainnet — binary completion metric.

### Milestone 3 — Real Pilot Execution & Outcome Report (50% · $5,000 · Mar 7, 2027, Final)

**Description (paste):**
> Onboard one real, named business and one real, named sBTC capital provider. Register and verify one real receivable. Execute a real sBTC funding transaction. Carry the receivable through to resolution — repaid or defaulted — entirely on-chain. Publish an honest outcome report.

**Success criteria (paste):**
> One real receivable registered, verified, and funded with real sBTC on mainnet (not a test transaction). Full lifecycle — Registered → Funded → Repaid or Defaulted — completed and visible on-chain. Outcome report published, reporting the actual result.

**Adoption metric (paste):**
> Metric: one completed real financing cycle (registration through resolution) with real sBTC, involving one named business and one named capital provider.
> Measured by: on-chain transaction history for the contracts (verifiable via Stacks Explorer) plus the published `PILOT_RESULT.md` outcome report. A resolved default counts as a completed cycle equally with a resolved repayment — the metric is a completed, transparent transaction, not a guaranteed successful repayment.

---

## 09 — Review and submit

- Accuracy: Confirmed (after applying the 5 ⚠️ fixes above)
- Funding terms: Acknowledged
- Requested: $10,000

### Pre-submit checklist (all verified against repo files on Sep 12, 2026)
- [ ] Maintenance plan placeholder replaced + MIT `LICENSE` added to `flowfi-contracts/`
- [ ] "Who will do the work" grammar fixed
- [ ] M1 success criteria updated to 70+ tests
- [ ] M2 custody wording made precise (matches `RISK_DISCLOSURE.md` §1)
- [ ] M1 description mentions frontend QA; M2 description mentions transparency page
- [ ] `MILESTONE_PLAN.md` Deliverables 1.4 / 2.4 and `APPLICATION_NARRATIVE.md` §3 agree with the form
