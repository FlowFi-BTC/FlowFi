export type UserRole = 'BUSINESS' | 'INVESTOR' | 'business' | 'investor';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ReceivableStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'OPEN_FOR_FUNDING'
  | 'FUNDED'
  | 'REPAID'
  | 'DEFAULTED'
  | number;

export type FundingStatus = 'PENDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED';

export interface BusinessProfile {
  id: string;
  companyName: string;
  registrationNumber?: string | null;
  website?: string | null;
  description?: string | null;
  verificationStatus: VerificationStatus;
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

export interface UserProfile {
  id: string;
  walletAddress: string;
  role: UserRole | null;
  profileComplete: boolean;
  businessProfile?: BusinessProfile | null;
  investorProfile?: InvestorProfile | null;
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
  amountUsd: string | number;
  amount?: number;
  dueBlock?: number;
  dueDateEstimated?: string;
  dueDate: string;
  docHash?: string;
  status: ReceivableStatus;
  verificationStatus: VerificationStatus;
  borrower?: string;
  borrowerName?: string;
  counterparty?: string;
  provider?: string | null;
  providerName?: string;
  businessName?: string;
  business?: {
    id: string;
    companyName: string;
    registrationNumber?: string | null;
    verificationStatus: VerificationStatus;
  } | null;
  verification?: ReceivableVerificationInfo | null;
  funding?: ReceivableFundingInfo | null;
  createdAt: string;
}

export interface ReceivableActivityItem {
  id: string;
  type: string;
  txHash: string;
  blockHeight?: number | null;
  confirmedAt?: string | null;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  businessName: string;
  amountUsd: string | number;
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

export interface ChallengeResponse {
  challengeId: string;
  message: string;
  nonce: string;
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
  transaction: StacksTransactionPayload;
  amountSbtc: string;
}

export interface FundingConfirmResponse {
  id: string;
  status: FundingStatus;
  txHash: string;
  fundedAt: string;
}

export interface InvestorFundingItem {
  id: string;
  receivableId: string;
  businessName: string;
  amountSbtc: string;
  status: FundingStatus;
  fundedAt: string;
  dueDate: string;
}

export interface FundingDetails {
  id: string;
  amountSbtc: string;
  status: FundingStatus;
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
    confirmedAt: string;
  }>;
}

export interface RepaymentPrepareResponse {
  fundingId: string;
  transaction: StacksTransactionPayload;
}

export interface RepaymentConfirmResponse {
  status: 'REPAID';
  txHash: string;
  settledAt: string;
}

export interface TransactionProof {
  txHash: string;
  type: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  receivableId?: string;
  fundingId?: string;
  blockHeight?: number;
  confirmedAt?: string;
  metadata?: Record<string, any>;
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
    fundedAt: string;
  }>;
}
