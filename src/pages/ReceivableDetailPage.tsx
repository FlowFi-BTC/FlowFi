import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { receivablesApi, fundingApi } from '../lib/api';
import type { Receivable } from '../types/api';
import { VerificationNoteModal } from '../components/modular/receivable/VerificationNoteModal';
import { FundingModal } from '../components/modular/receivable/FundingModal';
import { StatusHistoryTimeline } from '../components/modular/receivable/StatusHistoryTimeline';


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

export const ReceivableDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useWallet();
  const isBusiness = role === 'BUSINESS' || role === 'business';

  const [receivable, setReceivable] = useState<Receivable | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [recDetails, recActivity] = await Promise.all([
        receivablesApi.getDetails(id).catch(() => null),
        receivablesApi.getActivity(id).catch(() => ({ items: [] })),
      ]);
      if (recDetails) setReceivable(recDetails);
      setActivity(Array.isArray(recActivity?.items) ? recActivity.items : []);
    } catch (err) {
      console.error('Failed to load receivable details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleRepay = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      const prepRes = await fundingApi.prepareRepayment(id);
      const simulatedHash = `0xrepay_${Date.now()}`;
      await fundingApi.confirmRepayment(prepRes.fundingId || id, simulatedHash);
      await load();
    } catch (err) {
      console.error('Repayment failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlagDefault = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await receivablesApi.flagDefault(id, 'Repayment past due date threshold');
      await load();
    } catch (err) {
      console.error('Flag default failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const eventsForTimeline = activity.map((act) => ({
    id: act.id,
    receivableId: id || 'rec_1',
    status: act.type === 'RECEIVABLE_VERIFIED' ? 0 : act.type === 'FUNDED' ? 1 : 2,
    statusLabel: act.type,
    txHash: act.txHash,
    blockHeight: act.blockHeight || 142100,
    timestamp: act.createdAt,
    actor: 'Verifier Node / Wallet Principal',
  }));

  if (loading || !receivable) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
        <div className="mx-auto neo-border-thick bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center text-xs font-bold text-gray-500 animate-pulse space-y-2">
          <div className="text-xl">⏳</div>
          <div>Loading receivable #{id} details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
      <div className="mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <Link to="/dashboard" className="hover:text-black hover:underline">Overview</Link>
          <span>/</span>
          <Link to="/receivable" className="hover:text-black hover:underline">Receivables Explorer</Link>
          <span>/</span>
          <span className="text-[#6B46C1] font-bold">{receivable.title}</span>
        </div>

        {/* Title Banner */}
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-syne text-[1.6rem] font-medium leading-tight text-black">
                {receivable.title}
              </h1>
              <span className="neo-border bg-[#a8ff3e] px-3 py-1 text-xs font-bold text-black">
                {receivable.status}
              </span>
            </div>
            <p className="text-[13px] text-gray-600 mt-2">
              ID: <span className="font-mono text-black">{receivable.id}</span> • Invoice Ref:{' '}
              <span className="text-black font-bold">{receivable.invoiceNumber || 'INV-2041'}</span> • Business:{' '}
              <span className="text-black font-bold">{receivable.businessName || receivable.business?.companyName || 'Business Owner'}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsVerificationModalOpen(true)}
            className="relative z-10 shrink-0 neo-border bg-[#f7f7f7] hover:bg-white px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 self-start md:self-auto"
          >
            🔍 View Verification Note & Hash
          </button>
        </div>

        {/* Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#a8ff3e' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black">
              ${typeof receivable.amountUsd === 'number' ? receivable.amountUsd.toLocaleString() : receivable.amountUsd}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">Valuation Amount</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">Est. 0.45 sBTC liquidity target</div>
          </div>

          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#22d3ee' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black">
              {receivable.dueDate ? new Date(receivable.dueDate).toLocaleDateString() : 'N/A'}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">Due Date Target</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">Verification: {receivable.verificationStatus || 'VERIFIED'}</div>
          </div>

          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#fef08a' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black truncate">
              {receivable.business?.companyName || receivable.businessName || 'Apex Supply Chain Ltd'}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">Borrower Principal</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
              Reg: {receivable.business?.registrationNumber || 'RC-998821'}
            </div>
          </div>

          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#c4b5fd' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black">
              {receivable.funding ? `${receivable.funding.amountSbtc} sBTC` : 'Unfunded'}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">sBTC Funding Status</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
              {receivable.funding
                ? `Tx: ${receivable.funding.fundTxHash.substring(0, 12)}...`
                : receivable.status === 'OPEN_FOR_FUNDING' || receivable.status === 'VERIFIED'
                ? 'Open for sBTC Funding'
                : receivable.status}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {receivable.description && (
              <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <h2 className="font-syne text-[1.1rem] font-medium text-black border-b-2 border-black pb-3">
                  Receivable Description
                </h2>
                <p className="text-black font-medium text-sm leading-relaxed pt-2">{receivable.description}</p>
              </div>
            )}

            {/* Status History */}
            <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <StatusHistoryTimeline events={eventsForTimeline} />
            </div>
          </div>

          {/* Right Col: Contract Operations */}
          <div className="space-y-6">
            <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="border-b-2 border-black pb-3">
                <h2 className="font-syne text-[1.1rem] font-medium text-black">Contract Operations</h2>
                <p className="text-[13px] text-gray-600">API & Stacks Contract Call</p>
              </div>

              <div className="space-y-3 pt-2">
                {(receivable.status === 'OPEN_FOR_FUNDING' || receivable.status === 'VERIFIED') && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setIsFundingModalOpen(true)}
                    className="w-full neo-border bg-[#a8ff3e] py-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-50"
                  >
                    ⚡ Fund This Receivable (sBTC)
                  </button>
                )}

                {receivable.status === 'FUNDED' && isBusiness && (
                  <>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRepay}
                      className="w-full neo-border bg-[#a8ff3e] py-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-50"
                    >
                      ✓ Repay sBTC Receivable
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleFlagDefault}
                      className="w-full neo-border bg-[#ffb6b9] py-2.5 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-50"
                    >
                      ⚠ Flag Receivable Defaulted
                    </button>
                  </>
                )}

                {receivable.status === 'REPAID' && (
                  <div className="neo-border bg-[#a8ff3e] p-4 text-center font-bold text-xs text-black">
                    RECEIVABLE FULLY REPAID & SETTLED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Note Modal */}
        <VerificationNoteModal
          note={{
            receivableId: receivable.id,
            docHash: receivable.docHash || '0x8f2d910a7b4c3e1f99a80b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e',
            reviewedBy: 'Verifier Node SP3FBR...',
            reviewedAt: receivable.createdAt,
            attestationText: 'Verified against underlying bill of lading and customs entry',
            disclaimer: 'Verified off-chain compliance attestation recorded on Stacks',
            verified: receivable.verificationStatus === 'VERIFIED',
            documents: [
              {
                name: `Invoice_${receivable.invoiceNumber || 'INV-2041'}.pdf`,
                type: 'application/pdf',
                hash: '0x8f2d910a7b4c3e1f99a80b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e',
              },
            ],
          }}
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
        />

        {/* Funding Modal */}
        <FundingModal
          receivable={receivable}
          isOpen={isFundingModalOpen}
          onClose={() => setIsFundingModalOpen(false)}
          onConfirmFund={load}
        />
      </div>
    </div>
  );
};