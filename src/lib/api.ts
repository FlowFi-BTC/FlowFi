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
  TransactionProof,
  BusinessDashboardMetrics,
  InvestorDashboardMetrics,
  UserRole,
  VerificationStatus,
  ReceivableActivityItem,
} from '../types/api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('flowfi_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data?.error || { message: error.message });
    }
    return Promise.reject({ code: 'NETWORK_ERROR', message: 'Unable to connect to FlowFi API server' });
  }
);

// 1. Authentication API
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

// 2. Onboarding API
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

// 3. Business Profiles API
export const businessApi = {
  async register(data: {
    companyName: string;
    registrationNumber?: string;
    website?: string;
    description?: string;
  }): Promise<BusinessProfile> {
    try {
      const res = await apiClient.post('/businesses', data);
      return res.data;
    } catch {
      const res = await apiClient.post('/business', data);
      return res.data;
    }
  },

  async getMe(): Promise<BusinessProfile> {
    try {
      const res = await apiClient.get('/business/me');
      return res.data;
    } catch {
      const res = await apiClient.get('/businesses/me');
      return res.data;
    }
  },

  async updateMe(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    try {
      const res = await apiClient.patch('/business/me', data);
      return res.data;
    } catch {
      const res = await apiClient.patch('/businesses/me', data);
      return res.data;
    }
  },

  async verifyBusiness(): Promise<BusinessProfile> {
    try {
      const res = await apiClient.patch('/business/me', { verificationStatus: 'VERIFIED' });
      return res.data;
    } catch {
      const res = await apiClient.patch('/businesses/me', { verificationStatus: 'VERIFIED' });
      return res.data;
    }
  },
};

// 4. Investor Profiles API
export const investorApi = {
  async register(displayName: string): Promise<InvestorProfile> {
    const res = await apiClient.post('/investors', { displayName });
    return res.data;
  },

  async getMe(): Promise<InvestorProfile> {
    const res = await apiClient.get('/investors/me');
    return res.data;
  },
};

// 5. Receivables Management API
export const receivablesApi = {
  async submit(data: {
    title: string;
    description: string;
    invoiceNumber?: string;
    amountUsd: number;
    dueDate: string;
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

  async getActivity(id: string): Promise<{ items: ReceivableActivityItem[] }> {
    const res = await apiClient.get(`/receivables/${id}/activity`);
    return res.data;
  },

  async flagDefault(id: string, reason: string): Promise<any> {
    const res = await apiClient.post(`/receivables/${id}/default`, { reason });
    return res.data;
  },
};

// 6. Marketplace API
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

// 7. Verification API
export const verificationApi = {
  async initiate(receivableId: string, method = 'PILOT_REVIEW'): Promise<any> {
    const res = await apiClient.post(`/verification/receivables/${receivableId}`, { method });
    return res.data;
  },

  async complete(id: string, status: VerificationStatus, notes: string): Promise<any> {
    const res = await apiClient.post(`/verification/${id}/complete`, { status, notes });
    return res.data;
  },
};

// 8. sBTC Funding & Repayment API
export const fundingApi = {
  async prepareFunding(receivableId: string, amountSbtc: string): Promise<FundingPrepareResponse> {
    const res = await apiClient.post('/fundings/prepare', { receivableId, amountSbtc });
    return res.data;
  },

  async confirmFunding(fundingId: string, txHash: string): Promise<FundingConfirmResponse> {
    const res = await apiClient.post('/fundings/confirm', { fundingId, txHash });
    return res.data;
  },

  async getMyFundings(): Promise<{ items: InvestorFundingItem[] }> {
    const res = await apiClient.get('/fundings/me');
    return res.data;
  },

  async getFundingDetails(id: string): Promise<FundingDetails> {
    const res = await apiClient.get(`/fundings/${id}`);
    return res.data;
  },

  async prepareRepayment(id: string): Promise<RepaymentPrepareResponse> {
    const res = await apiClient.post(`/fundings/${id}/repayment/prepare`);
    return res.data;
  },

  async confirmRepayment(id: string, txHash: string): Promise<RepaymentConfirmResponse> {
    const res = await apiClient.post(`/fundings/${id}/repayment/confirm`, { txHash });
    return res.data;
  },
};

// 9. Transactions & Proofs API
export const transactionsApi = {
  async getProof(txHash: string): Promise<TransactionProof> {
    const res = await apiClient.get(`/transactions/${txHash}`);
    return res.data;
  },
};

// 10. Dashboard API
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
