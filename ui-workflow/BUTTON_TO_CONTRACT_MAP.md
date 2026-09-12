# FlowFi BTC — Button → API → Contract Map

Every button traced end to end, using the exact numbered endpoints from `FRONTEND_API_DOCS.md`
Section 6, and the Contract ↔ API alignment matrix in its Appendix (§8).

---

## 1. "Register Business" (Onboarding / Dashboard Settings, first-time, off-chain step)

```
#6  POST /v1/businesses   { companyName, registrationNumber, website, description, country }
    → off-chain profile created, verificationStatus PENDING. No contract call yet.
```

## 2. "Start Verification" → "Complete Verification" (off-chain review, business-level, one-time)

```
#22 POST /v1/verification/businesses/:businessId/start     (business session)
#24 POST /v1/verification/businesses/:businessId/complete  (MVP: owner-completable; production
    restricts this to a verifier/admin role)
    → business.verification.status = VERIFIED (off-chain only, still not on-chain)
```

## 3. "Register Business On-Chain" (business wallet signs)

```
Click "Register Business On-Chain"
   ↓
#25 POST /v1/verification/businesses/:id/onchain/register/prepare   (Idempotency-Key)
   → { operationId, transaction: { contractAddress, contractName: "flowfi-registry",
       functionName: "register-business", functionArgs: ["string-ascii:...", "string-ascii:.."] } }
   ↓
@stacks/connect → BUSINESS wallet signs (becomes on-chain owner)
   ↓
#26 POST /v1/verification/businesses/:id/onchain/register/confirm   { txHash, operationId }
   ↓
poll #38 GET /v1/transactions/:txHash
   ↓
Contract: flowfi-registry.register-business(business-name, country)
   → backend maps biz_xxx ↔ onchainBusinessId (uint) once confirmed
```

## 4. "Attest / Verify Business" (VERIFIER WALLET ONLY — admin surface, not shown to the business)

```
#27 POST /v1/verification/businesses/:id/onchain/prepare
   → { operationId, transaction: { functionName: "verify-business",
       functionArgs: ["uint:<onchainBusinessId>", "uint:<method>", "uint:<level>",
       "uint:<expiry>", "principal:<verifiedBy>", "buff:<ref>", "buff:<proof>"] } }
   ↓
@stacks/connect → VERIFIER wallet signs (VERIFIER_WALLETS allowlist; u100 otherwise)
   ↓
#28 POST /v1/verification/businesses/:id/onchain/confirm   { txHash, operationId }
   ↓
Contract: flowfi-registry.verify-business(...)
   → business-verified on-chain, verification-status = VERIFIED
```

**Do not render this button on any business-facing page.** It belongs on a separate
verifier/admin tool, gated by the `VERIFIER_WALLETS` allowlist — the business wallet can
never verify itself (chain rejects with `u100`), so there's no reason to expose the trigger
where a business could even attempt it.

---

## 5. "Submit Receivable" (off-chain record — Step 5 of the submit flow)

```
#11 POST /v1/receivables   { title, description, invoiceNumber, amountUsd, dueDate, debtor }
    → off-chain record. status = VERIFIED if business already verified, else DRAFT.
      No contract call yet.
```

## 6. "Upload Invoice" (Step 4 — document hash)

```
Client computes SHA-256 in-browser for display, then:
#18 POST /v1/receivables/:id/documents   multipart/form-data, field "file"
    → { sha256, storageStatus: "STORED" }
    → this sha256 is what later becomes the on-chain invoice-hash. No contract call yet.
```

## 7. "Register On-Chain" (business wallet signs — the actual first on-chain receivable action)

```
Click "Register On-Chain" (shown once receivable.status = VERIFIED)
   ↓
#16 POST /v1/receivables/:id/register/prepare   (Idempotency-Key)
   → validates prerequisites first: BUSINESS_NOT_ONCHAIN, DEBTOR_REQUIRED,
     DEBTOR_COUNTRY_REQUIRED, INVOICE_NUMBER_REQUIRED, DOCUMENT_REQUIRED,
     DUE_DATE_NOT_FUTURE — surface these as inline fixes, not raw errors
   → { operationId, transaction: { contractName: "flowfi-registry",
       functionName: "register-receivable", functionArgs: [
       "uint:<onchainBusinessId>", "string-ascii:<debtorName>", "string-ascii:<debtorCountry>",
       "string-ascii:<invoiceNumber>", "buff:0x<invoiceHash>", "uint:<faceValue>",
       "uint:<fundingAmount>", "uint:<issueBurnHeight>", "uint:<dueBurnHeight>"] } }
   ↓
@stacks/connect → BUSINESS wallet signs
   ↓
#17 POST /v1/receivables/:id/register/confirm   { txHash, operationId, onchainReceivableId }
   → returns status: "PENDING_CONFIRMATION" — deliberately NOT "OPEN_FOR_FUNDING" yet
   ↓
poll #38 GET /v1/transactions/:txHash  (or #19 GET /v1/receivables/:id/onchain)
   ↓
Contract: flowfi-registry.register-receivable(...)
   → reverts u105 (not owner) / u106 (not verified) — should be pre-empted by the
     prepare step's own checks, this is defense-in-depth on-chain
   → on confirm: mock confirmer (or real indexer) flips status to OPEN_FOR_FUNDING
```

---

## 8. "Fund with sBTC" (Receivable Detail, INVESTOR wallet)

```
Click "Fund with sBTC"
   ↓
#29 POST /v1/fundings/prepare   { receivableId, amountSbtc }   (Idempotency-Key)
   → backend validates amountSbtc against the REGISTERED funding target
     (FUNDING_AMOUNT_MISMATCH if it doesn't match — display the prepared amount as truth,
     don't let the user type a different number into the wallet)
   → { operationId, fundingId, transaction: { functionName: "fund-receivable",
       functionArgs: ["uint:<onchainReceivableId>", "principal:<sbtc-token-contract>"] } }
   ↓
@stacks/connect → INVESTOR wallet signs (≠ business, else u205)
   ↓
#30 POST /v1/fundings/confirm   { fundingId, txHash, operationId }
   → status CONFIRMING (funding stays OPEN/PENDING)
   ↓
poll #38, then #37 GET /v1/escrows/:id
   ↓
Contract: flowfi-escrow.fund-receivable(receivable-id, token)
   → reverts u203 not-open, u204 already-funded, u205 self-funding, u202 wrong token
   → on success: transfers funding-amount investor → escrow, registry OPEN_FOR_FUNDING → FUNDED
```

---

## 9. "Release Funds" (ADMIN WALLET ONLY — separate admin surface)

```
#33 POST /v1/fundings/:id/release/prepare
   → { operationId, transaction: { functionName: "release-funds",
       functionArgs: ["uint:<onchainReceivableId>", "principal:<sbtc-token-contract>"] } }
   ↓
@stacks/connect → ADMIN wallet signs (u200 otherwise)
   ↓
#34 POST /v1/fundings/:id/release/confirm   { txHash, operationId }
   ↓
Contract: flowfi-escrow.release-funds(receivable-id, token)
   → reverts u207 if already released
   → on success: escrow → business (recipient fixed, never redirectable)
   → required before repayment can succeed — repay-receivable reverts u208 otherwise
```

**Never render this on any public or business-facing page.** Build a minimal separate
`/admin` route requiring the admin wallet to even load.

---

## 10. "Repay Receivable" (business wallet, only after release)

```
Click "Repay Receivable" (only enabled once funding shows released = true)
   ↓
#35 POST /v1/fundings/:id/repayment/prepare
   → checks released/readyToRepay gate first — surface "waiting on release" state if not yet
   → { operationId, transaction: { functionName: "repay-receivable",
       functionArgs: ["uint:<onchainReceivableId>", "principal:<sbtc-token-contract>"] } }
   ↓
@stacks/connect → BUSINESS wallet signs (u209 if not the stored business)
   → wallet shows a flat amount == funding-amount, no interest field
   ↓
#36 POST /v1/fundings/:id/repayment/confirm   { txHash, operationId }
   → status CONFIRMING (funding stays ACTIVE)
   ↓
poll #38
   ↓
Contract: flowfi-escrow.repay-receivable(receivable-id, token)
   → reverts u206 if not FUNDED, u208 if not released, u209 if wrong caller
   → on success: business → escrow → funder atomically, registry FUNDED → REPAID
```

---

## 11. "Flag as Defaulted" (current MVP: off-chain admin action, NOT yet on-chain mark-default)

```
Click "Flag as Defaulted" (admin surface, past due date)
   ↓
#15 POST /v1/receivables/:id/default   { reason }
   → { receivableId, status: "DEFAULTED", reason,
       transaction: { status: "CONFIRMED", txHash: "def_tx_..." } }
```

**Important, per the API doc's own MVP-simplifications note:** this endpoint is currently an
off-chain admin action — it does **not** call `flowfi-escrow.mark-default` on-chain in the
current build. The `txHash` shown here (`def_tx_...`) is an off-chain placeholder identifier,
**not a real Stacks transaction** — do not link it to `explorer.hiro.so`, and label it plainly
as "recorded off-chain, pending on-chain wiring" until this is connected to the real
`mark-default` contract call (admin wallet, past registry due-date) before mainnet.

---

## Read-Only / Non-Contract Buttons

| Button | Endpoint | Notes |
|---|---|---|
| "View Verification Note & Hash" | included in #13's response (`verification.details`, `documents[].sha256`) | No separate call, no chain interaction |
| "View On-Chain Status" | #19 `GET /v1/receivables/:id/onchain` | Compares against DB view; shows sync state |
| "View on Explorer" (real txid links only) | none — direct link to `explorer.hiro.so` | Only for entries where `txHash` is non-null and real; never for #15's off-chain placeholder |
| "Explore Receivables" | #21 | Navigation only |
| "Connect Wallet" | #1 `POST /v1/auth/challenge` → sign → #2 `POST /v1/auth/verify` | No contract call |
| "My Fundings" (investor) | #31 | Read-only list |
| "Funding Tracking Detail" (investor) | #32, #37 | Read-only |

---

## Error Handling Pattern

```
Wallet rejects / user cancels signing
   → return to pre-click state silently, no /confirm call made

Contract revert (e.g. u205)
   → txHash exists but failed on-chain → /confirm records the failure
   → map the revert code to plain language (u205 → "You can't fund your own receivable"),
     never show a raw error code to the end user

422 IDEMPOTENCY_KEY_REUSE
   → same key was sent with a different payload — generate a fresh UUID and retry the call,
     don't just resend

Network/API failure before wallet opens
   → "Something went wrong preparing this transaction — no funds were moved. Try again."
```
