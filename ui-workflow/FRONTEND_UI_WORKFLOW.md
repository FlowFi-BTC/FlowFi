# FlowFi BTC — Frontend UI Workflow (Overview)

Reconciled against `FRONTEND_API_DOCS.md` (the authoritative API spec). Two companion docs:
- [PAGES_SPEC.md](./PAGES_SPEC.md) — every page, what it shows, what's on it
- [BUTTON_TO_CONTRACT_MAP.md](./BUTTON_TO_CONTRACT_MAP.md) — every button, its exact API endpoint (numbered per the spec), and the contract function it ultimately triggers

---

## Site Map

```
/                          Landing page
/receivable                Public Marketplace (Explorer) — GET /v1/marketplace/receivables
/receivable/[id]           Receivable Detail (wallet-aware actions) — GET /v1/receivables/:id
/dashboard                 Business Dashboard (Overview) — GET /v1/dashboard/business
/dashboard/receivables      GET /v1/receivables/me
/dashboard/submit           Submit-a-Receivable flow (multi-step)
/dashboard/funding          Business's active fundings (filtered view of receivables/me)
/dashboard/settings         GET/PATCH /v1/businesses/me
/investor                  Investor Dashboard (Overview) — GET /v1/dashboard/investor
/investor/fundings          GET /v1/fundings/me
```

Two roles exist in the API (`UserRole = 'BUSINESS' | 'INVESTOR'`), selected once at onboarding (`POST /v1/onboarding` → `Select Role`). This is a real role split in the backend, not just UI framing — reflect it as two distinct dashboards, not one dashboard with a toggle.

---

## Universal Pattern: Wallet-Aware Rendering

```
Page loads
   ↓
POST /v1/auth/challenge → sign → POST /v1/auth/verify → { token, user }
   ↓
GET /v1/auth/me (or GET /v1/onboarding/status) → { role, profileComplete }
   ↓
Compare connected principal + role to the record's roles:
   - role = BUSINESS and owns this business/receivable → management actions
   - role = INVESTOR and funder on this escrow          → funding/tracking actions
   - anyone else / not connected                          → read-only view
```

## Universal Pattern: Every Money-Moving Button

Matches the doc's own "read this first" lifecycle exactly:

```
1. User clicks button
2. Frontend calls the matching `*/prepare` endpoint, WITH an Idempotency-Key header
   (generate one fresh UUID per user intent — see newIdempotencyKey() in the API doc's
   client helper)
   → response includes { operationId, transaction: { contractAddress, contractName,
      functionName, functionArgs, postConditionMode } }
3. Pass `transaction` straight to the wallet via @stacks/connect — functionArgs are
   already Clarity-value-encoded strings ("uint:1", "buff:0x..."). Never re-encode them.
4. Wallet signs → broadcasts → frontend gets a txHash
5. Frontend calls the matching `*/confirm` endpoint with { txHash, operationId }
   → response status is CONFIRMING, never CONFIRMED — this is expected
6. Poll GET /v1/transactions/:txHash (interval ~4s, timeout ~120s per the doc's
   pollTransaction() helper) until status = CONFIRMED | FAILED | DROPPED
```

**Important correction from the previous draft of this doc:** confirm calls do **not** immediately return a final state. The MVP uses a mock confirmer (`MOCK_CONFIRM_DELAY_MS`, default 30s) that flips `CONFIRMING → CONFIRMED` after a delay — a real indexer replaces this before mainnet without any frontend changes, because the shape is already fully async. Every UI that shows a money-moving action must show a "Confirming..." state, not just "Pending" → "Done".

---

## Universal Pattern: Status Vocabularies (Don't Mix Them)

Three separate status fields exist — using the wrong one in the wrong place is the most common bug this pattern prevents:

| Vocabulary | Values | Where it's read |
|---|---|---|
| **Receivable lifecycle** (DB view) | `DRAFT` → `PENDING_VERIFICATION` → `VERIFIED` → `OPEN_FOR_FUNDING` → `FUNDED` → `REPAID` \| `DEFAULTED` | `receivable.status` |
| **Funding lifecycle** | `OPEN` → `FUNDED` → `REPAID` \| `DEFAULTED` (`fundingStatus`, forward-compatible alias of legacy `PENDING`/`ACTIVE`/`REPAID`/`DEFAULTED`) | `funding.fundingStatus` |
| **Transaction lifecycle** | `PREPARED` → `BROADCAST` → `CONFIRMING` → `CONFIRMED` \| `FAILED` (+ `CANCELLED`/`DROPPED`) | `transaction.status` on any `*/confirm` response, and `GET /transactions/:txHash` |

`GET /receivables/:id/onchain` is the blockchain source of truth; the plain receivable object is the database view — the two can briefly disagree during confirmation lag. Always poll the transaction, never assume the DB view is final immediately after a broadcast.

---

## Universal Pattern: Status Color Coding (Receivable Lifecycle)

| Status | Color | Meaning |
|---|---|---|
| `DRAFT` | Gray, dashed border | Off-chain only, registration not started |
| `PENDING_VERIFICATION` | Gray | Off-chain review in progress |
| `VERIFIED` | Blue, outline | Business-verified, awaiting on-chain registration |
| `OPEN_FOR_FUNDING` | Blue, solid | Registered on-chain, awaiting funding |
| `FUNDED` | Amber | sBTC escrowed/released, awaiting repayment |
| `REPAID` | Green | Cycle complete, successfully |
| `DEFAULTED` | Red | Cycle complete, due date passed unpaid |

---

## Data Flow Summary (all pages)

```
Frontend
   │
   ├── Reads  → REST API (Base: /v1) → Postgres (DB view: profiles, receivable metadata,
   │             verification records, documents) AND/OR Hiro API via GET .../onchain
   │             (blockchain source of truth)
   │
   └── Writes → API `*/prepare` (Idempotency-Key) → returns transaction payload
                 @stacks/connect → wallet signs → broadcast → txHash
                 API `*/confirm` (same Idempotency-Key, + operationId) → CONFIRMING
                 GET /transactions/:txHash → poll → CONFIRMED
```
