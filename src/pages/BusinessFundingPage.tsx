import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { receivablesApi, fundingApi } from '../lib/api';
import { useOnchainAction, phaseLabel } from '../hooks/useOnchainAction';
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
 * /dashboard/funding — same #12 call, filtered to FUNDED (+ repay action #35/#36).
 * Repay is gated by escrow release — the prepare response carries readyToRepay.
 */
export const BusinessFundingPage: React.FC = () => {
  const [items, setItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const repay = useOnchainAction();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receivablesApi.getMyReceivables(1, 50);
      setItems((res.items || []).filter((r) => r.status === 'FUNDED'));
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Failed to load funded receivables.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRepay = async (receivable: Receivable) => {
    const fundingId = (receivable.funding as any)?.id;
    if (!fundingId) {
      setError('No funding record attached to this receivable yet.');
      return;
    }
    setError(null);
    try {
      await repay.run({
        prepare: (key) => fundingApi.prepareRepayment(fundingId, key),
        confirm: (prepared: any, txHash, key) => {
          if (prepared?.readyToRepay === false) {
            throw { code: 'FUNDING_NOT_CONFIRMED', message: prepared.warning || 'Waiting on release' };
          }
          return fundingApi.confirmRepayment(fundingId, { txHash, operationId: prepared.operationId }, key);
        },
        onDone: () => load(),
      });
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
    }
  };

  const busyLabel = phaseLabel(repay.phase);

  return (
    <RequireRole allow="BUSINESS">
      <div className="space-y-6 font-syne">
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="text-[1.6rem] font-medium text-black">Active Funding</h1>
          <p className="mt-1 text-[13px] text-gray-600">
            Receivables currently FUNDED — repay here once the escrow release confirms.
          </p>
        </div>

        {error && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 text-xs font-bold text-black flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}
        {busyLabel && (
          <div className="neo-border bg-[#fef08a] p-3 text-xs font-bold text-black animate-pulse">{busyLabel}</div>
        )}

        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
          {loading ? (
            <div className="py-10 text-center text-xs text-gray-500 animate-pulse">
              <ScaleLoader color="#000000" speedMultiplier={0.9} />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center neo-border bg-[#f7f7f7] p-6 text-xs text-gray-600">
              No FUNDED receivables right now. Funded items appear here with a repay action.
            </div>
          ) : (
            items.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 neo-border bg-[#f7f7f7] p-4">
                <div>
                  <Link to={`/receivables/${r.id}`} className="text-sm font-bold text-black hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-gray-600 font-mono">
                    {r.funding?.amountSbtc || '—'} sBTC • due {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
                  </div>
                </div>
                <button
                  onClick={() => handleRepay(r)}
                  disabled={repay.isBusy}
                  className="neo-border bg-[#a8ff3e] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-50"
                >
                  ✓ Repay Receivable
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </RequireRole>
  );
};
