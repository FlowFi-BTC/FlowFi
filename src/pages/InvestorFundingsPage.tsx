import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fundingApi } from '../lib/api';
import { friendlyErrorMessage } from '../lib/errors';
import { RequireRole } from '../components/auth/RequireRole';
import type { InvestorFundingItem } from '../types/api';
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

/** /investor/fundings — #31 GET /fundings/me (investor portfolio list). */
export const InvestorFundingsPage: React.FC = () => {
  const [items, setItems] = useState<InvestorFundingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fundingApi.getMyFundings();
      setItems(res.items || []);
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Failed to load your fundings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <RequireRole allow="INVESTOR">
      <div className="space-y-6 font-syne">
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div>
            <h1 className="text-[1.6rem] font-medium text-black">My Fundings</h1>
            <p className="mt-1 text-[13px] text-gray-600">Portfolio-style tracking across all sBTC positions.</p>
          </div>
          <Link
            to="/receivable"
            className="neo-border bg-[#a8ff3e] px-4 py-2 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            Explore Receivables →
          </Link>
        </div>

        {error && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 text-xs font-bold text-black flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}

        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
          {loading ? (
            <div className="py-10 text-center text-xs text-gray-500 animate-pulse">
              <ScaleLoader color="#000000" speedMultiplier={0.9} />
              <div className="mt-2">Fetching GET /fundings/me…</div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center neo-border bg-[#f7f7f7] p-6 space-y-3">
              <div className="text-2xl">💰</div>
              <div className="font-bold text-black text-sm">No funding positions yet</div>
              <p className="text-gray-600 text-xs max-w-sm mx-auto">
                Explore open marketplace opportunities to deploy sBTC capital.
              </p>
              <Link
                to="/receivable"
                className="inline-block neo-border bg-[#c4b5fd] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Explore Marketplace →
              </Link>
            </div>
          ) : (
            items.map((f) => (
              <Link
                key={f.id}
                to={`/investor/fundings/${f.id}`}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-black/10 bg-[#f7f7f7] p-4 hover:border-black/40 hover:bg-white transition-all neo-border"
              >
                <div>
                  <span className="text-sm font-bold text-black block">{f.businessName}</span>
                  <span className="text-xs text-gray-600 font-mono">
                    {f.amountSbtc} sBTC • due {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}
                  </span>
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
