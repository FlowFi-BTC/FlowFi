import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, fundingApi } from '../lib/api';
import { friendlyErrorMessage } from '../lib/errors';
import { RequireRole } from '../components/auth/RequireRole';
import { useUser } from '../context/UserContext';
import type { InvestorDashboardMetrics, InvestorFundingItem } from '../types/api';
import { ScaleLoader } from 'react-spinners';

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

/** /investor — #40 GET /dashboard/investor + #10 GET /investors/me (via context). */
export const InvestorDashboardPage: React.FC = () => {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<InvestorDashboardMetrics | null>(null);
  const [fundings, setFundings] = useState<InvestorFundingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardApi.getInvestorMetrics().catch(() => null),
      fundingApi.getMyFundings().catch(() => ({ items: [] })),
    ])
      .then(([m, f]) => {
        if (m) setMetrics(m);
        setFundings((f as any)?.items || []);
        if (!m && ((f as any)?.items || []).length === 0) setError(null);
      })
      .catch((err) => setError(friendlyErrorMessage(err, 'Failed to load investor dashboard.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RequireRole allow="INVESTOR">
      <div className="space-y-6 font-syne">
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="text-[1.6rem] font-medium text-black">
            Welcome back, <span className="text-[#6B46C1]">{user?.investorProfile?.displayName || 'Capital Investor'}</span>
          </h1>
          <p className="mt-1 text-[13px] text-gray-600">Track sBTC trade receivable investments & yield settlements.</p>
        </div>

        {error && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 text-xs font-bold text-black">{`⚠️ ${error}`}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total sBTC Deployed', value: `${metrics?.stats?.totalFunded ?? '0.0000'} sBTC`, accent: '#a8ff3e' },
            { label: 'Active Positions', value: fundings.length || metrics?.recentFunding?.length || 0, accent: '#c4b5fd' },
            { label: 'Repaid Capital', value: `${metrics?.stats?.repaid ?? '0.0000'} sBTC`, accent: '#fef08a' },
          ].map((s) => (
            <div key={s.label} className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: s.accent }}>
                <RailStar className="h-4 w-4" />
              </div>
              <div className="text-2xl font-medium text-black">{s.value}</div>
              <div className="mt-1 text-[13px] text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="text-[1.2rem] font-medium text-black">My Fundings</h2>
            <Link to="/investor/fundings" className="text-[13px] font-bold text-[#6B46C1] hover:underline">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500 animate-pulse">
              <ScaleLoader color="#000000" speedMultiplier={0.9} />
            </div>
          ) : fundings.length === 0 ? (
            <div className="py-8 text-center neo-border bg-[#f7f7f7] p-6 space-y-3">
              <div className="text-2xl">💰</div>
              <div className="font-bold text-black text-sm">No Active Funding Positions Yet</div>
              <Link to="/receivable" className="inline-block neo-border bg-[#c4b5fd] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Explore Marketplace →
              </Link>
            </div>
          ) : (
            fundings.slice(0, 5).map((f) => (
              <Link key={f.id} to={`/investor/fundings/${f.id}`} className="flex items-center justify-between gap-3 border-2 border-black/10 bg-[#f7f7f7] p-4 hover:border-black/40 neo-border">
                <div>
                  <span className="text-sm font-bold text-black block">{f.businessName}</span>
                  <span className="text-xs text-gray-600 font-mono">{f.amountSbtc} sBTC funded</span>
                </div>
                <span className="neo-border px-3 py-1 text-xs font-bold bg-[#a8ff3e] text-black">{f.status}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </RequireRole>
  );
};
