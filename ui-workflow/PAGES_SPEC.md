# FlowFi BTC — Pages Spec

Reconciled against `FRONTEND_API_DOCS.md`. Every endpoint reference below matches its numbered
entry in that doc's Section 6.

---

## 1. Landing Page — `/`

*(Full layout in `LANDING_PAGE_WORKFLOW.md`.)* On load, optionally calls **#21 `GET /v1/marketplace/receivables?status=OPEN_FOR_FUNDING&limit=1`** just to decide CTA wording ("View the Pilot Receivable" vs. generic "Explore Receivables"). No write actions.

---

## 2. Public Marketplace (Explorer) — `/receivable`

**On load:** **#21 `GET /v1/marketplace/receivables?status=OPEN_FOR_FUNDING&page=1&limit=20`**

Filter by `status=OPEN_FOR_FUNDING` for registered-and-fundable listings only — a `DRAFT` or `PENDING_VERIFICATION` receivable should never appear here, only on the business's own `/dashboard/receivables`.

**Card fields (from `MarketplaceItem`):** `title`, `businessName`, `amountUsd`, `fundedPercent`, `dueDate`, `verificationStatus`, `status`. No write actions — cards link into Receivable Detail.

---

## 3. Receivable Detail — `/receivable/[id]`

**On load, three separate reads (don't conflate them):**
```
#13 GET /v1/receivables/:id            → DB view: title, amounts, debtor, business,
                                          verification.details, funding, documents
#19 GET /v1/receivables/:id/onchain     → chain source of truth: registered?, on-chain
                                          status, onchainBusinessId, onchainReceivableId,
                                          registerTxHash, lastSyncedBlock
#20 GET /v1/receivables/:id/activity    → transparency timeline (txHash is null until real)
```

Show the DB view's status as the primary badge, but if `onchain.status` disagrees (e.g. DB says `OPEN_FOR_FUNDING` but on-chain still shows `PENDING_CONFIRMATION`), show a small "syncing..." indicator rather than silently picking one. This is the DB-vs-chain lag the API doc calls out explicitly.

**"View Verification Note & Hash" modal:** reads `verification.details` (method, status, notes, verifiedAt) plus `documents[].sha256` from the detail response — no separate call needed, it's already in #13's payload. Verification is business-level: this modal shows *the business's* verification, not a separate per-receivable check.

**Wallet-aware action button (bottom of page):**

| Connected wallet is... | `receivable.status` | Button | Underlying |
|---|---|---|---|
| Not connected | any | "Connect Wallet to Continue" | — |
| Business owner (role=BUSINESS, owns this business) | `DRAFT`/`PENDING_VERIFICATION` | "Continue in Dashboard" (deep link) | — |
| Business owner | `VERIFIED` (business-verified, not yet on-chain) | "Register On-Chain" | #16/#17 |
| Business owner | `OPEN_FOR_FUNDING`/`FUNDED` | "View in Dashboard" | — |
| Business owner | `FUNDED`, `funding.released = true` | "Repay Receivable" | #35/#36 |
| Wallet with role=INVESTOR, ≠ business | `OPEN_FOR_FUNDING` | "Fund with sBTC" | #29/#30 |
| The funder on this escrow | `FUNDED` | "View Funding Status" (read-only) | #37 |
| Anyone | `REPAID`/`DEFAULTED` | none — read-only outcome | — |

**Admin-only actions (release, default) are never rendered here** — see note in the map doc. They live behind a separate authenticated admin surface.

---

## 4. Business Dashboard — `/dashboard`

**On load:** **#39 `GET /v1/dashboard/business`**

```
┌─────────────────────────────────────┐
│ Overview                              │
│ Total Receivables · Active Funding    │
│ Pending Verification · Repaid/Default │
│ Recent Receivables (linked cards)     │
│  [ + Submit a New Receivable ]         │
└─────────────────────────────────────┘
```

### 4a. `/dashboard/receivables`
**#12 `GET /v1/receivables/me?page=1&limit=20`** — includes `DRAFT`/`PENDING_VERIFICATION` items the public marketplace never shows.

### 4b. `/dashboard/funding`
Same #12 call, filtered client-side (or `?status=FUNDED`) to receivables currently funded — "Repay Receivable" action lives here too, identical trigger to the detail page (#35/#36).

### 4c. `/dashboard/settings`
**#7 `GET /v1/businesses/me`**, **#8 `PATCH /v1/businesses/me`** on save. Editable: `website`, `description`, `country` (if not yet on-chain). Not editable post-registration: `companyName`, `registrationNumber` — changing identity after on-chain registration should require re-verification, not a silent edit.

---

## 5. Investor Dashboard — `/investor`

*(New — the API has a real, separate `INVESTOR` role and dashboard; earlier drafts of this doc collapsed this into the detail page only. Both are needed: the detail page for a single receivable's funding action, this dashboard for portfolio-style tracking across fundings.)*

**On load:** **#40 `GET /v1/dashboard/investor`**, **#10 `GET /v1/investors/me`**

```
┌─────────────────────────────────────┐
│ Overview                              │
│ fundingsCount · activeFundings        │
│                                        │
│ My Fundings                            │
│  ABC Logistics — 0.15 sBTC — ACTIVE     │
│              [ View Funding → ]         │
└─────────────────────────────────────┘
```

### 5a. `/investor/fundings`
**#31 `GET /v1/fundings/me`** — list of the investor's own fundings.

### 5b. `/investor/fundings/[id]`
**#32 `GET /v1/fundings/:id`** (tracking details) + **#37 `GET /v1/escrows/:id`** for on-chain-specific escrow fields (`released`, `releaseTxHash`, `settledAt`). Read-only for the investor — release and default are admin actions, not shown here.

---

## 6. Onboarding (first login) — modal or `/onboarding`

**#4 `POST /v1/onboarding` `{ role: "BUSINESS" | "INVESTOR" }`**, then **#5 `GET /v1/onboarding/status`** to know `nextStep`. Route to `/dashboard/settings` (create business profile, #6) or an investor profile form (#9 `POST /v1/investors`) accordingly.

---

## 7. Submit a New Receivable — `/dashboard/submit`

*(Matches your existing 5-step UI — documented here with the corrected two-phase API sequencing.)*

```
Step 1: Business Information
   - If GET /businesses/me already exists & verification.status = VERIFIED: pre-filled, read-only
   - If not registered yet: collect fields, call #6 POST /v1/businesses on this step's completion
     (country is required before on-chain register-business, per the doc — collect it here even
     though the endpoint marks it optional, to avoid a blocking PATCH later)

Step 2: Receivable Details        — local form state only, no API call yet
Step 3: Debtor & Counterparty     — local form state only

Step 4: Invoice Document & Hashing
   - File selected client-side → SHA-256 computed in-browser for immediate display
   - On confirm: #18 POST /v1/receivables/:id/documents (multipart/form-data, field "file")
     — NOTE: this requires the receivable to already exist, so Step 5's "create receivable"
     call must happen before document upload, not after. Adjust step order if needed, or
     create the receivable record silently at the start of Step 4.

Step 5: Review → "Submit Receivable"
   #11 POST /v1/receivables  { title, description, invoiceNumber, amountUsd, dueDate, debtor }
   → creates the off-chain record. status = VERIFIED if the business is already verified,
     otherwise DRAFT. This does NOT touch the chain.
```

**Then, as a distinct later step — NOT part of the 5-step form, shown only once the receivable is `VERIFIED`:**

```
"Register On-Chain" button appears on the receivable's detail/dashboard card
   ↓
#16 POST /v1/receivables/:id/register/prepare   (Idempotency-Key)
   → business wallet signs → broadcast
#17 POST /v1/receivables/:id/register/confirm   { txHash, operationId, onchainReceivableId }
   → status becomes PENDING_CONFIRMATION (never OPEN_FOR_FUNDING immediately)
   → poll #38 GET /v1/transactions/:txHash until CONFIRMED
   → mock confirmer (or real indexer) then flips it to OPEN_FOR_FUNDING
```

**Verification correction from the previous draft:** verification is **business-level and one-time**, not per-receivable. If the business is already `VERIFIED`, a new receivable inherits that status immediately (`Verified Business + Invoice Evidence + On-chain Registration = fundable`) — there's no separate "wait for reviewer" step per receivable. The only per-receivable gate is uploading the document and registering on-chain. Business-level verification itself uses #22–#28 (Start → Complete off-chain, then Prepare/Confirm on-chain attestation, verifier-wallet-signed) — that's a one-time flow on the business profile, not something repeated per invoice.
