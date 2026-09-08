import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { StatusHistoryTimeline } from '../components/modular/receivable/StatusHistoryTimeline';
import { transactionsApi } from '../lib/api';
import type { TransactionProof, StatusEvent } from '../types';

const INITIAL_EVENTS: StatusEvent[] = [
  {
    id: 'evt-01',
    receivableId: 'rec_112233',
    status: 'OPEN_FOR_FUNDING',
    statusLabel: 'Registered & Verified',
    txHash: '0x4f128c4129b0a485918239019238410923841029384109238410923841092384',
    blockHeight: 147210,
    timestamp: '2026-09-01T10:15:22Z',
    actor: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM (Borrower)',
  },
  {
    id: 'evt-02',
    receivableId: 'rec_112233',
    status: 'FUNDED',
    statusLabel: 'Funded',
    txHash: '0x88a104f981239041289301298301928301928301928301928301928301928301',
    blockHeight: 147285,
    timestamp: '2026-09-01T14:40:10Z',
    actor: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG (Capital Provider)',
  },
];

export const TransparencyLogPage: React.FC = () => {
  const [txHashInput, setTxHashInput] = useState('0x8f2a1c9e3b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f');
  const [proof, setProof] = useState<TransactionProof | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  const handleLookupProof = async () => {
    if (!txHashInput) return;
    setLoadingProof(true);
    try {
      const res = await transactionsApi.getProof(txHashInput);
      setProof(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProof(false);
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
          Chronological index of all Stacks testnet contract events, status transitions, and transaction proof lookup.
        </p>
      </div>

      {/* Transaction Proof Lookup */}
      <Card className="space-y-4 font-syne">
        <h2 className="font-extrabold text-black text-lg">Lookup Transaction Proof (GET /v1/transactions/:txHash)</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={txHashInput}
            onChange={(e) => setTxHashInput(e.target.value)}
            placeholder="Enter Stacks Tx Hash..."
            className="flex-1  neo-border bg-[#f7f7f7] px-4 py-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e]"
          />
          <button
            onClick={handleLookupProof}
            disabled={loadingProof}
            className=" neo-border bg-[#a8ff3e] px-6 py-2.5 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            {loadingProof ? 'Fetching Proof...' : 'Verify On-Chain Proof'}
          </button>
        </div>

        {proof && (
          <div className="mt-3 rounded-[18px] neo-border bg-[#f7f7f7] p-4 text-xs space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Tx Hash:</span>
              <span className="text-black font-mono truncate max-w-[280px]">{proof.txHash}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Status:</span>
              <span className="bg-[#a8ff3e] text-black px-2 py-0.5 rounded neo-border">{proof.status}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Block Height:</span>
              <span className="text-black">Block #{proof.blockHeight}</span>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-6">
        <StatusHistoryTimeline events={INITIAL_EVENTS} />
      </Card>
    </div>
  );
};
