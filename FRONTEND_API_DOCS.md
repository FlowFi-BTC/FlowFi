# FlowFi / Capital Rail - Frontend Developer API Guide

This documentation provides comprehensive details for frontend engineers integrating with the FlowFi / Capital Rail REST API.

---

## Table of Contents
1. [General Information](#1-general-information)
2. [Authentication Flow (Wallet Login)](#2-authentication-flow-wallet-login)
3. [TypeScript Definitions for Frontend](#3-typescript-definitions-for-frontend)
4. [API Endpoints Reference](#4-api-endpoints-reference)
   - [Authentication](#authentication)
   - [Onboarding](#onboarding)
   - [Business Profiles](#business-profiles)
   - [Investor Profiles](#investor-profiles)
   - [Receivables Management](#receivables-management)
   - [Marketplace](#marketplace)
   - [Verification](#verification)
   - [sBTC Funding](#sbtc-funding)
   - [sBTC Repayment & Settlement](#sbtc-repayment--settlement)
   - [Transactions & Proofs](#transactions--proofs)
   - [Dashboards](#dashboards)
5. [Frontend API Client Helper (Axios/Fetch)](#5-frontend-api-client-helper-axiosfetch)

---

## 1. General Information

- **Base URL (Local)**: `http://localhost:4000/v1` or `http://localhost:4000/api/v1`
- **Base URL (Production)**: `https://api.flowfi.xyz/v1`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>` (for authenticated endpoints)

### Standard Response Envelope
All API responses follow a consistent top-level JSON structure.

#### Success Response
```json
{
  "id": "rec_123",
  "title": "Invoice INV-2041",
  "status": "OPEN_FOR_FUNDING"
}
```
*(Or list wrapper `{ "items": [...], "pagination": { "page": 1, "limit": 20, "total": 12 } }`)*

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

#### Common Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `INVALID_CHALLENGE` / `INVALID_STATUS` | Bad request or invalid state transition |
| `401` | `UNAUTHORIZED` | Missing, invalid, or expired JWT Bearer token |
| `403` | `FORBIDDEN` | Access denied (e.g. role mismatch: Business vs Investor) |
| `404` | `NOT_FOUND` | Requested resource (Receivable, Profile, User) does not exist |
| `409` | `DUPLICATE_ENTRY` / `PROFILE_EXISTS` | Resource already created |
| `422` | `VALIDATION_ERROR` | Request body or query params failed schema validation |
| `500` | `INTERNAL_SERVER_ERROR` | Internal server exception |

---

## 2. Authentication Flow (Wallet Login)

Capital Rail uses wallet signature authentication. The frontend flow is:

1. User connects wallet (e.g. Leather, Xverse, Hiro Wallet, Phantom).
2. Frontend calls `POST /auth/challenge` passing `{ "walletAddress": "SP2..." }`.
3. Backend returns a `challengeId`, `nonce`, and `message` to sign.
4. Frontend prompts user wallet to sign `message`.
5. Frontend sends signature to `POST /auth/verify` passing `{ challengeId, walletAddress, signature }`.
6. Backend returns `{ token, user }`. Frontend stores `token` in `localStorage` or secure cookie and attaches it as `Authorization: Bearer <token>` for future API calls.

---

## 3. TypeScript Definitions for Frontend

Copy and paste these interfaces into your frontend project (`src/types/api.ts`):

```typescript
export type UserRole = 'BUSINESS' | 'INVESTOR';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ReceivableStatus = 
  | 'DRAFT' 
  | 'PENDING_VERIFICATION' 
  | 'VERIFIED' 
  | 'OPEN_FOR_FUNDING' 
  | 'FUNDED' 
  | 'REPAID' 
  | 'DEFAULTED';

export type FundingStatus = 'PENDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED';

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
  verificationStatus: VerificationStatus;
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
  verificationStatus: VerificationStatus;
  businessName?: string;
  business?: {
    id: string;
    companyName: string;
    registrationNumber?: string | null;
    verificationStatus: VerificationStatus;
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

export interface StacksTransactionPayload {
  contractAddress: string;
  contractName: string;
  functionName: string;
  arguments: string[];
}
```

---

## 4. API Endpoints Reference

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
  "message": "Sign this message to authenticate with Capital Rail (FlowFi). Nonce: a1b2c3d4e5f6",
  "nonce": "a1b2c3d4e5f6",
  "expiresAt": "2026-09-07T10:15:00.000Z"
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
  "description": "Logistics company serving West Africa"
}
```
- **Response (201 Created)**:
```json
{
  "id": "biz_789012",
  "companyName": "ABC Logistics Ltd",
  "registrationNumber": "RC123456",
  "verificationStatus": "PENDING",
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
  "verificationStatus": "PENDING",
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
  "description": "Updated company description"
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
  "verificationStatus": "PENDING",
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
- **UI Context**: "Submit Receivable" Modal / Form
- **Request Body**:
```json
{
  "title": "Invoice INV-2041",
  "description": "Logistics services provided to XYZ Corp",
  "invoiceNumber": "INV-2041",
  "amountUsd": 10000,
  "dueDate": "2026-10-20T00:00:00.000Z"
}
```
- **Response (201 Created)**:
```json
{
  "id": "rec_112233",
  "title": "Invoice INV-2041",
  "description": "Logistics services provided to XYZ Corp",
  "invoiceNumber": "INV-2041",
  "amountUsd": "10000",
  "dueDate": "2026-10-20T00:00:00.000Z",
  "status": "PENDING_VERIFICATION",
  "verificationStatus": "PENDING",
  "createdAt": "2026-09-07T10:28:00.000Z"
}
```

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
  "business": {
    "id": "biz_789012",
    "companyName": "ABC Logistics Ltd",
    "registrationNumber": "RC123456",
    "verificationStatus": "VERIFIED"
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

#### 14. Get Receivable Public Activity Timeline
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
      "txHash": "rec_evt_rec_112233_1757240880000",
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
      "type": "RECEIVABLE_VERIFIED",
      "txHash": "ver_evt_ver_445566_1757242800000",
      "blockHeight": null,
      "confirmedAt": null,
      "createdAt": "2026-09-07T11:00:00.000Z",
      "metadata": {
        "notes": "Verified against invoice"
      }
    }
  ]
}
```

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

### Marketplace

#### 16. List Public Marketplace Receivables
- **Endpoint**: `GET /v1/marketplace/receivables?status=OPEN_FOR_FUNDING&page=1&limit=20&search=logistics`
- **Auth Required**: No
- **UI Context**: "Explore Receivables" Marketplace Grid / Table
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

### Verification

#### 17. Initiate Receivable Verification
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

#### 18. Complete Verification (Admin / Verifier)
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

---

### sBTC Funding

#### 19. Prepare Funding Transaction
- **Endpoint**: `POST /v1/fundings/prepare`
- **Auth Required**: Yes (`INVESTOR` role)
- **UI Context**: Triggered when Capital Provider clicks "Fund Opportunity"
- **Request Body**:
```json
{
  "receivableId": "rec_112233",
  "amountSbtc": "0.15"
}
```
- **Response (200 OK)**:
```json
{
  "fundingId": "fund_1757245000000",
  "transaction": {
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "capital-rail-vault",
    "functionName": "fund-receivable",
    "arguments": [
      "rec_112233",
      "0.15"
    ]
  },
  "amountSbtc": "0.15"
}
```

#### 20. Confirm Funding Broadcast
- **Endpoint**: `POST /v1/fundings/confirm`
- **Auth Required**: Yes (`INVESTOR` role)
- **UI Context**: Triggered right after wallet returns the transaction hash
- **Request Body**:
```json
{
  "fundingId": "fund_1757245000000",
  "txHash": "0x8f2a1c9e...broadcasted_hash"
}
```
- **Response (200 OK)**:
```json
{
  "id": "fund_778899",
  "status": "ACTIVE",
  "txHash": "0x8f2a1c9e...broadcasted_hash",
  "fundedAt": "2026-09-07T12:00:00.000Z"
}
```

#### 21. Get My Fundings (Investor Portfolio)
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
      "fundedAt": "2026-09-07T12:00:00.000Z",
      "dueDate": "2026-10-20T00:00:00.000Z"
    }
  ]
}
```

#### 22. Get Funding Tracking Details
- **Endpoint**: `GET /v1/fundings/:id`
- **Auth Required**: Yes
- **UI Context**: Funding Tracking & Proof Detail Page
- **Response (200 OK)**:
```json
{
  "id": "fund_778899",
  "amountSbtc": "0.15",
  "status": "ACTIVE",
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
      "type": "FUNDED",
      "txHash": "0x8f2a1c9e...broadcasted_hash",
      "confirmedAt": "2026-09-07T12:00:00.000Z"
    }
  ]
}
```

---

### sBTC Repayment & Settlement

#### 23. Prepare Repayment Transaction
- **Endpoint**: `POST /v1/fundings/:id/repayment/prepare`
- **Auth Required**: Yes (`BUSINESS` role)
- **UI Context**: Triggered when business clicks "Repay Receivable"
- **Response (200 OK)**:
```json
{
  "fundingId": "fund_778899",
  "transaction": {
    "contractAddress": "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    "contractName": "capital-rail-vault",
    "functionName": "repay-receivable",
    "arguments": [
      "rec_112233",
      "0.15"
    ]
  }
}
```

#### 24. Confirm Repayment Broadcast
- **Endpoint**: `POST /v1/fundings/:id/repayment/confirm`
- **Auth Required**: Yes (`BUSINESS` role)
- **Request Body**:
```json
{
  "txHash": "0x3e4f5a6b...repay_tx_hash"
}
```
- **Response (200 OK)**:
```json
{
  "status": "REPAID",
  "txHash": "0x3e4f5a6b...repay_tx_hash",
  "settledAt": "2026-09-07T13:00:00.000Z"
}
```

---

### Transactions & Proofs

#### 25. Get Transaction Proof
- **Endpoint**: `GET /v1/transactions/:txHash`
- **Auth Required**: No
- **UI Context**: Blockchain Explorer Link / Proof Modal
- **Response (200 OK)**:
```json
{
  "txHash": "0x8f2a1c9e...broadcasted_hash",
  "type": "FUNDED",
  "status": "CONFIRMED",
  "receivableId": "rec_112233",
  "fundingId": "fund_778899",
  "blockHeight": 123456,
  "confirmedAt": "2026-09-07T12:00:00.000Z",
  "metadata": {
    "amountSbtc": "0.15"
  }
}
```

---

### Dashboards

#### 26. Get Business Dashboard Metrics
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

#### 27. Get Investor Dashboard Metrics
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

## 5. Frontend API Client Helper (Axios/Fetch)

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
```
