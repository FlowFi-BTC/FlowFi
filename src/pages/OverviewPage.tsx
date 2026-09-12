import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { dashboardApi, receivablesApi, fundingApi } from '../lib/api';
import { getSbtcBalance } from '../lib/stacks';
import type {
  BusinessDashboardMetrics,
  InvestorDashboardMetrics,
  Receivable,
  InvestorFundingItem,
} from '../types/api';
import { RefreshCcw } from 'lucide-react';
import { ScaleLoader } from 'react-spinners';

interface StatCard {
  label: string;
  value: string | number;
  accent: string;
  sublabel?: string;
}

const RailStar = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" className={className}>
    <path
      d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
      fill="#a8ff3e"
      stroke="black"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const StatCardView = ({ label, value, accent, sublabel }: StatCard) => (
  <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
    <div
      className="mb-4 flex h-9 w-9 items-center justify-center neo-border"
      style={{ backgroundColor: accent }}
    >
      <RailStar className="h-4 w-4" />
    </div>
    <div>
      <div className="font-syne text-2xl sm:text-3xl font-medium text-black">{value}</div>
      <div className="mt-1 text-[13px] font-medium text-gray-600">{label}</div>
      {sublabel && <div className="text-[11px] font-medium text-gray-500 mt-0.5">{sublabel}</div>}
    </div>
  </div>
);

export const OverviewPage: React.FC = () => {
  const { role, wallet, user, isLoading: contextLoading } = useUser();
  const [businessMetrics, setBusinessMetrics] = useState<BusinessDashboardMetrics | null>(null);
  const [investorMetrics, setInvestorMetrics] = useState<InvestorDashboardMetrics | null>(null);
  const [userReceivables, setUserReceivables] = useState<Receivable[]>([]);
  const [userFundings, setUserFundings] = useState<InvestorFundingItem[]>([]);
  const [liveSbtcBalance, setLiveSbtcBalance] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isInvestor = role === 'INVESTOR' || role === 'investor';

  const fetchLiveSbtcBalance = async () => {
    const address = wallet.address || user?.walletAddress;
    if (address) {
      try {
        const isTestnet = wallet.network === 'testnet';
        const bal = await getSbtcBalance(address, isTestnet);
        setLiveSbtcBalance(bal);
      } catch (err) {
        console.warn('Failed to fetch sBTC balance from Hiro API:', err);
      }
    }
  };

  useEffect(() => {
    fetchLiveSbtcBalance();
  }, [wallet.address, wallet.network, user?.walletAddress]);

  const fetchMetrics = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);

    fetchLiveSbtcBalance();

    try {
      if (isInvestor) {
        // Fetch Investor Dashboard Metrics
        try {
          const invRes = await dashboardApi.getInvestorMetrics();
          if (invRes) setInvestorMetrics(invRes);
        } catch (err: any) {
          if (err?.code === 'FORBIDDEN' || err?.message?.includes('Role')) {
            setApiError('Access denied: Backend session requires INVESTOR role profile attestation.');
          } else {
            setApiError(err?.message || 'Failed to fetch investor metrics from API');
          }
        }

        // Fetch My Fundings
        try {
          const fundingsRes = await fundingApi.getMyFundings();
          if (fundingsRes && Array.isArray(fundingsRes.items)) {
            setUserFundings(fundingsRes.items);
          }
        } catch {
          // Ignore secondary fetch errors
        }
      } else {
        // Fetch Business Dashboard Metrics
        try {
          const bizRes = await dashboardApi.getBusinessMetrics();
          if (bizRes) setBusinessMetrics(bizRes);
        } catch (err: any) {
          if (err?.code === 'FORBIDDEN' || err?.message?.includes('Role')) {
            setApiError('Access denied: Backend session requires BUSINESS role profile attestation.');
          } else {
            setApiError(err?.message || 'Failed to fetch business metrics from API');
          }
        }

        // Fetch My Receivables
        try {
          const recRes = await receivablesApi.getMyReceivables(1, 20);
          if (recRes && Array.isArray(recRes.items)) {
            setUserReceivables(recRes.items);
          }
        } catch {
          // Ignore secondary fetch errors
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (contextLoading) return;
    fetchMetrics();
  }, [isInvestor, contextLoading]);

  // Construct Stats Cards strictly from API data with 0 defaults (NO fake fallback numbers)
  const businessStats: StatCard[] = [
    {
      label: 'Total Receivables',
      value: businessMetrics?.stats?.totalReceivables ?? userReceivables.length ?? 0,
      accent: '#ffb6b9',
      sublabel: 'Registered invoice assets',
    },
    {
      label: 'Active sBTC Funding',
      value: `${businessMetrics?.stats?.activeFunding ?? '0.0000'} sBTC`,
      accent: '#a8ff3e',
      sublabel: 'Drawn liquidity pool',
    },
    {
      label: 'Pending Verification',
      value: businessMetrics?.stats?.pendingVerification ?? userReceivables.filter(r => r.verificationStatus === 'PENDING').length ?? 0,
      accent: '#fef08a',
      sublabel: 'Awaiting attestation',
    },
    {
      label: 'Settled / Repaid',
      value: businessMetrics?.stats?.repaid ?? userReceivables.filter(r => r.status === 'REPAID').length ?? 0,
      accent: '#22d3ee',
      sublabel: 'Fully settled in Clarity',
    },
  ];

  const investorStats: StatCard[] = [
    {
      label: 'Total sBTC Deployed',
      value: `${investorMetrics?.stats?.totalFunded ?? '0.0000'} sBTC`,
      accent: '#a8ff3e',
      sublabel: 'Active sBTC capital',
    },
    {
      label: 'Active Positions',
      value: userFundings.length > 0 ? userFundings.length : (investorMetrics?.recentFunding?.length ?? 0),
      accent: '#c4b5fd',
      sublabel: 'Funded trade receivables',
    },
    {
      label: 'Repaid Capital',
      value: `${investorMetrics?.stats?.repaid ?? '0.0000'} sBTC`,
      accent: '#fef08a',
      sublabel: 'Settlement completed',
    },
    {
      label: 'Wallet sBTC Balance',
      value: `${liveSbtcBalance !== null ? liveSbtcBalance : wallet.sbtcBalance} sBTC`,
      accent: '#22d3ee',
      sublabel: 'Available liquidity',
    },
  ];

  const stats = isInvestor ? investorStats : businessStats;

  // Build Recent Items List strictly from API data (NO fake hardcoded items)
  const getRecentBusinessItems = () => {
    if (userReceivables.length > 0) {
      return userReceivables.map((r) => ({
        id: r.id,
        title: r.title || `Invoice ${r.invoiceNumber || r.id}`,
        amountUsd: r.amountUsd || r.amount || 0,
        status: r.status || 'DRAFT',
        verificationStatus: r.verificationStatus || 'PENDING',
        createdAt: r.createdAt || new Date().toISOString(),
      }));
    }
    if (businessMetrics?.recentReceivables && businessMetrics.recentReceivables.length > 0) {
      return businessMetrics.recentReceivables;
    }
    return [];
  };

  const getRecentInvestorItems = () => {
    if (userFundings.length > 0) {
      return userFundings.map((f) => ({
        id: f.id || f.receivableId,
        businessName: f.businessName || 'Business Owner',
        amountSbtc: f.amountSbtc || '0.0000',
        status: f.status || 'PENDING',
        fundedAt: f.fundedAt || new Date().toISOString(),
      }));
    }
    if (investorMetrics?.recentFunding && investorMetrics.recentFunding.length > 0) {
      return investorMetrics.recentFunding;
    }
    return [];
  };

  const recentItems = isInvestor ? getRecentInvestorItems() : getRecentBusinessItems();

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
      <div className="mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div className="space-y-1">
         
            <h1 className="font-syne text-[1.6rem] font-medium leading-tight text-black">
              Welcome back,{' '}
              <span className="text-[#6B46C1]">
                {isInvestor
                  ? user?.investorProfile?.displayName || 'Capital Investor'
                  : user?.businessProfile?.companyName || 'Business Owner'}
              </span>
            </h1>
            <p className="text-[13px] text-gray-600">
              {isInvestor
                ? 'Track your sBTC trade receivable investments & yield settlements.'
                : 'Manage invoice registrations, verification status, and sBTC funding.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchMetrics(true)}
            disabled={isRefreshing || loading}
            className="neo-border bg-[#f7f7f7] hover:bg-white px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}><RefreshCcw/></span>
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {/* API Error / Role Mismatch Notification */}
        {apiError && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-bold text-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-syne">
            <div className="flex items-center gap-2">
              <span>⚠️ Notice:</span>
              <span>{apiError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/get-started"
                className="neo-border bg-white px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              >
                Complete Registration →
              </Link>
              <button onClick={() => setApiError(null)} className="font-bold text-sm">✕</button>
            </div>
          </div>
        )}

        {/* Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCardView key={s.label} {...s} />
          ))}
        </div>

        {/* Recent Activity / List */}
        <div className="neo-border-thick bg-white w-full p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <h2 className="font-syne text-[1.2rem] font-medium text-black">
                {isInvestor ? 'Recent Funding Transactions' : 'Registered Receivables'}
              </h2>
       
            </div>
            <Link to={isInvestor ? "/investor/fundings" : "/dashboard/receivables"} className="text-[13px] font-bold text-[#6B46C1] hover:underline">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-medium text-gray-500 animate-pulse space-y-2">
                     <div className="text-xl inline-block">

<ScaleLoader color="#000000" speedMultiplier={0.9} /></div>
              <div>Fetching metrics...</div>
            </div>
          ) : recentItems.length === 0 ? (
            /* Clean Empty State when no API data exists */
            <div className="py-8 text-center text-xs font-syne neo-border bg-[#f7f7f7] p-6 space-y-3">
              <div className="text-2xl">{isInvestor ? '💰' : '📋'}</div>
              <div className="font-bold text-black text-sm">
                {isInvestor ? 'No Active Funding Positions Yet' : 'No Registered Receivables Yet'}
              </div>
              <p className="text-gray-600 max-w-sm mx-auto">
                {isInvestor
                  ? "You haven't funded any trade receivables yet. Explore open marketplace opportunities to deploy sBTC capital."
                  : "You haven't registered any trade receivables yet. Submit an invoice to start drawing down sBTC working capital."}
              </p>
              <Link
                to={isInvestor ? "/receivable" : "/submit-receivable"}
                className={`inline-block neo-border px-4 py-2 font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 ${
                  isInvestor ? 'bg-[#c4b5fd]' : 'bg-[#a8ff3e]'
                }`}
              >
                {isInvestor ? 'Explore Marketplace →' : '+ Submit Receivable'}
              </Link>
            </div>
          ) : isInvestor ? (
            <div className="space-y-3">
              {recentItems.map((f: any) => (
                <Link
                  key={f.id}
                  to={`/investor/fundings/${f.id}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-black/10 bg-[#f7f7f7] p-4 hover:border-black/40 hover:bg-white transition-all group font-syne neo-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center bg-white neo-border group-hover:bg-[#a8ff3e] shrink-0">
                      <ClockIcon />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-black block">{f.businessName}</span>
                      <span className="text-xs text-gray-600 font-mono">
                        {f.amountSbtc} sBTC funded • {f.fundedAt ? new Date(f.fundedAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>
                  <span className="neo-border px-3 py-1 text-xs font-bold bg-[#a8ff3e] text-black">
                    {f.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((r: any) => (
                <Link
                  key={r.id}
                  to={`/receivables/${r.id}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-black/10 bg-[#f7f7f7] p-4 hover:border-black/40 hover:bg-white transition-all group font-syne neo-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center bg-white neo-border group-hover:bg-[#a8ff3e] shrink-0">
                      <ClockIcon />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-black block">{r.title}</span>
                      <span className="text-xs text-gray-600 font-mono">
                        ${typeof r.amountUsd === 'number' ? r.amountUsd.toLocaleString() : r.amountUsd} USD • Registered {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="neo-border px-2.5 py-0.5 text-[10px] font-bold bg-[#22d3ee] text-black">
                      {r.verificationStatus || 'VERIFIED'}
                    </span>
                    <span className="neo-border px-3 py-1 text-xs font-bold bg-[#c4b5fd] text-black">
                      {r.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Role CTA Banner */}
        {isInvestor ? (
          <div className="neo-border-thick bg-[#6B46C1] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-syne text-[1.15rem] font-bold text-white">
                Explore Verified Receivables
              </h3>
              <p className="mt-1 text-[13px] text-white/80 max-w-[420px]">
                Deploy sBTC into verified short-term trade finance opportunities with transparent Clarity contract settlement.
              </p>
            </div>
            <Link
              to="/receivable"
              className="relative z-10 shrink-0 bg-[#a8ff3e] px-5 py-2.5 font-bold text-black neo-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1"
            >
              Explore Receivables →
            </Link>
          </div>
        ) : (
          <div className="neo-border-thick bg-[#6B46C1] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-syne text-[1.15rem] font-bold text-white">
                Ready to submit a new receivable?
              </h3>
              <p className="mt-1 text-[13px] text-white/80 max-w-[420px]">
                Get your business invoice verified and access instant sBTC working capital.
              </p>
            </div>
            <Link
              to="/dashboard/submit"
              className="relative z-10 shrink-0 bg-[#a8ff3e] px-5 py-2.5 font-bold text-black neo-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1"
            >
              Submit Receivable →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};