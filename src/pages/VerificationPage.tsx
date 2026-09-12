import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { verificationApi } from '../lib/api';
import { friendlyErrorMessage } from '../lib/errors';

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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Verification log — business-level verification is one-time (#22–#28).
 * Receivable-level routes (#41/#42) are DEPRECATED and kept for backward
 * compat only. This page explains that and offers a record lookup (#43).
 */
export const VerificationPage: React.FC = () => {
  const [recordId, setRecordId] = useState('ver_445566');
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { title: 'Business registered', description: '#6 POST /v1/businesses — off-chain profile (country collected now, required on-chain later).' },
    { title: 'Off-chain review', description: '#22 start → #24 complete — business.verification.status = VERIFIED (one-time, business-level).' },
    { title: 'On-chain identity', description: '#25/#26 register-business — BUSINESS wallet signs, backend maps biz_xxx ↔ uint.' },
    { title: 'On-chain attestation', description: '#27/#28 verify-business — VERIFIER wallet only (u100 otherwise). Admin surface.' },
    { title: 'Receivable fundable', description: 'Verified Business + Invoice Evidence (#18) + On-chain Registration (#16/#17) = OPEN_FOR_FUNDING.' },
  ];

  const handleLookup = async () => {
    if (!recordId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verificationApi.getRecord(recordId.trim());
      setRecord(res);
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Verification record not found.'));
      setRecord(null);
    } finally {
      setLoading(false);
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
            Verification is one-time at the <span className="text-black">business level</span> — receivables inherit
            it. No per-receivable reviewer step.
          </p>
        </div>

        {/* Timeline */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center neo-border bg-[#a8ff3e]">
                  <CheckIcon />
                </div>
                {i !== steps.length - 1 && <div className="w-[3px] flex-1 bg-black/15 my-1" />}
              </div>
              <div className={`flex-1 ${i === steps.length - 1 ? '' : 'pb-5'}`}>
                <div className="font-syne text-[15px] font-extrabold text-black">{step.title}</div>
                <p className="mt-0.5 text-[13px] font-semibold text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
          <Link
            to="/business-verification"
            className="mt-4 block text-center w-full neo-border bg-[#a8ff3e] py-3 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            Open Business Verification →
          </Link>
        </div>

        {/* Legacy record lookup (#43) */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h2 className="font-syne text-[1.1rem] font-extrabold text-black">Legacy record lookup (GET /v1/verification/:id)</h2>
          <p className="text-xs text-gray-600">
            Receivable-level verification (#41/#42) is deprecated — new integrations must not use it. Lookup below
            is kept for backward compatibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder="ver_…"
              className="flex-1 neo-border bg-[#f7f7f7] px-4 py-2.5 text-xs font-mono font-bold text-black focus:outline-none"
            />
            <button
              onClick={handleLookup}
              disabled={loading}
              className="neo-border bg-[#22d3ee] px-6 py-2.5 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? 'Looking up…' : 'Lookup record'}
            </button>
          </div>
          {error && <div className="neo-border bg-[#ffb6b9] p-3 text-xs font-bold text-black">⚠️ {error}</div>}
          {record && (
            <div className="neo-border bg-[#f7f7f7] p-4 text-xs font-mono space-y-1 break-all">
              <div><span className="text-gray-500">id:</span> <span className="text-black font-bold">{record.id}</span></div>
              <div><span className="text-gray-500">status:</span> <span className="text-black font-bold">{record.status}</span></div>
              <div><span className="text-gray-500">method:</span> <span className="text-black font-bold">{record.method}</span></div>
              {record.verifiedAt && <div><span className="text-gray-500">verifiedAt:</span> <span className="text-black">{record.verifiedAt}</span></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
