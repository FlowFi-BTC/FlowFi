import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { fundingApi, receivablesApi } from '../lib/api';
import { useOnchainAction, phaseLabel } from '../hooks/useOnchainAction';
import { friendlyErrorMessage } from '../lib/errors';
import { RequireRole } from '../components/auth/RequireRole';

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
 * /admin — minimal separate surface (BUTTON_TO_CONTRACT_MAP §§9/11 + §4 verifier note).
 * - Release Funds (#33/#34, ADMIN wallet signs release-funds; recipient fixed on-chain)
 * - Flag as Defaulted (#15, off-chain admin action in MVP — placeholder tx, not a Stacks tx)
 * - Verifier attestation (#27/#28) is documented here but signed from a verifier session.
 * Never rendered on public or business-facing pages.
 */
export const AdminPage: React.FC = () => {
  const [fundingId, setFundingId] = useState('');
  const [receivableId, setReceivableId] = useState('');
  const [reason, setReason] = useState('Receivable was not repaid past due date');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const release = useOnchainAction();

  const handleRelease = async () => {
    if (!fundingId.trim()) {
      setError('Enter a funding id (e.g. fund_…).');
      return;
    }
    setError(null);
    setResult(null);
    try {
      await release.run({
        prepare: (key) => fundingApi.prepareRelease(fundingId.trim(), key),
        confirm: (prepared: any, txHash, key) =>
          fundingApi.confirmRelease(fundingId.trim(), { txHash, operationId: prepared.operationId }, key),
        onDone: (_c, txHash) => setResult(`Release broadcast recorded: ${txHash} (CONFIRMING → poll until released)`),
      });
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
    }
  };

  const handleDefault = async () => {
    if (!receivableId.trim()) {
      setError('Enter a receivable id (e.g. rec_…).');
      return;
    }
    setError(null);
    setResult(null);
    try {
      const res = await receivablesApi.flagDefault(receivableId.trim(), reason);
      setResult(`Flagged DEFAULTED off-chain (tx placeholder ${res?.transaction?.txHash || 'def_tx_…'} — not a Stacks tx).`);
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
    }
  };

  const busyLabel = phaseLabel(release.phase);

  return (
    <RequireRole allow={['BUSINESS', 'INVESTOR']}>
      <div className="space-y-6 font-syne">
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="text-[1.6rem] font-medium text-black">Admin Surface</h1>
          <p className="mt-1 text-[13px] text-gray-600">
            Release leg + default flag + verifier attestation. Requires the admin / verifier wallet to sign —
            the recipient is fixed on-chain to the business regardless of caller.
          </p>
        </div>

        {error && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 text-xs font-bold text-black flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}
        {result && (
          <div className="neo-border-thick bg-[#a8ff3e] p-4 text-xs font-bold text-black break-all">{result}</div>
        )}
        {busyLabel && (
          <div className="neo-border bg-[#fef08a] p-3 text-xs font-bold text-black animate-pulse">{busyLabel}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="font-medium text-black border-b-2 border-black pb-3">Release Funds (#33/#34)</h2>
            <label className="block text-xs font-bold text-black">Funding ID</label>
            <input
              value={fundingId}
              onChange={(e) => setFundingId(e.target.value)}
              placeholder="fund_…"
              className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-xs font-mono text-black focus:bg-white focus:outline-none"
            />
            <button
              onClick={handleRelease}
              disabled={release.isBusy}
              className="w-full neo-border bg-[#a8ff3e] py-3 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-50"
            >
              {busyLabel || 'Prepare & Release (admin wallet) →'}
            </button>
            <p className="text-[11px] text-gray-500">
              Sign with the escrow ADMIN wallet (u200 otherwise). Required before repayment (u208).
            </p>
          </div>

          <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="font-medium text-black border-b-2 border-black pb-3">Flag as Defaulted (#15)</h2>
            <label className="block text-xs font-bold text-black">Receivable ID</label>
            <input
              value={receivableId}
              onChange={(e) => setReceivableId(e.target.value)}
              placeholder="rec_…"
              className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-xs font-mono text-black focus:bg-white focus:outline-none"
            />
            <label className="block text-xs font-bold text-black">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full neo-border bg-[#f7f7f7] p-3 text-xs text-black focus:bg-white focus:outline-none"
            />
            <button
              onClick={handleDefault}
              className="w-full neo-border bg-[#ffb6b9] py-3 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              Flag DEFAULTED (off-chain) →
            </button>
            <p className="text-[11px] text-gray-500">
              MVP: off-chain admin action — the txHash is a placeholder, never linked to explorer. Wire to
              escrow mark-default before mainnet.
            </p>
          </div>
        </div>

        <div className="neo-border-thick bg-[#f7f7f7] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-xs text-gray-700 space-y-2">
          <div className="font-bold text-black">Verifier attestation (#27/#28)</div>
          <p>
            Business attestation must be signed by a verifier session (VERIFIER_WALLETS allowlist, u100 otherwise).
            Run it from a verifier wallet via POST /verification/businesses/:id/onchain/prepare → sign → confirm.
            Business verification status itself lives at <Link to="/business-verification" className="text-[#6B46C1] underline">/business-verification</Link>.
          </p>
        </div>
      </div>
    </RequireRole>
  );
};
