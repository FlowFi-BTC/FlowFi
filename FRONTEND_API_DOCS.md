# FlowFi / Capital Rail - Frontend Developer API Guide

This documentation provides comprehensive details for frontend engineers integrating with the FlowFi / Capital Rail REST API.

---

## Table of Contents
1. [General Information](#1-general-information)
2. [End-to-End Lifecycle (read this first)](#2-end-to-end-lifecycle-read-this-first)
3. [Authentication Flow (Wallet Login)](#3-authentication-flow-wallet-login)
4. [TypeScript Definitions for Frontend](#4-typescript-definitions-for-frontend)
5. [Idempotency & Operations](#5-idempotency--operations)
6. [API Endpoints Reference](#6-api-endpoints-reference)
   - [Authentication](#authentication)
   - [Onboarding](#onboarding)
   - [Business Profiles](#business-profiles)
   - [Investor Profiles](#investor-profiles)
   - [Receivables Management](#receivables-management)
   - [Receivable On-Chain Registration](#receivable-on-chain-registration)
   - [Invoice Documents](#invoice-documents)
   - [Blockchain State & Activity](#blockchain-state--activity)
   - [Marketplace](#marketplace)
   - [Verification (Business-Level)](#verification-business-level)
   - [Verification On-Chain Attestation](#verification-on-chain-attestation)
   - [sBTC Funding](#sbtc-funding)
   - [sBTC Repayment & Settlement](#sbtc-repayment--settlement)
   - [Escrows](#escrows)
   - [Transactions & Proofs](#transactions--proofs)
   - [Dashboards](#dashboards)
   - [Legacy Verification (Deprecated)](#legacy-verification-deprecated)
7. [Frontend API Client Helper (Axios/Fetch)](#7-frontend-api-client-helper-axiosfetch)
8. [Appendix: Environment, Contract Alignment & MVP Notes](#8-appendix-environment-contract-alignment--mvp-notes)

---

## 1. General Information

- **Base URL (Local)**: `http://localhost:4000/v1` or `http://localhost:4000/api/v1`
- **Base URL (Production)**: `https://api.flowfi.xyz/v1`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>` (for authenticated endpoints)
  - `Idempotency-Key: <uuid>` (recommended for all wallet-tx writes, see [section 5](#5-idempotency--operations))
  - Every response carries an `X-Request-Id` header. Send it back when reporting errors.
- **File uploads** use `multipart/form-data` (see [Invoice Documents](#invoice-documents)).

### Standard Response Envelope
Success responses return the resource shape directly. List endpoints return `{ "items": [...], "pagination": {...} }`.

```json
{
  "id": "rec_123",
  "title": "Invoice INV-2041",
  "status": "OPEN_FOR_FUNDING"
}
```

List wrapper:
```json
{
  "items": [],
  "pagination": { "page": 1, "limit": 20, "total": 12 }
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "amountUsd",
        "message": "'amountUsd' must be a positive number"
      }
    ]
  }
}
```

> **Planned (v2):** success bodies will move to `{ "data": {...}, "meta": {...} }` and errors to `{ "error": {...} }` (no `success` flag). New fields are always additive until then, so code against field names, not envelope shape.

#### Common Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `INVALID_CHALLENGE` / `INVALID_STATUS` / `INVALID_OPERATION` / `ALREADY_REGISTERED` | Bad request, wrong lifecycle state, unknown `operationId`, or already on-chain |
| `400` | `BUSINESS_NOT_ONCHAIN` / `RECEIVABLE_NOT_REGISTERED` / `RECEIVABLE_NOT_OPEN` | On-chain prerequisite missing — follow the guided `.../prepare` step in the message |
| `400` | `DEBTOR_REQUIRED` / `DEBTOR_COUNTRY_REQUIRED` / `INVOICE_NUMBER_REQUIRED` / `DOCUMENT_REQUIRED` / `DUE_DATE_NOT_FUTURE` / `COUNTRY_REQUIRED` | Contract-required field missing for `register-receivable` / `register-business` (fix via `PATCH /receivables/:id` or profile update) |
| `400` | `INVALID_ASCII` | Name/invoice contains non-ASCII characters (Clarity `string-ascii` is printable ASCII only) |
| `400` | `FUNDING_AMOUNT_MISMATCH` / `FUNDING_NOT_CONFIRMED` | Requested `amountSbtc` differs from the registered funding target, or funds not escrowed yet |
| `401` | `UNAUTHORIZED` | Missing, invalid, or expired JWT Bearer token |
| `403` | `FORBIDDEN` / `BUSINESS_NOT_VERIFIED` / `BUSINESS_PROFILE_REQUIRED` | Not the owner, or business not verified yet |
| `403` | `VERIFIER_FORBIDDEN` / `VERIFIER_NOT_CONFIGURED` | Attestation needs a verifier/admin session (`VERIFIER_WALLETS` allowlist) |
| `404` | `NOT_FOUND` | Requested resource (Receivable, Profile, User, Escrow) does not exist |
| `409` | `DUPLICATE_ENTRY` / `PROFILE_EXISTS` / `ALREADY_FUNDED` | Resource already created / funded |
| `413` | `FILE_TOO_LARGE` | Uploaded invoice exceeds the size limit |
| `422` | `VALIDATION_ERROR` / `IDEMPOTENCY_KEY_REUSE` / `UNSUPPORTED_FILE_TYPE` | Schema validation failed, key reused with a different payload, or bad file type |
| `500` | `INTERNAL_SERVER_ERROR` | Internal server exception |

### Status vocabularies (do not mix them)
- **Funding lifecycle** (`fundingStatus`): `OPEN` → `FUNDED` → `REPAID` | `DEFAULTED`. (The Prisma-backed `status` field uses `PENDING`/`ACTIVE`/`REPAID`/`DEFAULTED`; `fundingStatus` is the forward-compatible alias.)
- **Transaction lifecycle** (`transaction.status` on confirms): `PREPARED` → `BROADCAST` → `CONFIRMING` → `CONFIRMED` | `FAILED` (+ `CANCELLED`, `DROPPED` where applicable). Confirms return `CONFIRMING` — never `CONFIRMED` — until the indexer (MVP: mock confirmer) verifies the chain.
- **Receivable lifecycle**: `DRAFT` → `VERIFIED` (business-verified, awaiting chain) → `PENDING_CONFIRMATION` (broadcast, async view) → `OPEN_FOR_FUNDING` → `FUNDED` → `REPAID` | `DEFAULTED`.
- **Transaction query statuses** (`GET /transactions/:txHash`): `PENDING` | `CONFIRMED` | `FAILED` | `DROPPED`.
- **On-chain ids vs backend ids**: `rec_xxx` / `biz_xxx` are Postgres ids and NEVER enter Clarity. Chain identity is always a `uint` (`onchainReceivableId`, `onchainBusinessId`), mapped by the backend after the register transaction confirms.

---

## 2. End-to-End Lifecycle (read this first)

### Business
```
POST /businesses  (include 2-letter "country" — required for register-business)
        ↓
POST /verification/businesses/:id/start   (off-chain review opens, BUSINESS session)
        ↓
POST /verification/businesses/:id/complete  →  Business VERIFIED (off-chain)
        ↓
POST /verification/businesses/:id/onchain/register/prepare  →  BUSINESS wallet signs
        ↓
flowfi-registry register-business  →  POST .../onchain/register/confirm
        ↓  (backend maps biz_xxx ↔ onchainBusinessId uint)
POST /verification/businesses/:id/onchain/prepare  →  VERIFIER wallet signs
        ↓
flowfi-registry verify-business  →  POST .../onchain/confirm
```
> Identity split: the **business session** owns the business and registers it;
> a **verifier/admin session** (`VERIFIER_WALLETS` allowlist) performs the
> attestation. The business wallet can never verify itself (chain rejects with `u100`).

### Receivable
```
POST /receivables                            (off-chain Postgres record, DRAFT/VERIFIED)
        ↓
POST /receivables/:id/documents              (invoice PDF/image → SHA-256 evidence)
        ↓
PATCH /receivables/:id                       (optional: fix debtor / invoice / due date pre-registration)
        ↓
POST /receivables/:id/register/prepare       (flowfi-registry tx payload + operationId)
        ↓
Business wallet signs  →  flowfi-registry register-receivable
        ↓  (backend maps rec_xxx ↔ onchainReceivableId uint)
POST /receivables/:id/register/confirm       (returns PENDING_CONFIRMATION, never OPEN_FOR_FUNDING)
        ↓
Indexer/mock-confirm  →  OPEN_FOR_FUNDING    (poll GET /transactions/:txHash or GET /receivables/:id/onchain)
```

### Funding
```
POST /fundings/prepare   (Idempotency-Key!)  →  backend validates amountSbtc against
                                                 the REGISTERED funding target, builds
                                                 (uint onchainId, sBTC-token) payload
        ↓
Investor wallet signs  →  flowfi-escrow fund-receivable (sBTC; amount comes from the
                          registry record, NOT the request — overrides are rejected)
        ↓
POST /fundings/confirm   →  CONFIRMING (funding stays OPEN/PENDING)
        ↓
Indexer/mock-confirm  →  FUNDED       (poll GET /transactions/:txHash, then GET /escrows/:id)
        ↓
POST /fundings/:id/release/prepare  →  ADMIN wallet signs  →  flowfi-escrow release-funds
        ↓  (escrow → business payout; required before repayment or repay fails with u208)
POST /fundings/:id/release/confirm  →  CONFIRMING → released
```

### Repayment
```
POST /fundings/:id/repayment/prepare  →  shows released/readyToRepay gate
        ↓
Business wallet signs  →  flowfi-escrow repay-receivable (sBTC, flat == funding-amount)
        ↓
POST /fundings/:id/repayment/confirm  →  CONFIRMING (funding stays ACTIVE)
        ↓
Indexer/mock-confirm  →  REPAID
```

### Default
```
FUNDED  →  due date passes  →  POST /receivables/:id/default  →  DEFAULTED
```

### Database vs chain
Local Postgres and the chain can temporarily disagree (broadcast → confirmation lag).
`GET /receivables/:id/onchain` is the **blockchain source of truth**; the receivable
object itself is the **database view**. After every wallet broadcast, poll
`GET /transactions/:txHash` (or the on-chain endpoint) instead of assuming finality.

---

## 3. Authentication Flow (Wallet Login)

Capital Rail uses wallet signature authentication. The frontend flow is:

1. User connects wallet (e.g. Leather, Xverse, Hiro Wallet, Phantom).
2. Frontend calls `POST /auth/challenge` passing `{ "walletAddress": "SP2..." }`.
3. Backend returns `challengeId`, `nonce`, `domain`, `network`, `issuedAt`, `expiresAt`, and a `message` to sign. **The message is bound to this app and network** so a signature cannot be replayed elsewhere.
4. Frontend prompts user wallet to sign `message`.
5. Frontend sends signature to `POST /auth/verify` passing `{ challengeId, walletAddress, signature }`.
6. Backend returns `{ token, user }`. Prefer a secure `HttpOnly` cookie/session in production over long-lived JWTs in `localStorage`; if you use `localStorage`, attach the token as `Authorization: Bearer <token>`.

---

## 4. TypeScript Definitions for Frontend

Copy and paste these interfaces into your frontend project (`src/types/api.ts`):

```typescript
export type UserRole = 'BUSINESS' | 'INVESTOR';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

// Receivable lifecycle (DB view)
export type ReceivableStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'            // business-verified, awaiting on-chain registration
  | 'OPEN_FOR_FUNDING'
  | 'FUNDED'
  | 'REPAID'
  | 'DEFAULTED';

// Async registration view (returned by register/confirm, not stored on Receivable)
export type ReceivableRegistrationStatus = 'PENDING_CONFIRMATION' | 'OPEN_FOR_FUNDING';

// Funding lifecycle (use fundingStatus; status is the legacy alias).
// PENDING lives only between confirm (CONFIRMING) and indexer confirmation.
export type FundingStatus = 'PENDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED';
export type FundingLifecycle = 'OPEN' | 'FUNDED' | 'REPAID' | 'DEFAULTED';

// Transaction lifecycle
export type TransactionLifecycle =
  | 'PREPARED'
  | 'BROADCAST'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED';
export type TransactionQueryStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'DROPPED';

export type VerificationMethod =
  | 'MANUAL'
  | 'CAC'
  | 'PERSONA'
  | 'OPENCORPORATES'
  | 'PARTNER'
  | 'OTHER';

export type VerificationLevel = 'BASIC' | 'ENHANCED' | 'FULL_KYB';

export interface BusinessVerification {
  status: VerificationStatus;
  method: VerificationMethod;
  level: VerificationLevel;
  verifiedAt?: string | null;
  expiresAt?: string | null;
  verifiedBy?: string | null;
  referenceHash?: string | null;
  proofHash?: string | null;
}

export interface Debtor {
  companyName: string;
  country?: string | null;
  registrationNumber?: string | null;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  role: UserRole | null;
  profileComplete: boolean;
  businessProfile?: BusinessProfile | null;
  investorProfile?: InvestorProfile | null;
}

export interface BusinessProfile {
  id: string;
  companyName: string;
  registrationNumber?: string | null;
  website?: string | null;
  description?: string | null;
  country?: string | null;               // ISO-2, required for on-chain register-business
  onchainBusinessId?: number | null;     // registry uint id (never the cuid)
  verificationStatus: VerificationStatus; // legacy mirror, keep for compat
  verification: BusinessVerification;     // canonical verification object
  receivablesCount?: number;
  createdAt: string;
}

export interface InvestorProfile {
  id: string;
  displayName: string;
  fundingsCount?: number;
  activeFundings?: number;
  createdAt: string;
}

export interface Receivable {
  id: string;
  title: string;
  description: string;
  invoiceNumber?: string | null;
  amountUsd: string;
  dueDate: string;
  status: ReceivableStatus;
  verificationStatus: VerificationStatus; // legacy mirror
  debtor: Debtor | null;
  documentStatus: 'NONE' | 'UPLOADED';
  evidenceStatus: 'PENDING' | 'READY';
  documents?: ReceivableDocument[];
  registerTxHash: string | null;          // null until the register tx is broadcast
  businessName?: string;
  business?: {
    id: string;
    companyName: string;
    registrationNumber?: string | null;
    verificationStatus: VerificationStatus;
    verification: BusinessVerification;
  };
  funding?: {
    id: string;
    amountSbtc: string;
    status: FundingStatus;
    fundTxHash: string;
    fundedAt?: string | null;
  } | null;
  createdAt: string;
}

export interface ReceivableDocument {
  id: string;
  receivableId: string;
  filename: string;
  mimeType: string;
  size: number;
  sha256: string; // this hash (not the file) is what goes on-chain
  storageStatus: 'STORED';
}

export interface MarketplaceItem {
  id: string;
  title: string;
  businessName: string;
  amountUsd: string;
  fundedPercent: number;
  dueDate: string;
  verificationStatus: VerificationStatus;
  status: ReceivableStatus;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Wallet transaction payload. Arguments are Clarity values encoded as strings —
 * the frontend must NOT guess encoding, just pass them through to the wallet:
 *   "uint:1"  "principal:SP..."  "string-ascii:ABC"  "buff:0x..."
 * `arguments` is a deprecated alias of `functionArgs` (same values).
 * Contracts: flowfi-registry (register-business, verify-business,
 * register-receivable) and flowfi-escrow (fund-receivable, release-funds,
 * repay-receivable). Token legs always pass the sBTC SIP-010 principal, and
 * amounts always come from the registry record — never from user input.
 */
export interface StacksTransactionPayload {
  network: 'mainnet' | 'testnet';
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: string[];
  postConditionMode: 'deny' | 'allow';
  /** @deprecated use functionArgs */
  arguments: string[];
}

export interface OperationRef {
  operationId: string; // op_... links Postgres → wallet tx → txHash → indexer → final state
  expiresAt: string;
}

export interface Escrow {
  id: string; // esc_<fundingId>
  fundingId: string;
  receivableId: string;
  onchainReceivableId: number | null;
  businessName: string;
  funder: string; // investor wallet address
  amountSbtc: string;
  status: FundingLifecycle;
  fundingStatus: FundingStatus;
  fundingTxHash: string;
  released: boolean;
  releaseTxHash: string | null;
  releaseConfirmedAt: string | null;
  repaymentTxHash: string | null;
  fundedAt: string | null;
  settledAt: string | null;
  dueDate: string;
}

export type ActivityEventType =
  | 'RECEIVABLE_CREATED'
  | 'RECEIVABLE_VERIFIED'
  | 'RECEIVABLE_REGISTERED'
  | 'BUSINESS_REGISTERED'
  | 'BUSINESS_VERIFIED'
  | 'DOCUMENT_UPLOADED'
  | 'FUNDING_SUBMITTED'
  | 'FUNDED'
  | 'FUNDS_RELEASED'
  | 'REPAYMENT_SUBMITTED'
  | 'REPAID'
  | 'DEFAULTED';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  txHash: string | null; // null until a REAL Stacks tx hash exists — never a placeholder
  status: TransactionQueryStatus;
  operationId: string | null;
  blockHeight: number | null;
  confirmedAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}
```

---

## 5. Idempotency & Operations

Wallet-tx writes must survive double-clicks, reloads, and retried requests. Two mechanisms:

**`Idempotency-Key` header** — supported on:
`POST /fundings/prepare`, `POST /fundings/confirm`,
`POST /fundings/:id/repayment/prepare`, `POST /fundings/:id/repayment/confirm`,
`POST /receivables/:id/register/prepare`, `POST /receivables/:id/register/confirm`,
`POST /verification/businesses/:id/onchain/prepare`, `POST /verification/businesses/:id/onchain/confirm`.

```http
POST /v1/fundings/prepare
Idempotency-Key: 8fda12c4-... (generate a fresh UUID per user intent)
```

- Same key + same payload → the cached response is replayed, no side effects (`Idempotent-Replayed: true`).
- Same key + different payload → `422 IDEMPOTENCY_KEY_REUSE`; generate a new key.
- No header → request executes normally (backwards compatible).

**`operationId` (`op_...`)** — every `*/prepare` returns one. It links
`Postgres → wallet transaction → txHash → indexer → final state` before a tx hash
even exists. Echo it back in the matching `*/confirm` (`{ txHash, operationId }`)
so the backend can resolve the exact intent (this also fixes funding being matched
to the wrong receivable). Operations expire after ~15 minutes (`expiresAt`).

---

## 6. API Endpoints Reference

### Authentication

#### 1. Request Wallet Challenge
- **Endpoint**: `POST /v1/auth/challenge`
- **Auth Required**: No
- **UI Context**: Triggered when user clicks "Connect Wallet"
- **Request Body**:
```json
{
  "walletAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE"
}
```
- **Response (200 OK)**:
```json
{
  "challengeId": "cm7x1a2b3c4d5e6f7g8h",
  "message": "FlowFi BTC Authentication\n\nDomain: flowfi.xyz\nNetwork: testnet\nWallet: SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE\nNonce: a1b2c3d4e5f6\nIssued At: 2026-09-09T16:18:45.500Z\nExpires At: 2026-09-09T16:28:45.500Z",
  "nonce": "a1b2c3d4e5f6",
  "domain": "flowfi.xyz",
  "network": "testnet",
  "issuedAt": "2026-09-09T16:18:45.506Z",
  "expiresAt": "2026-09-09T16:28:45.500Z"
}
```

#### 2. Verify Wallet Signature & Login
- **Endpoint**: `POST /v1/auth/verify`
- **Auth Required**: No
- **UI Context**: Triggered after wallet successfully signs message
- **Request Body**:
```json
{
  "challengeId": "cm7x1a2b3c4d5e6f7g8h",
  "walletAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
  "signature": "0x4b8c9d...sig_hash"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_123456",
    "walletAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "role": "BUSINESS"
  }
}
```

#### 3. Restore User Session
- **Endpoint**: `GET /v1/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **UI Context**: Called on App load to restore session & select workspace
- **Response (200 OK)**:
```json
{
  "id": "usr_123456",
  "walletAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
  "role": "BUSINESS",
  "profileComplete": true,
  "businessProfile": {
    "id": "biz_789012",
    "companyName": "ABC Logistics Ltd",
    "verificationStatus": "VERIFIED"
  },
  "investorProfile": null
}
```

---

### Onboarding

#### 4. Select Role
- **Endpoint**: `POST /v1/onboarding`
- **Auth Required**: Yes
- **UI Context**: Role Selection Screen ("Choose Business or Investor")
- **Request Body**:
```json
{
  "role": "BUSINESS"
}
```
*(Options: `"BUSINESS"` or `"INVESTOR"`)*
- **Response (200 OK)**:
```json
{
  "user": {
    "id": "usr_123456",
    "role": "BUSINESS"
  },
  "nextStep": "CREATE_BUSINESS_PROFILE"
}
```

#### 5. Get Onboarding Status
- **Endpoint**: `GET /v1/onboarding/status`
- **Auth Required**: Yes
- **UI Context**: Routing Guard / Onboarding Wizard Step Check
- **Response (200 OK)**:
```json
{
  "role": "BUSINESS",
  "profileComplete": true,
  "verificationRequired": false,
  "verificationStatus": "PENDING",
  "nextStep": "CREATE_RECEIVABLE"
}
```

---

### Business Profiles

#### 6. Register Business Profile
- **Endpoint**: `POST /v1/businesses`
- **Auth Required**: Yes
- **UI Context**: Business Profile Creation Form
- **Request Body**:
```json
{
  "companyName": "ABC Logistics Ltd",
  "registrationNumber": "RC123456",
  "website": "https://abclogistics.com",
  "description": "Logistics company serving West Africa",
  "country": "NG"
}
```
(`country`: ISO-3166 2-letter. Optional here, but **required** before on-chain `register-business` — pass it now or later via `PATCH /businesses/me` or the register-prepare body.)
- **Response (201 Created)**:
```json
{
  "id": "biz_789012",
  "companyName": "ABC Logistics Ltd",
  "registrationNumber": "RC123456",
  "country": "NG",
  "onchainBusinessId": null,
  "verificationStatus": "PENDING",
  "verification": {
    "status": "PENDING",
    "method": "MANUAL",
    "level": "BASIC",
    "verifiedAt": null,
    "expiresAt": null,
    "verifiedBy": null,
    "referenceHash": null,
    "proofHash": null
  },
  "createdAt": "2026-09-07T10:20:00.000Z"
}
```

#### 7. Get My Business Profile
- **Endpoint**: `GET /v1/businesses/me`
- **Auth Required**: Yes
- **UI Context**: Business Settings / Profile Page
- **Response (200 OK)**:
```json
{
  "id": "biz_789012",
  "companyName": "ABC Logistics Ltd",
  "registrationNumber": "RC123456",
  "website": "https://abclogistics.com",
  "description": "Logistics company serving West Africa",
  "country": "NG",
  "onchainBusinessId": 1,
  "verificationStatus": "PENDING",
  "verification": {
    "status": "PENDING",
    "method": "MANUAL",
    "level": "BASIC",
    "verifiedAt": null,
    "expiresAt": null,
    "verifiedBy": null,
    "referenceHash": null,
    "proofHash": null
  },
  "receivablesCount": 3,
  "createdAt": "2026-09-07T10:20:00.000Z"
}
```

#### 8. Update Business Profile
- **Endpoint**: `PATCH /v1/businesses/me`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "website": "https://abc-logistics-group.com",
  "description": "Updated company description",
  "country": "NG"
}
```
- **Response (200 OK)**:
```json
{
  "id": "biz_789012",
  "companyName": "ABC Logistics Ltd",
  "registrationNumber": "RC123456",
  "website": "https://abc-logistics-group.com",
  "description": "Updated company description",
  "country": "NG",
  "onchainBusinessId": 1,
  "verificationStatus": "PENDING",
  "verification": {
    "status": "PENDING",
    "method": "MANUAL",
    "level": "BASIC",
    "verifiedAt": null,
    "expiresAt": null,
    "verifiedBy": null,
    "referenceHash": null,
    "proofHash": null
  },
  "updatedAt": "2026-09-07T10:25:00.000Z"
}
```

---

### Investor Profiles

#### 9. Register Investor Profile
- **Endpoint**: `POST /v1/investors`
- **Auth Required**: Yes
- **UI Context**: Capital Provider Profile Creation Form
- **Request Body**:
```json
{
  "displayName": "Prudence Capital"
}
```
- **Response (201 Created)**:
```json
{
  "id": "inv_987654",
  "userId": "usr_123456",
  "displayName": "Prudence Capital",
  "createdAt": "2026-09-07T10:22:00.000Z"
}
```

#### 10. Get My Investor Profile
- **Endpoint**: `GET /v1/investors/me`
- **Auth Required**: Yes
- **UI Context**: Investor Settings / Dashboard Summary
- **Response (200 OK)**:
```json
{
  "id": "inv_987654",
  "displayName": "Prudence Capital",
  "fundingsCount": 2,
  "activeFundings": 1,
  "createdAt": "2026-09-07T10:22:00.000Z"
}
```

---

### Receivables Management

#### 11. Submit Receivable (Invoice)
- **Endpoint**: `POST /v1/receivables`
- **Auth Required**: Yes (`BUSINESS` role required)
- **UI Context**: "Submit Receivable" Modal / Form (collects debtor fields + invoice file separately)
- **Request Body**:
```json
{
  "title": "Invoice INV-2041",
  "description": "Logistics services provided to XYZ Corp",
  "invoiceNumber": "INV-2041",
  "amountUsd": 10000,
  "dueDate": "2026-10-20T00:00:00.000Z",
  "debtor": {
    "companyName": "XYZ Corp",
    "country": "NG",
    "registrationNumber": "RC654321"
  }
}
```
(`debtor` is optional but recommended — the UI already collects it.)
- **Response (201 Created)**:
```json
{
  "id": "rec_112233",
  "title": "Invoice INV-2041",
  "description": "Logistics services provided to XYZ Corp",
  "invoiceNumber": "INV-2041",
  "amountUsd": "10000",
  "dueDate": "2026-10-20T00:00:00.000Z",
  "status": "VERIFIED",
  "verificationStatus": "VERIFIED",
  "debtor": {
    "companyName": "XYZ Corp",
    "country": "NG",
    "registrationNumber": "RC654321"
  },
  "documentStatus": "NONE",
  "evidenceStatus": "PENDING",
  "registerTxHash": null,
  "createdAt": "2026-09-07T10:28:00.000Z"
}
```
> Lifecycle note: a new receivable is an **off-chain record only**. `status` is
> `VERIFIED` when the business is verified (meaning "business-verified, awaiting
> on-chain registration"), otherwise `DRAFT`. It becomes `OPEN_FOR_FUNDING` via
> [register prepare + confirm](#receivable-on-chain-registration), never directly.

#### 12. Get My Receivables
- **Endpoint**: `GET /v1/receivables/me?page=1&limit=20`
- **Auth Required**: Yes (`BUSINESS` role required)
- **UI Context**: Business Receivables Dashboard Page
- **Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "rec_112233",
      "title": "Invoice INV-2041",
      "description": "Logistics services provided to XYZ Corp",
      "invoiceNumber": "INV-2041",
      "amountUsd": "10000",
      "dueDate": "2026-10-20T00:00:00.000Z",
      "status": "OPEN_FOR_FUNDING",
      "verificationStatus": "VERIFIED",
      "debtor": {
        "companyName": "XYZ Corp",
        "country": "NG",
        "registrationNumber": "RC654321"
      },
      "documentStatus": "UPLOADED",
      "evidenceStatus": "READY",
      "registerTxHash": "0xabc123...",
      "createdAt": "2026-09-07T10:28:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### 13. Get Receivable Details
- **Endpoint**: `GET /v1/receivables/:id`
- **Auth Required**: No (Public page)
- **UI Context**: Opportunity Detail Page
- **Response (200 OK)**:
```json
{
  "id": "rec_112233",
  "title": "Invoice INV-2041",
  "description": "Logistics services provided to XYZ Corp",
  "invoiceNumber": "INV-2041",
  "amountUsd": "10000",
  "dueDate": "2026-10-20T00:00:00.000Z",
  "status": "OPEN_FOR_FUNDING",
  "verificationStatus": "VERIFIED",
  "debtor": {
    "companyName": "XYZ Corp",
    "country": "NG",
    "registrationNumber": "RC654321"
  },
  "documentStatus": "UPLOADED",
  "evidenceStatus": "READY",
  "documents": [
    {
      "id": "doc_abc123",
      "filename": "invoice.pdf",
      "mimeType": "application/pdf",
      "size": 1458123,
      "sha256": "8c2b4f...",
      "storageStatus": "STORED",
      "createdAt": "2026-09-07T10:29:00.000Z"
    }
  ],
  "registerTxHash": "0xabc123...",
  "business": {
    "id": "biz_789012",
    "companyName": "ABC Logistics Ltd",
    "registrationNumber": "RC123456",
    "verificationStatus": "VERIFIED",
    "verification": {
      "status": "VERIFIED",
      "method": "MANUAL",
      "level": "BASIC",
      "verifiedAt": "2026-09-07T09:00:00.000Z",
      "expiresAt": null,
      "verifiedBy": null,
      "referenceHash": null,
      "proofHash": null
    }
  },
  "verification": {
    "business": "VERIFIED",
    "receivable": "VERIFIED",
    "details": {
      "id": "ver_445566",
      "method": "PILOT_REVIEW",
      "status": "VERIFIED",
      "notes": "Verified against invoice and bill of lading",
      "verifiedAt": "2026-09-07T11:00:00.000Z"
    }
  },
  "funding": null,
  "createdAt": "2026-09-07T10:28:00.000Z"
}
```

#### 14. Update Receivable (Pre-Registration Corrections)
- **Endpoint**: `PATCH /v1/receivables/:id`
- **Auth Required**: Yes (`BUSINESS` role, must own the receivable; only while unregistered)
- **UI Context**: Fix debtor / invoice / due-date details before `register/prepare` — the contract has no optional fields, so this is how you satisfy `DEBTOR_COUNTRY_REQUIRED`, `INVOICE_NUMBER_REQUIRED`, etc.
- **Request Body** (any subset):
```json
{
  "invoiceNumber": "INV-2041",
  "dueDate": "2026-10-20T00:00:00.000Z",
  "debtor": {
    "companyName": "XYZ Corp",
    "country": "NG",
    "registrationNumber": "RC654321"
  }
}
```
- **Response (200 OK)**: the full receivable detail object (same shape as [Get Receivable Details](#13-get-receivable-details)).

#### 15. Flag Receivable as Defaulted
- **Endpoint**: `POST /v1/receivables/:id/default`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "reason": "Receivable was not repaid past 30 days due date"
}
```
- **Response (200 OK)**:
```json
{
  "receivableId": "rec_112233",
  "status": "DEFAULTED",
  "reason": "Receivable was not repaid past 30 days due date",
  "transaction": {
    "status": "CONFIRMED",
    "txHash": "def_tx_rec_112233_1757245000000"
  }
}
```

---

### Receivable On-Chain Registration

This is the second step after `POST /receivables` (which only creates the off-chain
record). The backend checks business ownership, requires business `VERIFIED`
(MVP: verification does not expire), requires the receivable to be unregistered
(`DRAFT`/`PENDING_VERIFICATION`/`VERIFIED`), then builds the **exact**
`flowfi-registry` `register-receivable` transaction for the business wallet to sign.

#### 16. Prepare Receivable Registration
- **Endpoint**: `POST /v1/receivables/:id/register/prepare`
- **Auth Required**: Yes (`BUSINESS` role, must own the receivable)
- **Idempotency**: `Idempotency-Key` supported
- **UI Context**: "Register on-chain" button on the receivable detail page
- **Request Body**: none (`{}`)
- **Response (200 OK)**:
```json
{
  "operationId": "op_mf2d7a1b9c3e4f",
  "receivableId": "rec_112233",
  "businessId": "biz_789012",
  "onchainBusinessId": 1,
  "debtor": {
    "companyName": "XYZ Corp",
    "country": "NG",
    "registrationNumber": "RC654321"
  },
  "invoiceNumber": "INV-2041",
  "documentHash": "8c2b4f...",
  "amounts": {
    "faceValueUnits": "1000000",
    "fundingAmountUnits": "1000000",
    "unit": "MVP: USD cents. Mainnet: oracle-quoted sBTC base units."
  },
  "dates": {
    "issueBurnHeight": 900000,
    "dueBurnHeight": 906120,
    "heightEstimated": false
  },
  "transaction": {
    "network": "testnet",
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "flowfi-registry",
    "functionName": "register-receivable",
    "functionArgs": [
      "uint:1",
      "string-ascii:XYZ Corp",
      "string-ascii:NG",
      "string-ascii:INV-2041",
      "buff:0x8c2b4f...",
      "uint:1000000",
      "uint:1000000",
      "uint:900000",
      "uint:906120"
    ],
    "arguments": ["uint:1", "string-ascii:XYZ Corp", "string-ascii:NG", "string-ascii:INV-2041", "buff:0x8c2b4f...", "uint:1000000", "uint:1000000", "uint:900000", "uint:906120"],
    "postConditionMode": "deny"
  },
  "expiresAt": "2026-09-09T17:00:00.000Z"
}
```
> Exact contract mapping — `(business-id uint)` `(debtor-name (string-ascii 100))`
> `(debtor-country (string-ascii 2))` `(invoice-number (string-ascii 100))`
> `(invoice-hash (buff 32))` `(face-value uint)` `(funding-amount uint)`
> `(issue-date uint)` `(due-date uint)`:
> - `business-id` is the **on-chain uint** from the earlier `register-business` step — `rec_xxx`/`biz_xxx` never enter Clarity.
> - `functionArgs` are Clarity values — pass them straight to the wallet, don't re-encode. `arguments` is the same array under its legacy name.
> - Dates are **burn-block heights** (`~144 Bitcoin blocks/day`), never unix timestamps. Set `BITCOIN_TIP_HEIGHT` for exact heights; otherwise the backend estimates and flags `heightEstimated: true`.
> - `invoice-hash` is the uploaded invoice SHA-256 (exactly 32 bytes). Upload first — `DOCUMENT_REQUIRED` otherwise.
> - `funding-amount` = `face-value` (full funding) in MVP protocol units.
> - Strict prerequisites with fix guidance: `BUSINESS_NOT_ONCHAIN` (register the business first), `DEBTOR_REQUIRED` / `DEBTOR_COUNTRY_REQUIRED` (ISO-2, fix via `PATCH /receivables/:id`), `INVOICE_NUMBER_REQUIRED`, `DOCUMENT_REQUIRED`, `DUE_DATE_NOT_FUTURE`.
> - **Errors**: `403 BUSINESS_NOT_VERIFIED` (verify the business first), `403 FORBIDDEN` (not the owner), `400 ALREADY_REGISTERED`.

#### 17. Confirm Receivable Registration Broadcast
- **Endpoint**: `POST /v1/receivables/:id/register/confirm`
- **Auth Required**: Yes (`BUSINESS` role, must own the receivable)
- **Idempotency**: `Idempotency-Key` supported; replaying the same `txHash` is safe
- **UI Context**: Called right after the wallet broadcasts the register transaction
- **Request Body**:
```json
{
  "txHash": "0xabc123...",
  "operationId": "op_mf2d7a1b9c3e4f",
  "onchainReceivableId": 1
}
```
(`operationId` optional but recommended — it must match the prepare step. `onchainReceivableId`: the `uint` id from the tx result (`ok <id>`); supply it here once known, or let the indexer attach it later by replaying the same `txHash` with the id.)
- **Response (200 OK)**:
```json
{
  "receivableId": "rec_112233",
  "operationId": "op_mf2d7a1b9c3e4f",
  "onchainReceivableId": 1,
  "transaction": {
    "txHash": "0xabc123...",
    "status": "PENDING"
  },
  "status": "PENDING_CONFIRMATION",
  "poll": "/v1/transactions/0xabc123..."
}
```
> Deliberately **not** `OPEN_FOR_FUNDING` — the transaction may still fail.
> Poll `GET /transactions/:txHash` (or `GET /receivables/:id/onchain`).
> MVP: a mock confirmer advances the receivable to `OPEN_FOR_FUNDING` ~30s after
> confirm (configure with `MOCK_CONFIRM_DELAY_MS`; `0` disables it and a real
> Stacks indexer owns confirmation).

---

### Invoice Documents

The UI uploads a PDF/image, but only the **SHA-256 goes on-chain** — never the file.

#### 18. Upload Invoice Document
- **Endpoint**: `POST /v1/receivables/:id/documents`
- **Auth Required**: Yes (`BUSINESS` role, must own the receivable)
- **UI Context**: Invoice file picker in the "Submit Receivable" / detail flow
- **Request**: `multipart/form-data` with field **`file`** (PDF/JPEG/PNG/WebP, default max 10 MB)
- **Response (201 Created)**:
```json
{
  "id": "doc_abc123",
  "receivableId": "rec_112233",
  "filename": "invoice.pdf",
  "mimeType": "application/pdf",
  "size": 1458123,
  "sha256": "8c2b4f...",
  "storageStatus": "STORED"
}
```
- **Errors**: `413 FILE_TOO_LARGE`, `422 UNSUPPORTED_FILE_TYPE`, `422` when `file` is missing.

---

### Blockchain State & Activity

#### 19. Get Receivable On-Chain State (source of truth)
- **Endpoint**: `GET /v1/receivables/:id/onchain`
- **Auth Required**: No
- **UI Context**: "On-chain status" badge next to the DB status; use this to resolve DB-vs-chain disagreement
- **Response (200 OK)**:
```json
{
  "receivableId": "rec_112233",
  "registry": {
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "flowfi-registry",
    "registered": true,
    "status": "OPEN_FOR_FUNDING",
    "businessId": "biz_789012",
    "onchainBusinessId": 1,
    "onchainReceivableId": 1,
    "registerTxHash": "0xabc123...",
    "lastSyncedBlock": 142100
  }
}
```
(`status` is `NOT_REGISTERED` before registration, `PENDING_CONFIRMATION` while the register tx is unconfirmed. `onchainBusinessId` / `onchainReceivableId` are the registry `uint` ids — the backend ids are kept separate and never enter Clarity.)

#### 20. Get Receivable Public Activity Timeline
- **Endpoint**: `GET /v1/receivables/:id/activity`
- **Auth Required**: No (Public page)
- **UI Context**: Receivable Transparency & On-Chain Audit Timeline Component
- **Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "evt_1",
      "type": "RECEIVABLE_CREATED",
      "txHash": null,
      "status": "PENDING",
      "operationId": null,
      "blockHeight": null,
      "confirmedAt": null,
      "createdAt": "2026-09-07T10:28:00.000Z",
      "metadata": {
        "title": "Invoice INV-2041",
        "amountUsd": "10000"
      }
    },
    {
      "id": "evt_2",
      "type": "RECEIVABLE_REGISTERED",
      "txHash": "0xabc123...",
      "status": "CONFIRMED",
      "operationId": "op_mf2d7a1b9c3e4f",
      "blockHeight": 142100,
      "confirmedAt": "2026-09-09T16:20:00.000Z",
      "createdAt": "2026-09-09T16:19:00.000Z",
      "metadata": {
        "businessId": "biz_789012"
      }
    }
  ]
}
```
> `txHash` is `null` until a **real** Stacks transaction exists — off-chain
> placeholders are never presented as chain proofs. Event types:
> `RECEIVABLE_CREATED`, `RECEIVABLE_VERIFIED`, `RECEIVABLE_REGISTERED`,
> `BUSINESS_REGISTERED`, `BUSINESS_VERIFIED`, `DOCUMENT_UPLOADED`,
> `FUNDING_SUBMITTED`, `FUNDED`, `FUNDS_RELEASED`, `REPAYMENT_SUBMITTED`,
> `REPAID`, `DEFAULTED`.

---

### Marketplace

#### 21. List Public Marketplace Receivables
- **Endpoint**: `GET /v1/marketplace/receivables?status=OPEN_FOR_FUNDING&page=1&limit=20&search=logistics`
- **Auth Required**: No
- **UI Context**: "Explore Receivables" Marketplace Grid / Table (filter `status=OPEN_FOR_FUNDING` for registered-only listings)
- **Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "rec_112233",
      "title": "Invoice INV-2041",
      "businessName": "ABC Logistics Ltd",
      "amountUsd": "10000",
      "fundedPercent": 0,
      "dueDate": "2026-10-20T00:00:00.000Z",
      "verificationStatus": "VERIFIED",
      "status": "OPEN_FOR_FUNDING",
      "createdAt": "2026-09-07T10:28:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### Verification (Business-Level)

Verification is **one-time at the business level**. Receivables do not need separate
manual verification: Verified Business + Invoice Evidence + On-chain Registration =
receivable available for funding. `verificationStatus` on Business/Receivable is a
legacy mirror; the canonical object is `verification: BusinessVerification`
(`status`, `method: MANUAL|CAC|PERSONA|OPENCORPORATES|PARTNER|OTHER`,
`level: BASIC|ENHANCED|FULL_KYB`, `verifiedAt`, `expiresAt`, `verifiedBy`,
`referenceHash`, `proofHash`).

#### 22. Start Business Verification
- **Endpoint**: `POST /v1/verification/businesses/:businessId/start`
- **Auth Required**: Yes (must own the business)
- **Request Body**:
```json
{
  "method": "MANUAL",
  "level": "BASIC",
  "notes": "CAC docs received"
}
```
- **Response (201 Created)**:
```json
{
  "id": "ver_abc123",
  "businessId": "biz_789012",
  "status": "PENDING",
  "method": "MANUAL",
  "level": "BASIC"
}
```

#### 23. Get Business Verification
- **Endpoint**: `GET /v1/verification/businesses/:businessId`
- **Auth Required**: No
- **Response (200 OK)**:
```json
{
  "id": "ver_abc123",
  "businessId": "biz_789012",
  "onchainBusinessId": 1,
  "country": "NG",
  "verification": {
    "status": "VERIFIED",
    "method": "MANUAL",
    "level": "BASIC",
    "verifiedAt": "2026-09-07T09:00:00.000Z",
    "expiresAt": null,
    "verifiedBy": "verifier@flowfi.xyz",
    "referenceHash": null,
    "proofHash": "9f1c..."
  }
}
```

#### 24. Complete Business Verification
- **Endpoint**: `POST /v1/verification/businesses/:businessId/complete`
- **Auth Required**: Yes (BUSINESS session of the owner — MVP pilot flow; production will restrict this to a verifier/admin role. This is the OFF-chain review; the on-chain attestation below is a separate VERIFIER step.)
- **UI Context**: Verifier review screen
- **Request Body**:
```json
{
  "status": "VERIFIED",
  "notes": "Verified business documentation and CAC certificate",
  "verifiedBy": "verifier@flowfi.xyz",
  "method": "MANUAL",
  "level": "BASIC",
  "referenceHash": "cac-ref-001",
  "proofHash": "9f1c..."
}
```
- **Response (200 OK)**:
```json
{
  "id": "ver_abc123",
  "businessId": "biz_789012",
  "status": "VERIFIED",
  "verification": {
    "status": "VERIFIED",
    "method": "MANUAL",
    "level": "BASIC",
    "verifiedAt": "2026-09-07T09:00:00.000Z",
    "expiresAt": null,
    "verifiedBy": "verifier@flowfi.xyz",
    "referenceHash": "cac-ref-001",
    "proofHash": "9f1c..."
  },
  "verifiedAt": "2026-09-07T09:00:00.000Z"
}
```
On `VERIFIED`, the business's `DRAFT` receivables cascade to business-verified (`VERIFIED` status — still requiring on-chain registration before funding).

---

### Verification On-Chain Attestation

Off-chain verification → on-chain identity → `flowfi-registry` attestation.
Architecture rule: the **business wallet owns the business and registers it**,
but a **verifier/admin wallet verifies it** — the business must never call
`verify-business()` on itself (the chain enforces `tx-sender == verifier`, `u100` otherwise).

Identity split in this API (no contradiction):
- **Business session** → off-chain start/complete + `register-business` prepare/confirm.
- **Verifier session** (`VERIFIER_WALLETS` allowlist) → `verify-business` prepare/confirm. Anything else gets `403 VERIFIER_FORBIDDEN`.

#### 25. Prepare Business Registration
- **Endpoint**: `POST /v1/verification/businesses/:id/onchain/register/prepare`
- **Auth Required**: Yes (BUSINESS session, must own the business — the signer becomes the on-chain owner)
- **Idempotency**: `Idempotency-Key` supported
- **Request Body** (optional; required when the profile has no country stored):
```json
{
  "country": "NG"
}
```
- **Response (200 OK)**:
```json
{
  "operationId": "op_mf2d7a33bb44c",
  "businessId": "biz_789012",
  "businessName": "ABC Logistics Ltd",
  "country": "NG",
  "transaction": {
    "network": "testnet",
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "flowfi-registry",
    "functionName": "register-business",
    "functionArgs": ["string-ascii:ABC Logistics Ltd", "string-ascii:NG"],
    "arguments": ["string-ascii:ABC Logistics Ltd", "string-ascii:NG"],
    "postConditionMode": "deny"
  },
  "expiresAt": "2026-09-09T17:00:00.000Z"
}
```
> Exact `register-business` params: `(business-name (string-ascii 100))` `(country (string-ascii 2))`. One business per wallet (`u102` if already registered).

#### 26. Confirm Business Registration Broadcast
- **Endpoint**: `POST /v1/verification/businesses/:id/onchain/register/confirm`
- **Auth Required**: Yes (BUSINESS session, must own the business)
- **Idempotency**: `Idempotency-Key` supported
- **Request Body**:
```json
{
  "txHash": "0xabc123...",
  "operationId": "op_mf2d7a33bb44c",
  "onchainBusinessId": 1
}
```
(`onchainBusinessId`: the `uint` id from the tx result (`ok <id>`); supply it once known, or let the indexer attach it later by replaying the same `txHash`.)
- **Response (200 OK)**:
```json
{
  "businessId": "biz_789012",
  "operationId": "op_mf2d7a33bb44c",
  "onchainBusinessId": 1,
  "transaction": {
    "txHash": "0xabc123...",
    "status": "PENDING"
  },
  "status": "PENDING_CONFIRMATION",
  "poll": "/v1/transactions/0xabc123..."
}
```

#### 27. Prepare Business Attestation
- **Endpoint**: `POST /v1/verification/businesses/:id/onchain/prepare`
- **Auth Required**: Yes (**VERIFIER session** — must be listed in backend `VERIFIER_WALLETS`; business sessions get `403 VERIFIER_FORBIDDEN`. Requires business `VERIFIED` off-chain AND registered on-chain.)
- **Idempotency**: `Idempotency-Key` supported
- **Request Body** (optional):
```json
{
  "verificationExpiry": 0,
  "referenceHash": "0x9f1c..."
}
```
(`verificationExpiry`: burn-block height, `0` = never expires. `referenceHash`: 32-byte hex, else derived.)
- **Response (200 OK)**:
```json
{
  "operationId": "op_mf2d7a55aa11b",
  "businessId": "biz_789012",
  "onchainBusinessId": 1,
  "signerRole": "VERIFIER",
  "mustBeSignedBy": "A verifier/admin wallet from VERIFIER_WALLETS (registry tx-sender == verifier). The business wallet will be rejected with u100.",
  "parameters": {
    "businessId": 1,
    "verificationMethod": "MANUAL (0)",
    "verificationLevel": "BASIC (1)",
    "verificationExpiry": 0,
    "verifiedBy": "SP2V...VERIFIER"
  },
  "transaction": {
    "network": "testnet",
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "flowfi-registry",
    "functionName": "verify-business",
    "functionArgs": ["uint:1", "uint:0", "uint:1", "uint:0", "principal:SP2V...VERIFIER", "buff:0x9f1c...", "buff:0xaabb..."],
    "arguments": ["uint:1", "uint:0", "uint:1", "uint:0", "principal:SP2V...VERIFIER", "buff:0x9f1c...", "buff:0xaabb..."],
    "postConditionMode": "deny"
  },
  "expiresAt": "2026-09-09T17:00:00.000Z"
}
```
> Exact `verify-business` params: `(business-id uint)` `(verification-method uint 0–5: MANUAL/CAC/PERSONA/OPENCORPORATES/PARTNER/OTHER)` `(verification-level uint 0–3: NONE/BASIC/ENHANCED/FULL_KYB)` `(verification-expiry uint burn height, u0 = never)` `(verified-by principal = the signing verifier wallet)` `(verification-reference-hash (buff 32))` `(verification-proof-hash (buff 32))`.

#### 28. Confirm Business Attestation Broadcast
- **Endpoint**: `POST /v1/verification/businesses/:id/onchain/confirm`
- **Auth Required**: Yes (**VERIFIER session**)
- **Idempotency**: `Idempotency-Key` supported
- **Request Body**:
```json
{
  "txHash": "0xdef456...",
  "operationId": "op_mf2d7a55aa11b"
}
```
- **Response (200 OK)**:
```json
{
  "businessId": "biz_789012",
  "operationId": "op_mf2d7a55aa11b",
  "signerRole": "VERIFIER",
  "transaction": {
    "txHash": "0xdef456...",
    "status": "PENDING"
  },
  "status": "PENDING_CONFIRMATION",
  "poll": "/v1/transactions/0xdef456...",
  "note": "Submit verify-business from a verifier/admin wallet, not the business wallet."
}
```

---

### sBTC Funding

`flowfi-escrow` `fund-receivable` takes `(receivable-id uint)` + the sBTC token —
**the amount is not an argument**. Escrow reads `funding-amount` from the registry
record, so nobody can under/over-fund via the frontend. The API's `amountSbtc` is a
*request* the backend validates against the registered target (`FUNDING_AMOUNT_MISMATCH`
otherwise). Only `OPEN_FOR_FUNDING` receivables can be funded (the chain would reject
with `u203`).

#### 29. Prepare Funding Transaction
- **Endpoint**: `POST /v1/fundings/prepare`
- **Auth Required**: Yes (`INVESTOR` role)
- **Idempotency**: `Idempotency-Key` supported (send one per click)
- **UI Context**: Triggered when Capital Provider clicks "Fund Opportunity"
- **Request Body**:
```json
{
  "receivableId": "rec_112233",
  "amountSbtc": "0.01"
}
```
- **Response (200 OK)**:
```json
{
  "fundingId": "fund_1757245000000",
  "operationId": "op_mf2d7a77cc22d",
  "receivableId": "rec_112233",
  "onchainReceivableId": 1,
  "fundingAmount": {
    "units": "1000000",
    "sats": "1000000",
    "sbtc": "0.01"
  },
  "amountSbtc": "0.01",
  "transaction": {
    "network": "testnet",
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "flowfi-escrow",
    "functionName": "fund-receivable",
    "functionArgs": ["uint:1", "principal:ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"],
    "arguments": ["uint:1", "principal:ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"],
    "postConditionMode": "deny"
  },
  "expiresAt": "2026-09-09T17:00:00.000Z"
}
```
> `fundingAmount` is authoritative (backend-derived from the registered target:
> `units × SATS_PER_UNIT` → sats → sBTC). The token principal is the canonical
> sBTC contract per network (`SBTC_CONTRACT` override for simnet mock token).
> The wallet also needs a post-condition sending exactly `fundingAmount.sats`.

#### 30. Confirm Funding Broadcast
- **Endpoint**: `POST /v1/fundings/confirm`
- **Auth Required**: Yes (`INVESTOR` role)
- **Idempotency**: `Idempotency-Key` supported
- **UI Context**: Triggered right after wallet returns the transaction hash
- **Request Body**:
```json
{
  "fundingId": "fund_1757245000000",
  "txHash": "0x8f2a1c9e...broadcasted_hash",
  "operationId": "op_mf2d7a77cc22d"
}
```
(`operationId` optional but recommended — the backend resolves the exact receivable from it instead of guessing.)
- **Response (200 OK)**:
```json
{
  "id": "fund_778899",
  "fundingId": "fund_778899",
  "status": "PENDING",
  "fundingStatus": "OPEN",
  "operationId": "op_mf2d7a77cc22d",
  "transaction": {
    "txHash": "0x8f2a1c9e...broadcasted_hash",
    "status": "CONFIRMING"
  },
  "txHash": "0x8f2a1c9e...broadcasted_hash",
  "fundedAt": null,
  "poll": "/v1/transactions/0x8f2a1c9e...broadcasted_hash"
}
```
> Confirm only records the broadcast (`FUNDING_SUBMITTED`). **Nothing is marked
> funded here** — the indexer (MVP: mock confirmer after `MOCK_CONFIRM_DELAY_MS`)
> flips funding `PENDING → ACTIVE`, receivable `→ FUNDED`, and the event to
> `CONFIRMED`. Poll `poll`, then `GET /escrows/:id`. Replaying the same `txHash`
> returns the live view (idempotent).

#### 31. Get My Fundings (Investor Portfolio)
- **Endpoint**: `GET /v1/fundings/me`
- **Auth Required**: Yes (`INVESTOR` role)
- **UI Context**: "My Fundings" Dashboard Page
- **Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "fund_778899",
      "receivableId": "rec_112233",
      "businessName": "ABC Logistics Ltd",
      "amountSbtc": "0.15",
      "status": "ACTIVE",
      "fundingStatus": "ACTIVE",
      "fundedAt": "2026-09-07T12:00:00.000Z",
      "dueDate": "2026-10-20T00:00:00.000Z"
    }
  ]
}
```

#### 32. Get Funding Tracking Details
- **Endpoint**: `GET /v1/fundings/:id`
- **Auth Required**: Yes
- **UI Context**: Funding Tracking & Proof Detail Page
- **Response (200 OK)**:
```json
{
  "id": "fund_778899",
  "amountSbtc": "0.15",
  "status": "ACTIVE",
  "fundingStatus": "ACTIVE",
  "receivable": {
    "id": "rec_112233",
    "title": "Invoice INV-2041",
    "amountUsd": "10000",
    "dueDate": "2026-10-20T00:00:00.000Z"
  },
  "business": {
    "companyName": "ABC Logistics Ltd"
  },
  "transactions": [
    {
      "type": "FUNDING_SUBMITTED",
      "txHash": "0x8f2a1c9e...broadcasted_hash",
      "status": "CONFIRMING",
      "confirmedAt": null
    },
    {
      "type": "FUNDED",
      "txHash": "0x8f2a1c9e...broadcasted_hash",
      "status": "CONFIRMED",
      "confirmedAt": "2026-09-07T12:00:00.000Z"
    }
  ]
}
```

---

### Release Leg (Escrow → Business)

Funding escrows sBTC in `flowfi-escrow`; a separate admin `release-funds` call pays
it out to the business. **Repayment is impossible before release confirms**
(`repay-receivable` fails with `u208`).

#### 33. Prepare Release Transaction
- **Endpoint**: `POST /v1/fundings/:id/release/prepare`
- **Auth Required**: Yes (any session may prepare; **broadcast must come from the escrow ADMIN wallet** or the tx fails with `u200` — the recipient is fixed on-chain to the business regardless of caller)
- **Idempotency**: `Idempotency-Key` supported
- **UI Context**: Admin/compliance release screen after off-chain checks pass
- **Response (200 OK)**:
```json
{
  "fundingId": "fund_778899",
  "operationId": "op_mf2d7abb11cc",
  "onchainReceivableId": 1,
  "signerRole": "ADMIN",
  "mustBeSignedBy": "The escrow admin wallet (contract rejects non-admin with u200). Recipient is fixed on-chain to the business.",
  "transaction": {
    "network": "testnet",
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "flowfi-escrow",
    "functionName": "release-funds",
    "functionArgs": ["uint:1", "principal:ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"],
    "arguments": ["uint:1", "principal:ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"],
    "postConditionMode": "deny"
  },
  "expiresAt": "2026-09-09T17:00:00.000Z"
}
```

#### 34. Confirm Release Broadcast
- **Endpoint**: `POST /v1/fundings/:id/release/confirm`
- **Auth Required**: Yes
- **Idempotency**: `Idempotency-Key` supported
- **Request Body**:
```json
{
  "txHash": "0x9a8b7c...release_tx_hash",
  "operationId": "op_mf2d7abb11cc"
}
```
- **Response (200 OK)**:
```json
{
  "fundingId": "fund_778899",
  "operationId": "op_mf2d7abb11cc",
  "transaction": {
    "txHash": "0x9a8b7c...release_tx_hash",
    "status": "CONFIRMING"
  },
  "released": false,
  "releaseTxHash": "0x9a8b7c...release_tx_hash",
  "poll": "/v1/transactions/0x9a8b7c...release_tx_hash"
}
```
(`released` flips to `true` once the indexer confirms; `GET /escrows/:id` and repayment-prepare read it.)

---

### sBTC Repayment & Settlement

MVP repayment is flat (== funding-amount; no interest field on-chain yet).

#### 35. Prepare Repayment Transaction
- **Endpoint**: `POST /v1/fundings/:id/repayment/prepare`
- **Auth Required**: Yes (`BUSINESS` role)
- **Idempotency**: `Idempotency-Key` supported
- **UI Context**: Triggered when business clicks "Repay Receivable"
- **Response (200 OK)**:
```json
{
  "fundingId": "fund_778899",
  "operationId": "op_mf2d7a99dd44e",
  "onchainReceivableId": 1,
  "amountSbtc": "0.01",
  "released": true,
  "releaseTxHash": "0x9a8b7c...release_tx_hash",
  "readyToRepay": true,
  "transaction": {
    "network": "testnet",
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "flowfi-escrow",
    "functionName": "repay-receivable",
    "functionArgs": ["uint:1", "principal:ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"],
    "arguments": ["uint:1", "principal:ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"],
    "postConditionMode": "deny"
  },
  "expiresAt": "2026-09-09T17:00:00.000Z"
}
```
> Gate: `repay-receivable` requires prior `release-funds` (`u208`) and
> `tx-sender == business` (`u209`). If `readyToRepay` is `false`, the response
> carries a `warning` — run the [release leg](#release-leg-escrow--business) first.

#### 36. Confirm Repayment Broadcast
- **Endpoint**: `POST /v1/fundings/:id/repayment/confirm`
- **Auth Required**: Yes (`BUSINESS` role)
- **Idempotency**: `Idempotency-Key` supported
- **Request Body**:
```json
{
  "txHash": "0x3e4f5a6b...repay_tx_hash",
  "operationId": "op_mf2d7a99dd44e"
}
```
- **Response (200 OK)**:
```json
{
  "fundingId": "fund_778899",
  "status": "ACTIVE",
  "fundingStatus": "ACTIVE",
  "operationId": "op_mf2d7a99dd44e",
  "transaction": {
    "txHash": "0x3e4f5a6b...repay_tx_hash",
    "status": "CONFIRMING"
  },
  "txHash": "0x3e4f5a6b...repay_tx_hash",
  "settledAt": null,
  "poll": "/v1/transactions/0x3e4f5a6b...repay_tx_hash"
}
```
> Funding deliberately stays `ACTIVE` here — only the indexer (MVP: mock
> confirmer) flips it to `REPAID` on chain confirmation. This is the same
> PREPARE → WALLET → BROADCAST → CONFIRMING → INDEXER → CONFIRMED pattern as
> registration and funding.

---

### Escrows

#### 37. Get Escrow Details
- **Endpoint**: `GET /v1/escrows/:id`
- **Auth Required**: Yes
- **UI Context**: Transparent funding detail page (`:id` accepts `esc_<fundingId>` or the raw funding id)
- **Response (200 OK)**:
```json
{
  "id": "esc_001",
  "fundingId": "fund_778899",
  "receivableId": "rec_112233",
  "onchainReceivableId": 1,
  "businessName": "ABC Logistics Ltd",
  "funder": "SP...",
  "amountSbtc": "0.01",
  "status": "FUNDED",
  "fundingStatus": "ACTIVE",
  "fundingTxHash": "0xabc...",
  "released": true,
  "releaseTxHash": "0x9a8b...",
  "releaseConfirmedAt": "2026-09-07T12:30:00.000Z",
  "repaymentTxHash": null,
  "fundedAt": "2026-09-07T12:00:00.000Z",
  "settledAt": null,
  "dueDate": "2026-10-20T00:00:00.000Z"
}
```
(`status`: `OPEN` | `FUNDED` | `REPAID` | `DEFAULTED`. Escrow state mirrors `flowfi-escrow`'s record: `STATUS-FUNDED u0` / `STATUS-REPAID u1` / `STATUS-DEFAULTED u2`, keyed by on-chain receivable id.)

---

### Transactions & Proofs

#### 38. Get Transaction Proof / Status (poll this after every broadcast)
- **Endpoint**: `GET /v1/transactions/:txHash`
- **Auth Required**: No
- **UI Context**: Blockchain Explorer Link / Proof Modal / post-broadcast polling loop
- **Response (200 OK)**:
```json
{
  "txHash": "0xabc123",
  "onchainTxHash": "0xabc123",
  "isOnchain": true,
  "status": "CONFIRMED",
  "type": "RECEIVABLE_REGISTERED",
  "receivableId": "rec_112233",
  "fundingId": null,
  "operationId": "op_mf2d7a1b9c3e4f",
  "blockHeight": 142100,
  "contract": {
    "address": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "name": "flowfi-registry"
  },
  "function": "register-receivable",
  "confirmedAt": "2026-09-09T16:20:00Z",
  "createdAt": "2026-09-09T16:19:00.000Z",
  "metadata": {
    "businessId": "biz_789012"
  }
}
```
> `status`: `PENDING` | `CONFIRMED` | `FAILED` | `DROPPED`. For off-chain
> records `onchainTxHash` is `null` and `isOnchain` is `false`; `contract` is
> `null` when there is no contract leg (creation, document upload).

---

### Dashboards

#### 39. Get Business Dashboard Metrics
- **Endpoint**: `GET /v1/dashboard/business`
- **Auth Required**: Yes (`BUSINESS` role)
- **UI Context**: Business Dashboard Main Overview
- **Response (200 OK)**:
```json
{
  "stats": {
    "totalReceivables": 3,
    "activeFunding": "0.1500",
    "pendingVerification": 1,
    "repaid": 1
  },
  "recentReceivables": [
    {
      "id": "rec_112233",
      "title": "Invoice INV-2041",
      "amountUsd": "10000",
      "status": "OPEN_FOR_FUNDING",
      "verificationStatus": "VERIFIED",
      "createdAt": "2026-09-07T10:28:00.000Z"
    }
  ]
}
```

#### 40. Get Investor Dashboard Metrics
- **Endpoint**: `GET /v1/dashboard/investor`
- **Auth Required**: Yes (`INVESTOR` role)
- **UI Context**: Capital Provider Dashboard Main Overview
- **Response (200 OK)**:
```json
{
  "stats": {
    "totalFunded": "0.1500",
    "activeFunding": "0.1500",
    "repaid": "0.0000"
  },
  "recentFunding": [
    {
      "id": "fund_778899",
      "businessName": "ABC Logistics Ltd",
      "amountSbtc": "0.15",
      "status": "ACTIVE",
      "fundedAt": "2026-09-07T12:00:00.000Z"
    }
  ]
}
```

---

### Legacy Verification (Deprecated)

> Verification is one-time at the **business** level (see [section above](#verification-business-level)).
> These receivable-level routes are kept for backward compatibility and will be
> removed in a future version. New integrations must not use them.

#### 41. (Deprecated) Initiate Receivable Verification
- **Endpoint**: `POST /v1/verification/receivables/:receivableId`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "method": "PILOT_REVIEW"
}
```
- **Response (201 Created)**:
```json
{
  "id": "ver_445566",
  "status": "PENDING",
  "method": "PILOT_REVIEW"
}
```

#### 42. (Deprecated) Complete Verification (Admin / Verifier)
- **Endpoint**: `POST /v1/verification/:id/complete`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "status": "VERIFIED",
  "notes": "Verified business documentation and underlying invoice"
}
```
- **Response (200 OK)**:
```json
{
  "id": "ver_445566",
  "status": "VERIFIED",
  "verifiedAt": "2026-09-07T11:00:00.000Z"
}
```

#### 43. Get Verification Record
- **Endpoint**: `GET /v1/verification/:id`
- **Auth Required**: No
- **Response (200 OK)**:
```json
{
  "id": "ver_445566",
  "status": "VERIFIED",
  "method": "PILOT_REVIEW",
  "verifierName": null,
  "notes": "Verified business documentation and underlying invoice",
  "verifiedAt": "2026-09-07T11:00:00.000Z",
  "receivableId": "rec_112233"
}
```

---

## 7. Frontend API Client Helper (Axios/Fetch)

Here is a recommended Axios API client wrapper for your React / Next.js app (`src/lib/api.ts`):

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Bearer token from localStorage automatically
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('flowfi_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle standardized errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data?.error || { message: error.message });
    }
    return Promise.reject({ code: 'NETWORK_ERROR', message: 'Unable to connect to server' });
  }
);

// Idempotency: generate one key per user intent (one click = one key),
// reuse it across retries of the SAME intent, never across different ones.
export const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Example: fund flow with operation tracking + polling.
// Note: prepare validates amountSbtc against the REGISTERED funding target
// (FUNDING_AMOUNT_MISMATCH otherwise) — display prepared.fundingAmount as truth.
export async function fundReceivable(receivableId: string, amountSbtc: string, signAndBroadcast: (tx: unknown) => Promise<string>) {
  const key = newIdempotencyKey();
  const prepared = await apiClient.post(
    '/fundings/prepare',
    { receivableId, amountSbtc },
    { headers: { 'Idempotency-Key': key } },
  );
  const txHash: string = await signAndBroadcast(prepared.transaction);
  const submitted = await apiClient.post(
    '/fundings/confirm',
    { fundingId: prepared.fundingId, txHash, operationId: prepared.operationId },
    { headers: { 'Idempotency-Key': key } },
  );
  // submitted.transaction.status === 'CONFIRMING' — poll until the indexer confirms.
  return pollTransaction(txHash).then(() => submitted);
}

// Example: admin release (escrow -> business) — sign with the ADMIN wallet.
export async function releaseFunds(fundingId: string, signAndBroadcastAdmin: (tx: unknown) => Promise<string>) {
  const key = newIdempotencyKey();
  const prepared = await apiClient.post(
    `/fundings/${fundingId}/release/prepare`, {},
    { headers: { 'Idempotency-Key': key } },
  );
  const txHash: string = await signAndBroadcastAdmin(prepared.transaction);
  await apiClient.post(
    `/fundings/${fundingId}/release/confirm`,
    { txHash, operationId: prepared.operationId },
    { headers: { 'Idempotency-Key': key } },
  );
  return pollTransaction(txHash);
}

// Example: poll a broadcast until the chain confirms it
export async function pollTransaction(txHash: string, { timeoutMs = 120_000, intervalMs = 4_000 } = {}) {
  const started = Date.now();
  for (;;) {
    const tx = await apiClient.get(`/transactions/${txHash}`);
    if (tx.status === 'CONFIRMED') return tx;
    if (tx.status === 'FAILED' || tx.status === 'DROPPED') {
      throw new Error(`Transaction ${tx.status.toLowerCase()}: ${txHash}`);
    }
    if (Date.now() - started > timeoutMs) throw new Error('Transaction confirmation timed out');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
```

---

## 8. Appendix: Environment, Contract Alignment & MVP Notes

**Backend env knobs the frontend should know about:**
| Variable | Default | Effect |
|---|---|---|
| `STACKS_NETWORK` | `testnet` | Returned as `transaction.network`; selects the canonical sBTC principal; embedded in the auth message |
| `STACKS_CONTRACT_ADDRESS` | `SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE` | FlowFi registry + escrow address in payloads |
| `REGISTRY_CONTRACT_NAME` | `flowfi-registry` | `register-business` / `verify-business` / `register-receivable` contract |
| `ESCROW_CONTRACT_NAME` | `flowfi-escrow` | `fund-receivable` / `release-funds` / `repay-receivable` contract |
| `SBTC_CONTRACT` | testnet `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token`, mainnet `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` | sBTC SIP-010 principal used in funding/release/repayment payloads (override for simnet mock token) |
| `VERIFIER_WALLETS` | _(empty = attestation disabled)_ | Comma-separated verifier/admin wallet allowlist for `verify-business` prepare/confirm. Fail-closed when unset |
| `FLOWFI_DOMAIN` | `flowfi.xyz` | Bound into the auth challenge message |
| `BITCOIN_TIP_HEIGHT` | _(estimated)_ | Current burn-block height for `register-receivable` date conversion (e.g. from `mempool.space/api/blocks/tip/height`). Unset → estimated from block 840000 @ 2024-04-19 with `heightEstimated: true` |
| `SATS_PER_UNIT` | `1` | Protocol-unit → sBTC-sats conversion for the authoritative funding target |
| `FUNDING_AMOUNT_TOLERANCE_SATS` | `1` | Allowed deviation when validating requested `amountSbtc` |
| `MOCK_CONFIRM_DELAY_MS` | `30000` | Mock-indexer delay flipping `CONFIRMING` → `CONFIRMED`; `0` disables (real indexer owns it) |
| `UPLOAD_MAX_SIZE_BYTES` | `10485760` (10 MB) | Invoice upload limit |
| `ALLOWED_FILE_TYPES` | `application/pdf,image/jpeg,image/png,image/webp` | Invoice upload allowlist |

### Contract ↔ API alignment matrix

Every wallet-signed contract call is built by exactly one `*/prepare` (verified E2E against `FlowFi-BTC/contracts/`):

| Contract function | Exact signature | API prepare | Signer |
|---|---|---|---|
| `flowfi-registry register-business` | `(business-name (string-ascii 100)) (country (string-ascii 2))` | `25. POST /verification/businesses/:id/onchain/register/prepare` | Business wallet (becomes owner) |
| `flowfi-registry verify-business` | `(business-id uint) (method uint) (level uint) (expiry uint) (verified-by principal) (ref (buff 32)) (proof (buff 32))` | `27. POST /verification/businesses/:id/onchain/prepare` | **Verifier wallet only** (`u100` otherwise) |
| `flowfi-registry register-receivable` | `(business-id uint) (debtor-name) (debtor-country) (invoice-number) (invoice-hash (buff 32)) (face-value uint) (funding-amount uint) (issue-date uint) (due-date uint)` | `16. POST /receivables/:id/register/prepare` | Business wallet, must own + be verified (`u105`/`u106`) |
| `flowfi-registry mark-funded / mark-repaid / mark-defaulted` | escrow-only (`contract-caller` check) | — (reached via escrow calls below) | `flowfi-escrow` contract only |
| `flowfi-escrow fund-receivable` | `(receivable-id uint) (token <sip-010-trait>)` — amount from registry, not args | `29. POST /fundings/prepare` | Investor wallet (not the business, `u205`) |
| `flowfi-escrow release-funds` | `(receivable-id uint) (token <sip-010-trait>)` | `33. POST /fundings/:id/release/prepare` | **Admin wallet only** (`u200` otherwise) |
| `flowfi-escrow repay-receivable` | `(receivable-id uint) (token <sip-010-trait>)` — flat == funding-amount | `35. POST /fundings/:id/repayment/prepare` | Business wallet, only after release (`u208`/`u209`) |
| `flowfi-escrow mark-default` | `(receivable-id uint)` — admin, past due-date | — (roadmap; current `POST /receivables/:id/default` is an off-chain admin action) | Admin wallet |

Key rules the backend enforces so the wallet never signs a doomed transaction:
- Backend cuid ids never enter Clarity — `biz_xxx`/`rec_xxx` map to registry `uint` ids (`onchainBusinessId`, `onchainReceivableId`).
- Dates are burn heights, amounts are protocol units, `buff 32` fields are exactly 32 bytes (hashed when necessary).
- Funding `amountSbtc` is validated against the registered target; `u203`/`u204`/`u205` failures are pre-empted with `RECEIVABLE_NOT_OPEN` / `ALREADY_FUNDED` / ownership checks.

**Deliberate MVP simplifications (will harden before mainnet):**
- Confirmation is applied by a mock confirmer after `MOCK_CONFIRM_DELAY_MS`. Shapes are
  fully async (`CONFIRMING` + `poll`) so a real Stacks indexer can take over without
  frontend changes. Set the delay to `0` and point the indexer at `FUNDING_SUBMITTED` /
  `REPAYMENT_SUBMITTED` / `RECEIVABLE_REGISTERED` / `FUNDS_RELEASED` events.
- Business verification metadata (`method`, `level`, `verifiedBy`, hashes), the
  `biz ↔ uint` mapping, and the business `country` are held in memory; promote to
  `BusinessProfile` columns for persistence (`Receivable.contractId` is already persisted).
- Off-chain `completeBusinessVerification` currently allows the owner (pilot review);
  production restricts completion to a verifier/admin role. The on-chain attestation
  already enforces the verifier session.
- `POST /receivables/:id/default` is currently an off-chain admin action; wire it to
  escrow `mark-default` (admin wallet, past registry due-date) before mainnet.
- `cancel-receivable`, `revoke-verification`, and `set-*` admin functions are operated
  via contract console (no API surface by design).
- Invoice files are hashed in memory and only the SHA-256 is stored; persist the
  bytes to object storage (S3/UploadThing) alongside the hash in production.
- `receivable.verificationStatus` is retained as a legacy mirror of
  `business.verification`; new UI should read `business.verification`.
- Success envelope is currently the raw resource; a `{ "data", "meta" }` envelope
  is planned for v2 (additive-only until then).
