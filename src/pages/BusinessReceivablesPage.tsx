import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { receivablesApi } from '../lib/api';
import { friendlyErrorMessage } from '../lib/errors';
import { RequireRole } from '../components/auth/RequireRole';
import type { Receivable } from '../types/api';
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

/**
 * /dashboard/receivables — #12 GET /receivables/me.
 * Includes DRAFT / PENDING_VERIFICATION items the public marketplace never shows.
 */
export const BusinessReceivablesPage: React.FC = () => {
  const [items, setItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receivablesApi.getMyReceivables(1, 50);
      setItems(res.items || []);
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Failed to load your receivables.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <RequireRole allow="BUSINESS">
      <div className="space-y-6 font-syne">
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div>
            <h1 className="text-[1.6rem] font-medium text-black">My Receivables</h1>
            <p className="mt-1 text-[13px] text-gray-600">
              Your private inventory — drafts and pending items never appear on the public marketplace.
            </p>
          </div>
          <Link
            to="/dashboard/submit"
            className="neo-border bg-[#a8ff3e] px-4 py-2 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            + Submit a New Receivable
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
              <div className="mt-2">Fetching GET /receivables/me…</div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center neo-border bg-[#f7f7f7] p-6 space-y-3">
              <div className="text-2xl">📋</div>
              <div className="font-bold text-black text-sm">No receivables yet</div>
              <p className="text-gray-600 text-xs max-w-sm mx-auto">
                Submit an invoice to create your first off-chain record. Register it on-chain to open it for funding.
              </p>
              <Link
                to="/dashboard/submit"
                className="inline-block neo-border bg-[#a8ff3e] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                + Submit Receivable
              </Link>
            </div>
          ) : (
            items.map((r) => (
              <Link
                key={r.id}
                to={`/receivables/${r.id}`}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-black/10 bg-[#f7f7f7] p-4 hover:border-black/40 hover:bg-white transition-all neo-border"
              >
                <div>
                  <span className="text-sm font-bold text-black block">{r.title}</span>
                  <span className="text-xs text-gray-600 font-mono">
                    ${typeof r.amountUsd === 'string' ? r.amountUsd : r.amountUsd} • {r.documentStatus === 'NONE' ? 'evidence missing' : r.evidenceStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="neo-border px-2.5 py-0.5 text-[10px] font-bold bg-[#22d3ee] text-black">
                    {r.verificationStatus}
                  </span>
                  <span className="neo-border px-3 py-1 text-xs font-bold bg-[#c4b5fd] text-black">{r.status}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </RequireRole>
  );
};
