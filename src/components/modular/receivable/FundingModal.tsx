import React, { useState } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { fundingApi, newIdempotencyKey, transactionsApi } from '../../../lib/api';
import { signAndBroadcastPrepare } from '../../../lib/stacks';
import { friendlyErrorMessage } from '../../../lib/errors';

interface FundingModalProps {
  receivable: {
    id: string | number;
    title?: string;
    amountUsd?: number | string;
    invoiceNumber?: string | null;
    businessName?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirmFund?: (providerAddress: string) => Promise<void> | void;
}

export const FundingModal: React.FC<FundingModalProps> = ({
  receivable,
  isOpen,
  onClose,
  onConfirmFund,
}) => {
  const { wallet, connect } = useWallet();
  const [amountInput, setAmountInput] = useState('');
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'signing' | 'confirming' | 'polling' | 'done'>('idle');
  const [preparedSbtc, setPreparedSbtc] = useState<string | null>(null);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const recId = String(receivable.id);
  const busy = phase !== 'idle' && phase !== 'done';

  const phaseHint =
    phase === 'preparing'
      ? 'Validating against the registered funding target…'
      : phase === 'signing'
      ? 'Waiting for wallet signature… (cancel returns here silently)'
      : phase === 'confirming'
      ? 'Recording broadcast…'
      : phase === 'polling'
      ? 'Confirming on-chain… (CONFIRMING → CONFIRMED)'
      : null;

  const handleConfirm = async () => {
    setError(null);
    const requested = amountInput.trim();
    if (!requested || Number(requested) <= 0) {
      setError('Enter the sBTC amount to fund.');
      return;
    }
    const key = newIdempotencyKey();
    setPhase('preparing');
    try {
      // 1. Prepare (#29) — backend validates amountSbtc against the REGISTERED target.
      //    Display prepared.fundingAmount as truth, not the typed input.
      const prepRes = await fundingApi.prepareFunding(recId, requested, key);
      setPreparedSbtc(prepRes.fundingAmount?.sbtc ?? prepRes.amountSbtc);

      // 2. Wallet signs the exact registry-derived payload (amount is NOT an argument).
      setPhase('signing');
      let broadcastHash: string;
      try {
        broadcastHash = await signAndBroadcastPrepare(prepRes.transaction);
      } catch {
        // user cancelled — silent return, NO confirm call
        setPhase('idle');
        return;
      }

      // 3. Confirm (#30) with fundingId + operationId so the backend resolves the exact intent.
      setPhase('confirming');
      await fundingApi.confirmFunding(
        { fundingId: prepRes.fundingId, txHash: broadcastHash, operationId: prepRes.operationId },
        key,
      );
      setTxHash(broadcastHash);

      // 4. Poll until the indexer flips PENDING → ACTIVE / FUNDED.
      setPhase('polling');
      try {
        await transactionsApi.pollTransaction(broadcastHash);
      } catch (pollErr) {
        console.warn('Funding confirmation polling note:', pollErr);
      }

      setPhase('done');
      if (onConfirmFund) await onConfirmFund(wallet.address || '');
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
      setPhase('idle');
    }
  };

  const closeAndReset = () => {
    setPhase('idle');
    setError(null);
    setPreparedSbtc(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 font-syne selection:bg-[#a8ff3e]">
      <div className="w-full max-w-lg rounded-[28px] neo-border-thick bg-white p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div>
            <span className="font-syne text-xs font-bold text-[#6B46C1]">
              sBTC FUNDING FLOW CONFIRMATION
            </span>
            <h3 className="font-syne font-black text-black text-xl md:text-2xl tracking-tight mt-0.5">
              Confirm sBTC Funding
            </h3>
          </div>
          <button
            onClick={closeAndReset}
            className="h-9 w-9  neo-border bg-[#f7f7f7] text-black font-bold flex items-center justify-center hover:bg-gray-200 transition-transform active:translate-y-0.5"
          >
            ✕
          </button>
        </div>

        {phase === 'done' ? (
          <div className="py-8 text-center space-y-4 font-syne">
            <div className="mx-auto flex h-16 w-16 items-center justify-center  bg-[#a8ff3e] neo-border text-2xl font-black">
              ✓
            </div>
            <h4 className="text-xl font-black text-black">Funding Broadcasted!</h4>
            <p className="text-xs font-bold text-gray-600">
              Recorded via POST /v1/fundings/confirm — polling confirmation flips funding to FUNDED.
            </p>
            <div className="bg-[#f7f7f7] neo-border rounded-xl p-3 text-[11px] font-mono text-black font-bold break-all">
              {txHash}
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              className="mt-2  neo-border bg-[#a8ff3e] px-6 py-2.5 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Receivable Summary Box */}
            <div className="rounded-[20px] neo-border bg-[#f7f7f7] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Target Receivable
                </span>
                <span className="font-syne text-xs font-extrabold text-black bg-[#a8ff3e] px-2.5 py-0.5  neo-border">
                  #{receivable.id}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  sBTC amount (validated against the registered target)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.01"
                  disabled={busy}
                  className="w-full neo-border bg-white px-4 py-2.5 text-sm font-mono font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#6B46C1]"
                />
                {preparedSbtc && (
                  <p className="mt-1.5 text-[11px] font-bold text-[#6B46C1]">
                    Authoritative target: {preparedSbtc} sBTC — the wallet signs exactly this.
                  </p>
                )}
                <p className="mt-1 text-[11px] text-gray-600">
                  {receivable.title || ''} {receivable.amountUsd ? `($${receivable.amountUsd} USD)` : ''}
                </p>
              </div>
            </div>

            {error && (
              <div className="neo-border bg-[#ffb6b9] p-3 text-xs font-bold text-black flex items-center justify-between gap-2">
                <span>⚠️ {error}</span>
                <button onClick={() => setError(null)} className="font-bold">✕</button>
              </div>
            )}
            {phaseHint && (
              <div className="neo-border bg-[#fef08a] p-3 text-xs font-bold text-black animate-pulse">
                {phaseHint}
              </div>
            )}

            {/* Wallet Status Banner */}
            {!wallet.isConnected ? (
              <div className="rounded-[18px] neo-border bg-[#fef08a] p-4 text-xs font-syne text-black space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="font-extrabold flex items-center gap-2">
                  <span>⚠️ Wallet Not Connected</span>
                </div>
                <p className="font-semibold text-gray-700">
                  Please connect an INVESTOR wallet to execute the funding transfer (≠ business wallet, else u205).
                </p>
                <button
                  type="button"
                  onClick={() => connect()}
                  className="w-full mt-1 py-2  bg-black text-white font-extrabold text-xs neo-border shadow-[2px_2px_0px_0px_rgba(168,255,62,1)] hover:bg-[#6B46C1]"
                >
                  Connect Stacks Wallet
                </button>
              </div>
            ) : (
              <div className="rounded-[18px] neo-border bg-[#c4b5fd] p-4 font-syne text-xs text-black flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <span className="text-[10px] uppercase text-black/70 font-syne font-extrabold block">
                    Capital Provider Address
                  </span>
                  <span className="font-extrabold">
                    {wallet.address?.substring(0, 8)}...{wallet.address?.substring(wallet.address.length - 6)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-black/70 font-syne font-extrabold block">
                    Balance
                  </span>
                  <span className="font-black bg-white px-2 py-0.5 rounded neo-border">
                    {wallet.sbtcBalance} sBTC
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closeAndReset}
                disabled={busy}
                className="w-1/3 py-3  neo-border bg-[#f7f7f7] font-extrabold text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 transition-transform active:translate-y-0.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={busy || !wallet.isConnected}
                className="w-2/3 py-3  neo-border bg-[#a8ff3e] font-extrabold text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#96f028] transition-transform active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <span className="h-3 w-3  border-2 border-black border-t-transparent animate-spin" />
                    <span>{phaseHint || 'Broadcasting Tx...'}</span>
                  </>
                ) : (
                  <span>⚡ Prepare & Fund sBTC</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
