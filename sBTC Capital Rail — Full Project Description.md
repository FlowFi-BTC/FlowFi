# FlowFi-BTC

## Overview

FlowFi-BTC is an on-chain coordination and transparency layer for financing verified real-world receivables with sBTC.

Businesses often complete work, deliver products, or provide services before they receive payment. A business may be owed $3,000 today but have to wait 30–60 days for its customer to pay. During that period, the business may need working capital for inventory, operations, payroll, logistics, or a new order.

Capital Rail explores whether sBTC can be used as productive working capital against these existing future cash flows.

Instead of creating another general-purpose lending or yield protocol, Capital Rail creates a structured lifecycle around a specific receivable:

**Receivable → Verification → Capital Commitment → Funding → Business Use → Repayment → On-chain Outcome**

The MVP is intentionally narrow. It focuses on one verified receivable, one business, and one capital provider, allowing the project to validate whether this financing workflow can operate transparently on Stacks.

## The Problem

Most DeFi lending systems are designed around crypto-native collateral and on-chain assets. Real businesses, however, have another form of financial value: money they are already contractually or commercially expected to receive.

A business may have:

- a completed invoice,
- a signed contract,
- a confirmed purchase order,
- or another legitimate receivable,

but still need to wait weeks before receiving payment.

This creates a working-capital gap.

At the same time, Bitcoin and sBTC holders have capital that is primarily deployed within crypto-native markets. Capital Rail explores a different use case: connecting Bitcoin-backed liquidity with verifiable real-world business cash flows.

The project asks a focused question:

**Can sBTC be used to provide transparent, programmable working capital against a verified future business payment?**

## What Capital Rail Does

Capital Rail does not attempt to become a bank, public investment fund, or generalized lending marketplace.

The MVP provides the infrastructure required to structure and transparently track a receivable-financing transaction.

A business submits a receivable containing information such as:

- receivable amount,
- debtor,
- expected payment date,
- supporting invoice or contract,
- business identity,
- intended use of capital.

The receivable is then reviewed through a verification process.

Once verified, the receivable becomes eligible for a capital commitment.

An sBTC capital provider can review the receivable and commit capital against that specific transaction. The commitment, funding status, receivable status, and eventual repayment outcome are recorded through the Capital Rail smart-contract lifecycle.

The actual business documents remain off-chain. Cryptographic hashes and verification metadata can be anchored on Stacks so that the financing record can be independently referenced without exposing private commercial documents on-chain.

## Verification Model

Verification is a core part of Capital Rail because the protocol should not simply accept an arbitrary invoice and treat it as a valid financial asset.

The MVP uses a human-assisted verification process.

The verification process checks:

1. Whether the business submitting the receivable can be identified.
2. Whether the submitting representative is authorized to act for the business.
3. Whether the invoice, contract, or supporting document exists.
4. Whether the amount and payment terms are consistent with the submitted receivable.
5. Whether the debtor information can be independently confirmed where practical.
6. Whether the receivable has evidence suggesting that it has not already been financed elsewhere.

The result is a structured verification record.

The record can contain:

- verification status,
- verifier identity,
- verification timestamp,
- document hash,
- verification hash,
- relevant confirmation metadata.

The MVP does not claim that verification guarantees repayment. Verification establishes that the receivable was reviewed against a defined set of evidence. Default, disputes, fraud, insolvency, and other real-world risks remain possible and are explicitly disclosed.

## Smart Contract

The Stacks smart contract represents the lifecycle of a receivable.

A simplified lifecycle is:

**REGISTERED → VERIFIED → OPEN FOR FUNDING → FUNDED → REPAID**

with alternative terminal outcomes such as:

**CANCELLED** or **DEFAULTED**

The contract records core information such as:

- receivable ID,
- business,
- capital provider,
- amount,
- expected due block/date,
- document or verification hash,
- current status,
- relevant timestamps or block references.

The contract provides explicit state transitions and authorization checks rather than relying entirely on the application's frontend.

This creates a public and auditable representation of the financing lifecycle.

## Capital Provider Model

The MVP does not depend on building a public marketplace of anonymous lenders.

The first validation can use a single known capital provider, including founding-team capital or another controlled pilot participant, subject to the legal and operational structure of the pilot.

The purpose of the initial transaction is not to prove that Capital Rail can immediately attract a large lending market. The purpose is to prove that the infrastructure can coordinate and transparently record the complete lifecycle of a receivable-backed sBTC financing transaction.

Support for multiple external capital providers can be explored after the core mechanism has been validated.

## Why Stacks and sBTC

Stacks provides the execution environment in which the financing lifecycle can be represented through Bitcoin-aligned smart-contract infrastructure.

sBTC is particularly relevant because it provides a way to bring Bitcoin-backed capital into programmable on-chain applications.

Capital Rail uses sBTC for a purpose beyond purely crypto-native trading or yield strategies.

The project explores whether Bitcoin liquidity can be connected to measurable real-world economic activity through:

- verified receivables,
- structured financing commitments,
- programmable settlement,
- transparent transaction history,
- and on-chain repayment outcomes.

The project therefore treats sBTC not simply as an asset to hold, but as a potential capital rail for real economic activity.

## What Makes Capital Rail Different

Capital Rail is not intended to be:

- a payroll streaming protocol,
- a merchant payment processor,
- a generic DeFi money market,
- a yield aggregator,
- a tokenized investment fund,
- or a public marketplace for speculative invoice investments.

The core primitive is different:

**Capital Rail links a specific, verified future business cash flow to a specific sBTC capital commitment.**

The central relationship is:

**Existing business receivable → verified economic obligation → sBTC working capital → repayment**

This allows the project to investigate a relatively unexplored sBTC use case while keeping the first implementation small and measurable.

## MVP Scope

The MVP will contain:

### 1. Receivable Registry

Businesses can submit a receivable and provide the required supporting information.

### 2. Verification Workflow

A verifier can review the business and receivable evidence and produce a structured verification result.

### 3. Verification Attestation

The verification result is represented through a cryptographic hash and anchored to the corresponding receivable record.

### 4. Capital Commitment

A capital provider can review a verified receivable and commit sBTC according to the defined financing terms.

### 5. Smart-Contract Lifecycle

The Clarity contract manages the receivable state from registration through funding and final outcome.

### 6. Transparency Interface

Users can inspect the status of a receivable and view relevant Stacks transaction references.

### 7. Pilot Report

The project will publish the outcome of the pilot, including what worked, what failed, the verification process used, transaction evidence, and lessons learned.

## Initial Pilot

The first pilot is intentionally small.

The target structure is:

**One business**

**One receivable**

**One capital provider**

**One financing transaction**

**One final outcome**

The initial transaction can be performed on testnet while the complete workflow is being validated.

A controlled mainnet pilot may follow once the relevant technical, legal, and operational requirements have been reviewed.

The grant is not being used to provide a large pool of lending capital. Grant funding is primarily for engineering, verification infrastructure, security/testing, deployment, documentation, and pilot execution.

## Expected Outcome

The smallest useful outcome is a complete, publicly demonstrable receivable-financing lifecycle.

A successful MVP should allow a reviewer to follow one transaction from:

**Receivable registration**

to

**Verification**

to

**sBTC capital commitment**

to

**Funding**

to

**Repayment or documented final outcome**

with the relevant on-chain transactions and verification evidence available for inspection.

This would establish whether the core mechanism is technically viable and whether businesses and capital providers find the workflow sufficiently useful to justify further development.

## Future Development

If the pilot demonstrates meaningful value, Capital Rail can expand in stages.

### Phase 1 — Single-Receivable Validation

Validate the fundamental lifecycle with one receivable and one provider.

### Phase 2 — Permissioned Pilot

Support multiple verified businesses, receivables, and capital providers under a controlled participation model.

### Phase 3 — Verification and Risk Infrastructure

Introduce stronger verification tooling, structured risk information, historical repayment data, and additional verification partners.

### Phase 4 — Broader Capital Coordination

Explore integrations that allow existing sBTC holders, capital desks, treasury managers, and ecosystem applications to discover and finance eligible receivables.

Any future expansion into broader public financing, investment products, custody, or other regulated financial activities would require appropriate legal and compliance structuring before launch.

## Why This Matters for the Stacks Ecosystem

Capital Rail is an experiment in expanding the utility of sBTC beyond crypto-native financial activity.

If successful, the resulting infrastructure could provide a foundation for applications that connect Bitcoin-backed liquidity with real economic cash flows while maintaining a transparent on-chain record of commitments and outcomes.

The immediate deliverable is deliberately small, but the underlying primitive is extensible:

**verified real-world obligation + programmable Bitcoin-backed capital + transparent settlement**

The project will remain open and documented so that other Stacks builders can learn from the implementation and potentially build additional financial applications on top of the same primitives.

## Risk and Disclosure

Capital Rail does not eliminate the risks associated with real-world receivables.

Potential risks include:

- inaccurate or fraudulent documentation,
- debtor disputes,
- late payment,
- business insolvency,
- smart-contract vulnerabilities,
- sBTC or Bitcoin market volatility,
- operational errors,
- and regulatory or legal uncertainty.

The MVP will therefore use explicit verification criteria, transparent status reporting, limited participation, and clear risk disclosures.

The protocol does not guarantee repayment merely because a receivable has been verified.

The initial design also avoids public fundraising, anonymous lender pools, and custody of participant assets by Capital Rail where possible. The exact structure of any live mainnet pilot will be reviewed for applicable legal and compliance requirements before real third-party capital is deployed.

## Summary

Capital Rail is a focused experiment in turning sBTC into productive working capital.

Rather than building another general-purpose DeFi lending platform, it creates a structured rail connecting **verified real-world receivables with Bitcoin-backed capital**.

The MVP will prove the smallest version of that idea:

**One verified receivable. One sBTC capital commitment. One transparent on-chain lifecycle. One measurable outcome.**