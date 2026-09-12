import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { StatusHistoryTimeline } from '../components/modular/receivable/StatusHistoryTimeline';
import { transactionsApi, receivablesApi } from '../lib/api';
import { friendlyErrorMessage, isOffchainPlaceholderTx } from '../lib/errors';
import type { TransactionProof } from '../types/api';

export const TransparencyLogPage: React.FC = () => {
  const [txHashInput, setTxHashInput] = useState('');
  const [proof, setProof] = useState<TransactionProof | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [receivableId, setReceivableId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookupProof = async () => {
    if (!txHashInput.trim()) return;
    setLoadingProof(true);
    setError(null);
    try {
      const res = await transactionsApi.getProof(txHashInput.trim());
      setProof(res);
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Transaction not found.'));
      setProof(null);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleLoadActivity = async () => {
    if (!receivableId.trim()) return;
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await receivablesApi.getActivity(receivableId.trim());
      const mapped = (res.items || []).map((act: any) => ({
        id: act.id,
        receivableId: receivableId.trim(),
        status: act.type,
        statusLabel: act.type,
        txHash: act.txHash,
        blockHeight: act.blockHeight || 0,
        timestamp: act.createdAt,
        actor: (act.metadata as any)?.actor || 'chain / backend event',
      }));
      setEvents(mapped);
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Activity not found for that receivable.'));
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  return (
    <div className="space-y-6 font-syne">
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-syne text-xs font-bold text-[#6B46C1]">
          <span>03 / CAPITAL RAIL</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mt-1">
          Status History & Transparency Log
        </h1>
        <p className="text-gray-600 text-sm font-semibold mt-1">
          Live chain truth via GET /transactions/:txHash (#38) and per-receivable timelines via GET
          /receivables/:id/activity (#20). txHash is null until a real Stacks tx exists — off-chain
          placeholders (def_tx_…) are never presented as chain proofs.
        </p>
      </div>

      {error && (
        <div className="neo-border bg-[#ffb6b9] p-3 text-xs font-bold text-black flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Receivable activity */}
      <Card className="space-y-4 font-syne">
        <h2 className="font-extrabold text-black text-lg">Receivable timeline (GET /v1/receivables/:id/activity)</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={receivableId}
            onChange={(e) => setReceivableId(e.target.value)}
            placeholder="Enter receivable id (rec_…)…"
            className="flex-1 neo-border bg-[#f7f7f7] px-4 py-2.5 text-xs font-mono font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e]"
          />
          <button
            onClick={handleLoadActivity}
            disabled={loadingEvents}
            className="neo-border bg-[#22d3ee] px-6 py-2.5 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loadingEvents ? 'Loading timeline…' : 'Load Timeline'}
          </button>
        </div>
      </Card>

      {/* Transaction Proof Lookup */}
      <Card className="space-y-4 font-syne">
        <h2 className="font-extrabold text-black text-lg">Lookup Transaction Proof (GET /v1/transactions/:txHash)</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={txHashInput}
            onChange={(e) => setTxHashInput(e.target.value)}
            placeholder="Enter Stacks Tx Hash..."
            className="flex-1 neo-border bg-[#f7f7f7] px-4 py-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e]"
          />
          <button
            onClick={handleLookupProof}
            disabled={loadingProof}
            className="neo-border bg-[#a8ff3e] px-6 py-2.5 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            {loadingProof ? 'Fetching Proof...' : 'Verify On-Chain Proof'}
          </button>
        </div>

        {proof && (
          <div className="mt-3 rounded-[18px] neo-border bg-[#f7f7f7] p-4 text-xs space-y-2">
            <div className="flex justify-between font-bold gap-3">
              <span className="text-gray-500">Tx Hash:</span>
              <span className="text-black font-mono truncate max-w-[280px]">{proof.txHash}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">On-chain:</span>
              <span className="text-black">{proof.isOnchain ? 'yes' : 'off-chain record'}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Status:</span>
              <span className="bg-[#a8ff3e] text-black px-2 py-0.5 rounded neo-border">{proof.status}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Block Height:</span>
              <span className="text-black">Block #{proof.blockHeight ?? '—'}</span>
            </div>
            {proof.txHash && isOffchainPlaceholderTx(proof.txHash) && (
              <p className="text-[11px] text-gray-600">Off-chain placeholder — not a Stacks transaction, no explorer link.</p>
            )}
          </div>
        )}
      </Card>

      <Card className="space-y-6">
        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No timeline loaded yet — enter a receivable id above to see its live transparency events.
          </div>
        ) : (
          <StatusHistoryTimeline events={events as any} />
        )}
      </Card>
    </div>
  );
};
