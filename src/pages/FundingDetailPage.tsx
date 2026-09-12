import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fundingApi, escrowApi } from '../lib/api';
import { friendlyErrorMessage, explorerTxUrl } from '../lib/errors';
import { RequireRole } from '../components/auth/RequireRole';
import type { FundingDetails, Escrow } from '../types/api';
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
 * /investor/fundings/:id — #32 GET /fundings/:id (tracking) + #37 GET /escrows/:id
 * (on-chain escrow fields: released, releaseTxHash, settledAt). Read-only for investors.
 */
export const FundingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [funding, setFunding] = useState<FundingDetails | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fundingApi.getFundingDetails(id).catch(() => null),
      escrowApi.getById(id).catch(() => null),
    ])
      .then(([f, e]) => {
        if (!f) setError('Funding record not found.');
        setFunding(f);
        setEscrow(e);
      })
      .catch((err) => setError(friendlyErrorMessage(err, 'Failed to load funding details.')))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <RequireRole allow="INVESTOR">
      <div className="space-y-6 font-syne">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <Link to="/investor/fundings" className="hover:text-black hover:underline">My Fundings</Link>
          <span>/</span>
          <span className="text-[#6B46C1] font-bold">{id}</span>
        </div>

        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="text-[1.6rem] font-medium text-black">Funding Tracking</h1>
          <p className="mt-1 text-[13px] text-gray-600">On-chain proof detail — read-only. Release & default are admin actions.</p>
        </div>

        {error && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 text-xs font-bold text-black">{`⚠️ ${error}`}</div>
        )}

        {loading || !funding ? (
          !error ? (
            <div className="neo-border-thick bg-white p-10 text-center text-xs text-gray-500 animate-pulse">
              <ScaleLoader color="#000000" speedMultiplier={0.9} />
              <div className="mt-2">Fetching GET /fundings/:id + /escrows/:id…</div>
            </div>
          ) : null
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-[11px] font-bold text-gray-500">AMOUNT</div>
                <div className="text-2xl font-medium text-black">{funding.amountSbtc} sBTC</div>
                <div className="text-[11px] text-gray-500 mt-1">{funding.receivable?.title}</div>
              </div>
              <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-[11px] font-bold text-gray-500">STATUS</div>
                <div className="text-2xl font-medium text-black">{funding.status}</div>
                <div className="text-[11px] text-gray-500 mt-1">Escrow: {escrow?.status || '—'} • Released: {escrow?.released ? '✓' : '—'}</div>
              </div>
              <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-[11px] font-bold text-gray-500">BUSINESS</div>
                <div className="text-lg font-medium text-black truncate">{funding.business?.companyName}</div>
                <div className="text-[11px] text-gray-500 mt-1">Due {funding.receivable?.dueDate ? new Date(funding.receivable.dueDate).toLocaleDateString() : '—'}</div>
              </div>
            </div>

            <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <h2 className="font-medium text-black border-b-2 border-black pb-3">Transaction trail</h2>
              {(funding.transactions || []).map((t, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 neo-border bg-[#f7f7f7] p-3 text-xs">
                  <span className="font-bold text-black">{t.type}</span>
                  {explorerTxUrl(t.txHash) ? (
                    <a href={explorerTxUrl(t.txHash)!} target="_blank" rel="noreferrer" className="font-mono text-[#6B46C1] underline truncate max-w-[280px]">
                      {t.txHash}
                    </a>
                  ) : (
                    <span className="font-mono text-gray-500">recorded off-chain, pending on-chain wiring</span>
                  )}
                  <span className="neo-border bg-white px-2 py-0.5 font-bold">{t.status}</span>
                </div>
              ))}
              {escrow?.releaseTxHash && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 neo-border bg-[#a8ff3e]/20 p-3 text-xs">
                  <span className="font-bold text-black">FUNDS_RELEASED</span>
                  <a href={explorerTxUrl(escrow.releaseTxHash)!} target="_blank" rel="noreferrer" className="font-mono text-[#6B46C1] underline truncate max-w-[280px]">
                    {escrow.releaseTxHash}
                  </a>
                  <span className="font-bold">{escrow.releaseConfirmedAt ? new Date(escrow.releaseConfirmedAt).toLocaleString() : 'confirming…'}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </RequireRole>
  );
};
