import axios from 'axios';
import type {
  UserProfile,
  BusinessProfile,
  InvestorProfile,
  Receivable,
  MarketplaceItem,
  PaginatedResult,
  ChallengeResponse,
  VerifyResponse,
  OnboardingResponse,
  OnboardingStatusResponse,
  FundingPrepareResponse,
  FundingConfirmResponse,
  InvestorFundingItem,
  FundingDetails,
  RepaymentPrepareResponse,
  RepaymentConfirmResponse,
  ReleasePrepareResponse,
  ReleaseConfirmResponse,
  RegisterPrepareResponse,
  RegisterConfirmResponse,
  BusinessRegisterPrepareResponse,
  BusinessAttestPrepareResponse,
  TransactionProof,
  OnchainReceivableState,
  BusinessDashboardMetrics,
  InvestorDashboardMetrics,
  UserRole,
  VerificationStatus,
  ReceivableActivityItem,
  ReceivableDocument,
  Escrow,
  VerificationMethod,
  VerificationLevel,
} from '../types/api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/v1';

export const TOKEN_KEY = 'flowfi_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errBody = error.response.data?.error || { message: error.message };
      // Preserve HTTP status for callers that branch on 404/409/403
      return Promise.reject({ ...errBody, status: error.response.status });
    }
    return Promise.reject({ code: 'NETWORK_ERROR', message: 'Unable to connect to FlowFi API server' });
  },
);

// Idempotency: generate one key per user intent (one click = one key),
// reuse it across retries of the SAME intent, never across different ones.
// Send as `Idempotency-Key` on all wallet-tx writes (§5).
export const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const withIdempotency = (key?: string) =>
  key ? { headers: { 'Idempotency-Key': key } } : {};

// ── 1-3. Authentication (#1 challenge, #2 verify, #3 me) ──
export const authApi = {
  async requestChallenge(walletAddress: string): Promise<ChallengeResponse> {
    const res = await apiClient.post('/auth/challenge', { walletAddress });
    return res.data;
  },

  async verifySignature(challengeId: string, walletAddress: string, signature: string): Promise<VerifyResponse> {
    const res = await apiClient.post('/auth/verify', { challengeId, walletAddress, signature });
    return res.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// ── 4-5. Onboarding (#4 select role, #5 status) ──
export const onboardingApi = {
  async selectRole(role: UserRole): Promise<OnboardingResponse> {
    const res = await apiClient.post('/onboarding', { role });
    return res.data;
  },

  async getStatus(): Promise<OnboardingStatusResponse> {
    const res = await apiClient.get('/onboarding/status');
    return res.data;
  },
};

// ── 6-8. Business Profiles (#6 register, #7 me, #8 update) ──
export const businessApi = {
  async register(data: {
    companyName: string;
    registrationNumber?: string;
    website?: string;
    description?: string;
    country?: string; // ISO-2 — optional here but REQUIRED before on-chain register-business
  }): Promise<BusinessProfile> {
    const res = await apiClient.post('/businesses', data);
    return res.data;
  },

  async getMe(): Promise<BusinessProfile> {
    const res = await apiClient.get('/businesses/me');
    return res.data;
  },

  async updateMe(data: {
    companyName?: string;
    registrationNumber?: string;
    website?: string;
    description?: string;
    country?: string;
  }): Promise<BusinessProfile> {
    const res = await apiClient.patch('/businesses/me', data);
    return res.data;
  },
};

// ── 9-10. Investor Profiles (#9 register, #10 me) + PATCH /investors/me ──
export const investorApi = {
  async register(displayName: string): Promise<InvestorProfile> {
    const res = await apiClient.post('/investors', { displayName });
    return res.data;
  },

  async getMe(): Promise<InvestorProfile> {
    const res = await apiClient.get('/investors/me');
    return res.data;
  },

  async updateMe(data: Partial<Pick<InvestorProfile, 'displayName'>>): Promise<InvestorProfile> {
    const res = await apiClient.patch('/investors/me', data);
    return res.data;
  },
};

// ── 11-15. Receivables (#11 submit, #12 me, #13 detail, #14 patch, #15 default) ──
export const receivablesApi = {
  async submit(data: {
    title: string;
    description: string;
    invoiceNumber?: string;
    amountUsd: number;
    dueDate: string;
    debtor?: { companyName: string; country?: string; registrationNumber?: string };
  }): Promise<Receivable> {
    const res = await apiClient.post('/receivables', data);
    return res.data;
  },

  async getMyReceivables(page = 1, limit = 20): Promise<PaginatedResult<Receivable>> {
    const res = await apiClient.get(`/receivables/me?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getDetails(id: string): Promise<Receivable> {
    const res = await apiClient.get(`/receivables/${id}`);
    return res.data;
  },

  /** #14 pre-registration corrections — how you satisfy DEBTOR_REQUIRED etc. */
  async update(
    id: string,
    data: {
      invoiceNumber?: string;
      dueDate?: string;
      debtor?: { companyName: string; country?: string; registrationNumber?: string };
    },
  ): Promise<Receivable> {
    const res = await apiClient.patch(`/receivables/${id}`, data);
    return res.data;
  },

  async getOnchain(id: string): Promise<OnchainReceivableState> {
    const res = await apiClient.get(`/receivables/${id}/onchain`);
    return res.data;
  },

  async getActivity(id: string): Promise<{ items: ReceivableActivityItem[] }> {
    const res = await apiClient.get(`/receivables/${id}/activity`);
    return res.data;
  },

  /** #18 upload — multipart/form-data, field "file". Only SHA-256 goes on-chain. */
  async uploadDocument(id: string, file: File): Promise<ReceivableDocument> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post(`/receivables/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /** #16 prepare registration — validates BUSINESS_NOT_ONCHAIN, DEBTOR_*, DOCUMENT_REQUIRED… */
  async prepareRegister(id: string, idempotencyKey?: string): Promise<RegisterPrepareResponse> {
    const res = await apiClient.post(
      `/receivables/${id}/register/prepare`,
      {},
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  /** #17 confirm registration — returns PENDING_CONFIRMATION, never OPEN_FOR_FUNDING */
  async confirmRegister(
    id: string,
    data: { txHash: string; operationId?: string; onchainReceivableId?: number },
    idempotencyKey?: string,
  ): Promise<RegisterConfirmResponse> {
    const res = await apiClient.post(
      `/receivables/${id}/register/confirm`,
      data,
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  /** #15 flag defaulted — off-chain admin action in MVP (txHash is a placeholder, not a Stacks tx) */
  async flagDefault(id: string, reason: string): Promise<any> {
    const res = await apiClient.post(`/receivables/${id}/default`, { reason });
    return res.data;
  },
};

// ── 21. Marketplace (#21 list) ──
export const marketplaceApi = {
  async listReceivables(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<MarketplaceItem>> {
    const res = await apiClient.get('/marketplace/receivables', { params });
    return res.data;
  },
};

// ── 22-28. Business-level verification (current) ──
// #22 start, #23 get, #24 complete (off-chain review),
// #25/#26 register-business prepare/confirm (BUSINESS wallet),
// #27/#28 verify-business prepare/confirm (VERIFIER wallet only).
export const businessVerificationApi = {
  async start(
    businessId: string,
    data?: { method?: VerificationMethod; level?: VerificationLevel; notes?: string },
  ): Promise<any> {
    const res = await apiClient.post(`/verification/businesses/${businessId}/start`, data ?? {});
    return res.data;
  },

  async get(businessId: string): Promise<any> {
    const res = await apiClient.get(`/verification/businesses/${businessId}`);
    return res.data;
  },

  async complete(
    businessId: string,
    data: {
      status: VerificationStatus;
      notes?: string;
      verifiedBy?: string;
      method?: VerificationMethod;
      level?: VerificationLevel;
      referenceHash?: string;
      proofHash?: string;
    },
  ): Promise<any> {
    const res = await apiClient.post(`/verification/businesses/${businessId}/complete`, data);
    return res.data;
  },

  async prepareRegister(
    businessId: string,
    data?: { country?: string },
    idempotencyKey?: string,
  ): Promise<BusinessRegisterPrepareResponse> {
    const res = await apiClient.post(
      `/verification/businesses/${businessId}/onchain/register/prepare`,
      data ?? {},
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  async confirmRegister(
    businessId: string,
    data: { txHash: string; operationId?: string; onchainBusinessId?: number },
    idempotencyKey?: string,
  ): Promise<any> {
    const res = await apiClient.post(
      `/verification/businesses/${businessId}/onchain/register/confirm`,
      data,
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  async prepareAttestation(
    businessId: string,
    data?: { verificationExpiry?: number; referenceHash?: string },
    idempotencyKey?: string,
  ): Promise<BusinessAttestPrepareResponse> {
    const res = await apiClient.post(
      `/verification/businesses/${businessId}/onchain/prepare`,
      data ?? {},
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  async confirmAttestation(
    businessId: string,
    data: { txHash: string; operationId?: string },
    idempotencyKey?: string,
  ): Promise<any> {
    const res = await apiClient.post(
      `/verification/businesses/${businessId}/onchain/confirm`,
      data,
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },
};

// ── 41-43. Legacy receivable-level verification (DEPRECATED — do not use in new UI) ──
export const verificationApi = {
  /** @deprecated use businessVerificationApi — kept for backward compat only */
  async initiate(receivableId: string, method = 'PILOT_REVIEW'): Promise<any> {
    const res = await apiClient.post(`/verification/receivables/${receivableId}`, { method });
    return res.data;
  },

  /** @deprecated use businessVerificationApi.complete */
  async complete(id: string, status: VerificationStatus, notes: string): Promise<any> {
    const res = await apiClient.post(`/verification/${id}/complete`, { status, notes });
    return res.data;
  },

  async getRecord(id: string): Promise<any> {
    const res = await apiClient.get(`/verification/${id}`);
    return res.data;
  },
};

// ── 29-36. sBTC Funding, Release, Repayment ──
export const fundingApi = {
  /** #29 — backend validates amountSbtc against the REGISTERED target. Display prepared.fundingAmount as truth. */
  async prepareFunding(
    receivableId: string,
    amountSbtc: string,
    idempotencyKey?: string,
  ): Promise<FundingPrepareResponse> {
    const res = await apiClient.post(
      '/fundings/prepare',
      { receivableId, amountSbtc },
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  /** #30 — confirm only records broadcast (CONFIRMING). Poll pollTransaction() after. */
  async confirmFunding(
    data: { fundingId: string; txHash: string; operationId?: string },
    idempotencyKey?: string,
  ): Promise<FundingConfirmResponse> {
    const res = await apiClient.post('/fundings/confirm', data, withIdempotency(idempotencyKey));
    return res.data;
  },

  /** #31 investor portfolio */
  async getMyFundings(): Promise<{ items: InvestorFundingItem[] }> {
    const res = await apiClient.get('/fundings/me');
    return res.data;
  },

  /** #32 tracking details */
  async getFundingDetails(id: string): Promise<FundingDetails> {
    const res = await apiClient.get(`/fundings/${id}`);
    return res.data;
  },

  /** #33 release prepare — sign with ADMIN wallet */
  async prepareRelease(fundingId: string, idempotencyKey?: string): Promise<ReleasePrepareResponse> {
    const res = await apiClient.post(
      `/fundings/${fundingId}/release/prepare`,
      {},
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  /** #34 release confirm */
  async confirmRelease(
    fundingId: string,
    data: { txHash: string; operationId?: string },
    idempotencyKey?: string,
  ): Promise<ReleaseConfirmResponse> {
    const res = await apiClient.post(
      `/fundings/${fundingId}/release/confirm`,
      data,
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  /** #35 repayment prepare — check released/readyToRepay gate first */
  async prepareRepayment(fundingId: string, idempotencyKey?: string): Promise<RepaymentPrepareResponse> {
    const res = await apiClient.post(
      `/fundings/${fundingId}/repayment/prepare`,
      {},
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },

  /** #36 repayment confirm — funding stays ACTIVE until indexer flips to REPAID */
  async confirmRepayment(
    fundingId: string,
    data: { txHash: string; operationId?: string },
    idempotencyKey?: string,
  ): Promise<RepaymentConfirmResponse> {
    const res = await apiClient.post(
      `/fundings/${fundingId}/repayment/confirm`,
      data,
      withIdempotency(idempotencyKey),
    );
    return res.data;
  },
};

// ── 37. Escrows (#37 detail — accepts esc_<fundingId> or raw funding id) ──
export const escrowApi = {
  async getById(id: string): Promise<Escrow> {
    const res = await apiClient.get(`/escrows/${id}`);
    return res.data;
  },
};

// ── 38. Transactions (#38 poll after every broadcast) ──
export const transactionsApi = {
  async getProof(txHash: string): Promise<TransactionProof> {
    const res = await apiClient.get(`/transactions/${txHash}`);
    return res.data;
  },

  /** Poll until CONFIRMED | FAILED | DROPPED (~4s interval, ~120s timeout per doc helper). */
  async pollTransaction(
    txHash: string,
    { timeoutMs = 120_000, intervalMs = 4_000 }: { timeoutMs?: number; intervalMs?: number } = {},
  ): Promise<TransactionProof> {
    const started = Date.now();
    for (;;) {
      const tx = await transactionsApi.getProof(txHash);
      if (tx.status === 'CONFIRMED') return tx;
      if (tx.status === 'FAILED' || tx.status === 'DROPPED') {
        throw new Error(`Transaction ${tx.status.toLowerCase()}: ${txHash}`);
      }
      if (Date.now() - started > timeoutMs) throw new Error('Transaction confirmation timed out');
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  },
};

// ── 39-40. Dashboards (#39 business, #40 investor) ──
export const dashboardApi = {
  async getBusinessMetrics(): Promise<BusinessDashboardMetrics> {
    const res = await apiClient.get('/dashboard/business');
    return res.data;
  },

  async getInvestorMetrics(): Promise<InvestorDashboardMetrics> {
    const res = await apiClient.get('/dashboard/investor');
    return res.data;
  },
};
