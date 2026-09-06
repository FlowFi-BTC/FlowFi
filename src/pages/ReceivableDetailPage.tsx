import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReceivable } from '../hooks/useReceivable';
import { useWallet } from '../hooks/useWallet';
import { MOCK_VERIFICATION_NOTE } from '../data/mockData';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { VerificationNoteModal } from '../components/modular/receivable/VerificationNoteModal';
import { FundingModal } from '../components/modular/receivable/FundingModal';
import { StatusHistoryTimeline } from '../components/modular/receivable/StatusHistoryTimeline';

export const ReceivableDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const receivableId = id ? parseInt(id, 10) : 1;

  const {
    receivable,
    events,
    isProcessing,
    fundReceivable,
    markRepaid,
    markDefaulted,
    resetStatus,
  } = useReceivable(receivableId);

  const { wallet } = useWallet();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  return (
    <div className="space-y-8 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 font-syne text-xs font-bold text-gray-600">
        <Link to="/dashboard" className="hover:text-black hover:underline">Overview</Link>
        <span>/</span>
        <span className="text-black font-extrabold">Receivable #{receivable.id}</span>
      </div>

      {/* Hero Header */}
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight">
              Trade Receivable #{receivable.id}
            </h1>
            <StatusBadge status={receivable.status} />
          </div>
          <p className="text-xs text-gray-600 font-syne font-bold mt-2">
            Invoice Ref: <span className="text-black">{receivable.invoiceNumber}</span> • Counterparty: <span className="text-black">{receivable.counterparty}</span>
          </p>
        </div>

        {/* Verification Note Modal Trigger */}
        <Button
          variant="outline"
          size="md"
          onClick={() => setIsVerificationModalOpen(true)}
          className="self-start md:self-auto font-bold text-xs"
        >
          🔍 View Off-Chain Verification Note
        </Button>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Cols: Core Details & Contract State */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-6">
            <h3 className="font-extrabold text-black text-lg border-b-2 border-black pb-3">
              On-Chain Contract State (Clarity Map Entry)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-syne text-xs">
              <div className="bg-[#f7f7f7] p-4 rounded-[18px] neo-border">
                <span className="text-gray-600 block mb-1 font-bold">RECEIVABLE AMOUNT</span>
                <span className="text-black font-black text-xl">
                  {(receivable.amount / 100000000).toFixed(2)} sBTC
                </span>
                <span className="text-gray-600 block text-[11px] font-bold mt-1">
                  250,000,000 micro-units (${receivable.amountUsd.toLocaleString()} USD)
                </span>
              </div>

              <div className="bg-[#f7f7f7] p-4 rounded-[18px] neo-border">
                <span className="text-gray-600 block mb-1 font-bold">DUE BLOCK TARGET</span>
                <span className="text-black font-black text-xl">
                  Block #{receivable.dueBlock}
                </span>
                <span className="text-gray-600 block text-[11px] font-bold mt-1">
                  Est. {receivable.dueDateEstimated}
                </span>
              </div>
            </div>

            {/* Borrower & Capital Provider Address */}
            <div className="space-y-3 font-syne text-xs">
              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4">
                <span className="text-gray-600 block text-[10px] uppercase font-sans font-extrabold">
                  Borrower Principal (Real-World Business)
                </span>
                <div className="text-black font-bold truncate mt-1">{receivable.borrower}</div>
                <div className="text-gray-700 text-[11px] font-sans font-bold mt-0.5">
                  {receivable.borrowerName}
                </div>
              </div>

              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4">
                <span className="text-gray-600 block text-[10px] uppercase font-sans font-extrabold">
                  Capital Provider Principal (sBTC Holder)
                </span>
                {receivable.provider ? (
                  <>
                    <div className="text-[#6B46C1] font-bold truncate mt-1">{receivable.provider}</div>
                    <div className="text-gray-700 text-[11px] font-sans font-bold mt-0.5">
                      {receivable.providerName}
                    </div>
                  </>
                ) : (
                  <div className="text-black font-bold text-xs mt-1 bg-[#fef08a] inline-block px-2 py-0.5 rounded neo-border">Unfunded (Awaiting Provider)</div>
                )}
              </div>

              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4">
                <span className="text-gray-600 block text-[10px] uppercase font-sans font-extrabold">
                  Off-Chain Verification Hash (doc-hash)
                </span>
                <div className="text-black font-syne text-[11px] font-bold truncate mt-1">
                  {receivable.docHash}
                </div>
              </div>
            </div>
          </Card>

          {/* Status History Timeline */}
          <Card>
            <StatusHistoryTimeline events={events} />
          </Card>
        </div>

        {/* Right 1-Col: Contract Actions & Interactive Panel */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="border-b-2 border-black pb-3">
              <h3 className="font-extrabold text-black text-lg">Contract Operations</h3>
              <p className="text-xs text-gray-600 font-syne font-bold">Clarity Public Functions</p>
            </div>

            {/* Explainer Note */}
            <div className="rounded-[18px] neo-border bg-[#c4b5fd] p-4 text-xs text-black leading-relaxed font-sans font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              "This pilot moves 2.50 sBTC capital into one verified real-world receivable. Settlement infrastructure connecting Bitcoin holders directly to real-economy cash flows."
            </div>

            {/* Conditional Action Buttons */}
            <div className="space-y-3 pt-2">
              {receivable.status === 0 && (
                <Button
                  variant="primary"
                  className="w-full py-3 text-sm"
                  isLoading={isProcessing}
                  onClick={() => setIsFundingModalOpen(true)}
                >
                  ⚡ Fund This Receivable (2.50 sBTC)
                </Button>
              )}

              {receivable.status === 1 && (
                <>
                  <Button
                    variant="primary"
                    className="w-full py-3"
                    isLoading={isProcessing}
                    onClick={() =>
                      markRepaid(
                        wallet.address || 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
                      )
                    }
                  >
                    ✓ Mark Receivable Repaid
                  </Button>

                  <Button
                    variant="danger"
                    className="w-full py-2.5"
                    isLoading={isProcessing}
                    onClick={() =>
                      markDefaulted(
                        wallet.address || 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
                      )
                    }
                  >
                    ⚠ Mark Receivable Defaulted
                  </Button>
                </>
              )}

              {(receivable.status === 2 || receivable.status === 3) && (
                <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 text-center">
                  <span className="text-xs font-syne font-bold text-gray-600 block mb-2">
                    Receivable Lifecycle Complete
                  </span>
                  <Badge variant={receivable.status === 2 ? 'emerald' : 'rose'} size="md">
                    {receivable.status === 2 ? 'FULLY REPAID' : 'DEFAULT RECORDED'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Interactive Testing Controls */}
            <div className="pt-4 border-t-2 border-black">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-2 font-syne">
                Interactive State Testing Controls
              </span>
              <div className="grid grid-cols-4 gap-1.5 font-syne text-[10px] font-bold">
                <button
                  onClick={() => resetStatus(0)}
                  className={`py-1.5 rounded-full neo-border transition-transform hover:-translate-y-0.5 ${
                    receivable.status === 0
                      ? 'bg-[#fef08a] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Reg. (0)
                </button>
                <button
                  onClick={() => resetStatus(1)}
                  className={`py-1.5 rounded-full neo-border transition-transform hover:-translate-y-0.5 ${
                    receivable.status === 1
                      ? 'bg-[#22d3ee] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Fund (1)
                </button>
                <button
                  onClick={() => resetStatus(2)}
                  className={`py-1.5 rounded-full neo-border transition-transform hover:-translate-y-0.5 ${
                    receivable.status === 2
                      ? 'bg-[#a8ff3e] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Repaid (2)
                </button>
                <button
                  onClick={() => resetStatus(3)}
                  className={`py-1.5 rounded-full neo-border transition-transform hover:-translate-y-0.5 ${
                    receivable.status === 3
                      ? 'bg-[#ffb6b9] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Def. (3)
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Verification Note Modal Component */}
      <VerificationNoteModal
        note={MOCK_VERIFICATION_NOTE}
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* Funding Modal Component */}
      <FundingModal
        receivable={receivable}
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
        onConfirmFund={(providerAddr) => {
          fundReceivable(providerAddr);
        }}
      />
    </div>
  );
};
