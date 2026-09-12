// Reconciled against FRONTEND_API_DOCS.md §4 — authoritative TypeScript definitions.
// Do not drift: Receivable.lifecycle vs Funding.lifecycle vs Transaction.lifecycle are separate.

export type UserRole = 'BUSINESS' | 'INVESTOR' | 'business' | 'investor';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

// Receivable lifecycle (DB view) — §1 status vocabularies
export type ReceivableStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED' // business-verified, awaiting on-chain registration
  | 'OPEN_FOR_FUNDING'
  | 'FUNDED'
  | 'REPAID'
  | 'DEFAULTED';

// Async registration view (returned by register/confirm, not stored on Receivable)
export type ReceivableRegistrationStatus = 'PENDING_CONFIRMATION' | 'OPEN_FOR_FUNDING';

// Funding lifecycle — use fundingStatus; status is the legacy alias.
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
  country?: string | null; // ISO-2, required for on-chain register-business
  onchainBusinessId?: number | null; // registry uint id (never the cuid)
  verificationStatus: VerificationStatus; // legacy mirror, keep for compat
  verification: BusinessVerification; // canonical verification object
  receivablesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface InvestorProfile {
  id: string;
  displayName: string;
  fundingsCount?: number;
  activeFundings?: number;
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
  createdAt?: string;
}

export interface ReceivableVerificationDetails {
  id: string;
  method: string;
  status: VerificationStatus;
  notes?: string | null;
  verifiedAt?: string | null;
}

export interface ReceivableVerificationInfo {
  business: VerificationStatus;
  receivable: VerificationStatus;
  details?: ReceivableVerificationDetails | null;
}

export interface ReceivableFundingInfo {
  id: string;
  amountSbtc: string;
  status: FundingStatus;
  fundTxHash: string;
  fundedAt?: string | null;
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
  verification?: ReceivableVerificationInfo | null;
  debtor: Debtor | null;
  documentStatus: 'NONE' | 'UPLOADED';
  evidenceStatus: 'PENDING' | 'READY';
  documents?: ReceivableDocument[];
  registerTxHash: string | null; // null until the register tx is broadcast
  businessName?: string;
  business?: {
    id: string;
    companyName: string;
    registrationNumber?: string | null;
    verificationStatus: VerificationStatus;
    verification: BusinessVerification;
  } | null;
  funding?: ReceivableFundingInfo | null;
  createdAt: string;
  // Back-compat extras used by older UI code (prefer typed fields above)
  amount?: number;
  docHash?: string;
  borrower?: string;
  borrowerName?: string;
  counterparty?: string;
  provider?: string | null;
  providerName?: string;
  dueBlock?: number;
  dueDateEstimated?: string;
}

export interface ReceivableActivityItem {
  id: string;
  type: string;
  txHash: string | null; // null until a REAL Stacks tx hash exists — never a placeholder
  status?: TransactionQueryStatus;
  operationId?: string | null;
  blockHeight?: number | null;
  confirmedAt?: string | null;
  createdAt: string;
  metadata?: Record<string, any> | null;
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

export interface ChallengeResponse {
  challengeId: string;
  message: string;
  nonce: string;
  domain: string;
  network: string;
  issuedAt: string;
  expiresAt: string;
}

export interface VerifyResponse {
  token: string;
  user: UserProfile;
}

export interface OnboardingResponse {
  user: {
    id: string;
    role: UserRole;
  };
  nextStep: string;
}

export interface OnboardingStatusResponse {
  role: UserRole | null;
  profileComplete: boolean;
  verificationRequired: boolean;
  verificationStatus: VerificationStatus;
  nextStep: string;
}

export interface FundingPrepareResponse {
  fundingId: string;
  operationId: string;
  receivableId: string;
  onchainReceivableId: number;
  fundingAmount: { units: string; sats: string; sbtc: string };
  amountSbtc: string;
  transaction: StacksTransactionPayload;
  expiresAt: string;
}

export interface FundingConfirmResponse {
  id: string;
  fundingId: string;
  status: FundingStatus;
  fundingStatus: FundingLifecycle;
  operationId: string;
  transaction: { txHash: string; status: string };
  txHash: string;
  fundedAt: string | null;
  poll: string;
}

export interface InvestorFundingItem {
  id: string;
  receivableId: string;
  businessName: string;
  amountSbtc: string;
  status: FundingStatus;
  fundingStatus?: FundingStatus;
  fundedAt: string | null;
  dueDate: string;
}

export interface FundingDetails {
  id: string;
  amountSbtc: string;
  status: FundingStatus;
  fundingStatus?: FundingStatus;
  receivable: {
    id: string;
    title: string;
    amountUsd: string | number;
    dueDate: string;
  };
  business: {
    companyName: string;
  };
  transactions: Array<{
    type: string;
    txHash: string;
    status: string;
    confirmedAt: string | null;
  }>;
}

export interface RepaymentPrepareResponse {
  fundingId: string;
  operationId: string;
  onchainReceivableId: number;
  amountSbtc: string;
  released: boolean;
  releaseTxHash: string | null;
  readyToRepay: boolean;
  warning?: string;
  transaction: StacksTransactionPayload;
  expiresAt: string;
}

export interface RepaymentConfirmResponse {
  fundingId: string;
  status: FundingStatus;
  fundingStatus: FundingStatus;
  operationId: string;
  transaction: { txHash: string; status: string };
  txHash: string;
  settledAt: string | null;
  poll: string;
}

export interface ReleasePrepareResponse {
  fundingId: string;
  operationId: string;
  onchainReceivableId: number;
  signerRole: string;
  mustBeSignedBy: string;
  transaction: StacksTransactionPayload;
  expiresAt: string;
}

export interface ReleaseConfirmResponse {
  fundingId: string;
  operationId: string;
  transaction: { txHash: string; status: string };
  released: boolean;
  releaseTxHash: string;
  poll: string;
}

export interface RegisterPrepareResponse {
  operationId: string;
  receivableId: string;
  businessId: string;
  onchainBusinessId: number;
  debtor: Debtor;
  invoiceNumber: string;
  documentHash: string;
  amounts: { faceValueUnits: string; fundingAmountUnits: string; unit: string };
  dates: { issueBurnHeight: number; dueBurnHeight: number; heightEstimated: boolean };
  transaction: StacksTransactionPayload;
  expiresAt: string;
}

export interface RegisterConfirmResponse {
  receivableId: string;
  operationId: string;
  onchainReceivableId: number | null;
  transaction: { txHash: string; status: string };
  status: ReceivableRegistrationStatus;
  poll: string;
}

export interface BusinessRegisterPrepareResponse {
  operationId: string;
  businessId: string;
  businessName: string;
  country: string;
  transaction: StacksTransactionPayload;
  expiresAt: string;
}

export interface BusinessAttestPrepareResponse {
  operationId: string;
  businessId: string;
  onchainBusinessId: number;
  signerRole: string;
  mustBeSignedBy: string;
  parameters: Record<string, unknown>;
  transaction: StacksTransactionPayload;
  expiresAt: string;
}

export interface TransactionProof {
  txHash: string;
  onchainTxHash: string | null;
  isOnchain: boolean;
  status: TransactionQueryStatus;
  type: string;
  receivableId?: string | null;
  fundingId?: string | null;
  operationId?: string | null;
  blockHeight?: number | null;
  contract?: { address: string; name: string } | null;
  function?: string | null;
  confirmedAt?: string | null;
  createdAt?: string;
  metadata?: Record<string, any> | null;
}

export interface OnchainReceivableState {
  receivableId: string;
  registry: {
    contractAddress: string;
    contractName: string;
    registered: boolean;
    status: string;
    businessId: string;
    onchainBusinessId: number | null;
    onchainReceivableId: number | null;
    registerTxHash: string | null;
    lastSyncedBlock: number | null;
  };
}

export interface BusinessDashboardMetrics {
  stats: {
    totalReceivables: number;
    activeFunding: string;
    pendingVerification: number;
    repaid: number;
  };
  recentReceivables: Array<{
    id: string;
    title: string;
    amountUsd: string | number;
    status: ReceivableStatus;
    verificationStatus: VerificationStatus;
    createdAt: string;
  }>;
}

export interface InvestorDashboardMetrics {
  stats: {
    totalFunded: string;
    activeFunding: string;
    repaid: string;
  };
  recentFunding: Array<{
    id: string;
    businessName: string;
    amountSbtc: string;
    status: FundingStatus;
    fundedAt: string | null;
  }>;
}
