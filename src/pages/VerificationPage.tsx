import React, { useState } from 'react';
import { verificationApi } from '../lib/api';

interface TimelineStep {
  title: string;
  description: string;
  date: string;
  done: boolean;
}

const steps: TimelineStep[] = [
  { title: 'Submitted', description: 'POST /v1/receivables asset payload registered.', date: 'Just now', done: true },
  { title: 'Verification Initiated', description: 'POST /v1/verification/receivables/:id triggered.', date: 'Just now', done: true },
  { title: 'Business Profile Verified', description: 'Business registration and tax ID confirmed.', date: 'In progress', done: true },
  { title: 'Document SHA-256 Hashed', description: 'Document digest anchored on Stacks testnet.', date: 'Completed', done: true },
  { title: 'Verification Completed', description: 'Asset marked OPEN_FOR_FUNDING on marketplace.', date: 'Active', done: true },
];

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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TimelineRow = ({ step, isLast }: { step: TimelineStep; isLast: boolean }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center  neo-border bg-[#a8ff3e]">
        <CheckIcon />
      </div>
      {!isLast && <div className="w-[3px] flex-1 bg-black/15 my-1" />}
    </div>

    <div className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 font-syne">
        <span className="text-[15px] font-extrabold text-black">{step.title}</span>
        <span className="text-[11px] font-bold text-gray-400">{step.date}</span>
      </div>
      <p className="mt-0.5 text-[13px] font-semibold text-gray-600">{step.description}</p>
    </div>
  </div>
);

export const VerificationPage: React.FC = () => {
  const [verifying, setVerifying] = useState(false);
  const [verifiedNotes, setVerifiedNotes] = useState('Verified documentation and underlying invoice with verifier node attestation.');
  const [status, setStatus] = useState<'PENDING' | 'VERIFIED'>('VERIFIED');

  const handleCompleteVerification = async () => {
    setVerifying(true);
    try {
      await verificationApi.complete('ver_445566', 'VERIFIED', verifiedNotes);
      setStatus('VERIFIED');
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
      <div className="mx-auto max-w-[680px] space-y-6">
        {/* Header */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="font-syne text-[1.6rem] font-extrabold leading-tight text-black">
            Verification <span className="text-[#6B46C1]">Status & API Node</span>
          </h1>
          <p className="mt-1 text-[14px] font-semibold text-gray-600">
            Track off-chain verification attestation and complete node approval via POST /v1/verification/:id/complete.
          </p>
        </div>

        {/* Receivable Summary Bar */}
        <div className="neo-border-thick bg-white rounded-[24px] p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-syne text-[16px] font-extrabold text-black">Receivable #rec_112233</div>
            <div className="mt-0.5 text-[12px] font-semibold text-gray-500">Method: PILOT_REVIEW (Off-Chain Node)</div>
          </div>
          <span className=" neo-border bg-[#a8ff3e] px-3 py-1 text-[12px] font-bold text-black">
            {status}
          </span>
        </div>

        {/* Timeline */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {steps.map((step, i) => (
            <TimelineRow key={step.title} step={step} isLast={i === steps.length - 1} />
          ))}
        </div>

        {/* Verification Node Controls */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h2 className="font-syne text-[1.1rem] font-extrabold text-black">Verifier Action (POST /v1/verification/:id/complete)</h2>
          <div className="space-y-3">
            <textarea
              value={verifiedNotes}
              onChange={(e) => setVerifiedNotes(e.target.value)}
              className="w-full rounded-[14px] neo-border bg-[#f7f7f7] p-3 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e]"
              rows={3}
            />
            <button
              onClick={handleCompleteVerification}
              disabled={verifying}
              className="w-full  neo-border bg-[#a8ff3e] py-3 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              {verifying ? 'Submitting Verification Attestation...' : '✓ Complete Verification & Open for Funding'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};