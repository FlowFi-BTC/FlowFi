Given the scope we've now locked down, I would make a few strategic changes before using this as the grant-facing landing page.

The biggest issue isn't that the page needs more features. It's that the landing page should make the capital flow immediately obvious.

1. Make the hero more explicit

The first screen should answer three questions immediately:

What is it?
Receivables financing.

Who is it for?
Businesses + capital providers.

What does sBTC do?
Moves the financing/settlement on-chain.

I'd use something along these lines:

Bridging Real-World Receivables to Bitcoin Capital.

FlowFi-BTC connects verified business receivables with Bitcoin capital, enabling transparent, programmable financing and settlement on Stacks.

Then two CTAs:

Explore Receivables
Submit a Receivable

This is better than making the visitor figure out what "Capital Rail" means.

2. Add the two-sided model immediately below the hero

You now have two users, so make that visible:

For Businesses                  For Capital Providers

Submit verified                Discover verified
receivables                    opportunities

Request working capital        Fund with sBTC

Track financing                Track funding
through settlement             through settlement

Buttons:

I'm a Business →

I'm a Capital Provider →

This will also naturally lead into the onboarding architecture we discussed.

3. Add a very simple "How it works"

I'd make this one of the strongest sections:

01  Submit
    Business submits a receivable.

        ↓

02  Verify
    Business and receivable evidence
    are reviewed.

        ↓

03  Fund
    Capital provider funds the
    verified receivable with sBTC.

        ↓

04  Settle
    Repayment or default is recorded
    transparently on-chain.

That tells the entire Capital Rail story in about 10 seconds.

4. Show the verification concept

This is especially important because we've decided verification is part of the trust story.

Don't claim:

"Every business is KYB verified"

until you've actually integrated a KYB provider.

Instead:

Verified Receivables

Each financing opportunity includes verification information about the business and supporting receivable evidence before it becomes eligible for funding.

Then visually show:

✓ Business information reviewed
✓ Receivable evidence reviewed
✓ Verification recorded
✓ On-chain financing state

Later, when you integrate Persona or another provider, you can upgrade this to formal KYB/KYC.

5. Add an actual marketplace preview

This is probably the most important UI addition I'd make.

Instead of the landing page being mostly marketing, show 2–3 example opportunities:

Explore Funding Opportunities

┌─────────────────────────────┐
│ ABC Logistics               │
│ Receivable #CR-001          │
│                             │
│ $10,000 requested            │
│ 45 day term                 │
│ ✓ Verified                  │
│                             │
│ ███████░░░ 70% funded       │
│                             │
│ [View Opportunity]           │
└─────────────────────────────┘

Then:

Explore all receivables →

That connects your landing page directly to the product you're actually building.

6. Don't over-market "investment"

This is important for the grant MVP.

I'd avoid hero copy such as:

"Earn high yields with Bitcoin."

or

"Invest in real-world assets."

Your actual MVP is much more defensible as:

Finance verified receivables with transparent on-chain settlement.

You aren't trying to sell a yield product yet.

7. Add a "Built on Bitcoin" section

Something simple:

Powered by Bitcoin. Built on Stacks.

Bitcoin
Security & liquidity

sBTC
Capital movement

Stacks
Programmable settlement

On-chain records
Transparent financing lifecycle

And link to your public smart-contract repository once it's ready.

8. Add a small trust/disclosure section

Since this is going before grant reviewers, I'd actually embrace the fact that this is an experimental pilot.

Something like:

Pilot

FlowFi-BTC is currently an experimental financing pilot. Initial transactions are intentionally limited in size while the financing mechanism, verification process, and settlement contracts are validated.

Then link:

Read Risk & Security →

That makes you look more credible, not less.

The final landing-page structure I'd use
NAVBAR
Logo
Explore Receivables
How It Works
For Businesses
Docs
GitHub
[Launch App]

────────────────────────────

HERO

Bridging Real-World Receivables
to Bitcoin Capital.

Description

[Explore Receivables] [Submit Receivable]

────────────────────────────

TRUST / PROTOCOL STRIP

Bitcoin | sBTC | Stacks | On-chain Settlement

────────────────────────────

HOW IT WORKS

1. Submit
2. Verify
3. Fund
4. Settle

────────────────────────────

FUNDING MARKETPLACE PREVIEW

Receivable #001
Receivable #002
Receivable #003

[Explore Marketplace]

────────────────────────────

FOR BUSINESSES

Turn verified receivables
into working capital.

[Submit a Receivable]

────────────────────────────

FOR CAPITAL PROVIDERS

Discover verified receivables
and fund them with sBTC.

[Explore Opportunities]

────────────────────────────

TRANSPARENCY

Verification
On-chain records
Funding transactions
Settlement history

────────────────────────────

PILOT / SECURITY

Experimental pilot
Limited transaction size
Unaudited contracts
Risk disclosure

────────────────────────────

OPEN SOURCE

Core financing contracts are
open source and independently
inspectable.

[GitHub] [Documentation]

────────────────────────────

FOOTER
My biggest recommendation

Don't make the landing page feel like a generic DeFi protocol.

Make it feel like a real financial infrastructure product.

The strongest visual narrative is:

Business → Receivable → Verification → sBTC Funding → Settlement