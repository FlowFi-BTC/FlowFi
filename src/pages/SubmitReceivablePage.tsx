import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useWallet } from '../hooks/useWallet';

interface Step {
  id: number;
  name: string;
}

const steps: Step[] = [
  { id: 1, name: 'Business' },
  { id: 2, name: 'Receivable' },
  { id: 3, name: 'Debtor' },
  { id: 4, name: 'Documents' },
  { id: 5, name: 'Review' },
];

export const SubmitReceivablePage: React.FC = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Business
    businessName: 'ABC Supplies Co.',
    businessRegNumber: '12345678',
    representativeName: 'John Doe',
    representativeEmail: 'john@abcsupplies.com',
    walletAddress: wallet.address || 'ST1QxT...sample',

    // Step 2: Receivable
    invoiceNumber: 'INV-2026-0092',
    amountSbtc: '2.50',
    amountUsd: '162,500',
    dueBlockTarget: '154000',
    dueDateEstimated: '30 Days (Oct 06, 2026)',

    // Step 3: Debtor
    debtorName: 'Global Freight Logistics Ltd.',
    debtorRegNumber: 'UK-9918231',
    debtorEmail: 'ap@globalfreight.com',
    debtorCountry: 'United Kingdom',

    // Step 4: Documents
    docHash: '0x8f2d910a7b4c3e1f99a80b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e',
    docFileName: 'Invoice_INV-2026-0092_Signed.pdf',

    // Status
    isSubmitted: false,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      setFormData((prev) => ({ ...prev, isSubmitted: true }));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (formData.isSubmitted) {
    return (
      <div className="mx-auto max-w-[680px] space-y-6 font-syne py-4">
        <div className="neo-border-thick bg-white rounded-[28px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-[#a8ff3e] neo-border flex items-center justify-center text-2xl font-black">
            ✓
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-black">
            Receivable Submitted Successfully!
          </h1>
          <p className="text-gray-600 text-sm font-semibold max-w-[460px] mx-auto">
            Your receivable for <span className="text-black font-semibold">{formData.businessName}</span> has been submitted for off-chain compliance verification and Clarity contract registration.
          </p>

          <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 font-syne text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Invoice Ref:</span>
              <span className="font-semibold text-black">{formData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Amount:</span>
              <span className="font-semibold text-[#6B46C1]">{formData.amountSbtc} sBTC (${formData.amountUsd} USD)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Document Hash:</span>
              <span className="font-semibold text-black truncate max-w-[240px]">{formData.docHash}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Button variant="primary" onClick={() => navigate('/verification')}>
              Track Verification Status →
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6 font-syne py-2 sm:py-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between font-syne text-xs font-semibold text-gray-600">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="hover:text-black hover:underline">Overview</Link>
          <span>/</span>
          <span className="text-black font-semibold">Submit a New Receivable</span>
        </div>
        <Link to="/dashboard" className="text-[11px] text-[#6B46C1] hover:underline">
          ✕ Cancel
        </Link>
      </div>

      {/* Header Banner */}
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
          Submit a New Receivable
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-gray-600">
          Complete the 5 steps below to submit your receivable for verification.
        </p>

        {/* 5-Step Stepper Bar */}
        <div className="mt-6 pt-5 border-t-2 border-black/10">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-full neo-border font-syne text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'bg-[#a8ff3e] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                      : isCompleted
                      ? 'bg-[#c4b5fd] text-black hover:bg-[#b4a5ed]'
                      : 'bg-[#f7f7f7] text-gray-400 border-gray-300'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-semibold">
                    {isCompleted ? '✓' : step.id}
                  </span>
                  <span className="truncate hidden sm:inline">{step.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Form Card */}
      <Card className="space-y-6">
        {/* STEP 1: BUSINESS INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-xl font-black text-black">1. Business Information</h2>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                Tell us about your business. This will be verified during the review process.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="ABC Supplies Co."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Business Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessRegNumber}
                  onChange={(e) => handleChange('businessRegNumber', e.target.value)}
                  className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-syne font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="12345678"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Representative Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.representativeName}
                    onChange={(e) => handleChange('representativeName', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Representative Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.representativeEmail}
                    onChange={(e) => handleChange('representativeEmail', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    placeholder="john@abcsupplies.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.walletAddress}
                  onChange={(e) => handleChange('walletAddress', e.target.value)}
                  className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-syne font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="ST1QxT...sample"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: RECEIVABLE DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-xl font-black text-black">2. Receivable Information</h2>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                Specify the invoice amount, maturity block target, and receivable parameters.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-syne font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Amount (sBTC) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.amountSbtc}
                    onChange={(e) => handleChange('amountSbtc', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-syne font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    USD Equivalent ($)
                  </label>
                  <input
                    type="text"
                    value={formData.amountUsd}
                    onChange={(e) => handleChange('amountUsd', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-syne font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Target Maturity Block Height
                  </label>
                  <input
                    type="text"
                    value={formData.dueBlockTarget}
                    onChange={(e) => handleChange('dueBlockTarget', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-syne font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DEBTOR INFORMATION */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-xl font-black text-black">3. Debtor & Counterparty</h2>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                Provide counterparty details responsible for settling the trade invoice.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Debtor Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.debtorName}
                  onChange={(e) => handleChange('debtorName', e.target.value)}
                  className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Debtor Registration #
                  </label>
                  <input
                    type="text"
                    value={formData.debtorRegNumber}
                    onChange={(e) => handleChange('debtorRegNumber', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-syne font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Debtor Country
                  </label>
                  <input
                    type="text"
                    value={formData.debtorCountry}
                    onChange={(e) => handleChange('debtorCountry', e.target.value)}
                    className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-sm font-semibold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENTS & ATTESTATION */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-xl font-black text-black">4. Documents & Off-Chain Verification</h2>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                Attach invoice document to generate immutable SHA-256 doc-hash on Stacks.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-5 text-center space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="h-12 w-12 rounded-full bg-[#c4b5fd] neo-border mx-auto flex items-center justify-center font-semibold text-xl">
                  📄
                </div>
                <div>
                  <div className="font-semibold text-black text-sm">{formData.docFileName}</div>
                  <div className="text-xs font-syne text-gray-600 mt-1">Status: Document SHA-256 Hashed</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">
                  Computed doc-hash (buff 32)
                </label>
                <div className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 text-xs font-syne font-semibold text-black truncate">
                  {formData.docHash}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-xl font-black text-black">5. Review & Clarity Contract Registration</h2>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                Review all business, invoice, debtor, and document details before submitting.
              </p>
            </div>

            <div className="space-y-3 font-syne text-xs">
              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 space-y-2">
                <span className="text-[10px] font-syne font-semibold uppercase text-gray-500 block">Business</span>
                <div className="font-semibold text-black text-sm">{formData.businessName} (Reg #{formData.businessRegNumber})</div>
                <div className="text-gray-700 font-semibold">{formData.representativeName} • {formData.representativeEmail}</div>
              </div>

              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 space-y-2">
                <span className="text-[10px] font-syne font-semibold uppercase text-gray-500 block">Receivable</span>
                <div className="font-semibold text-[#6B46C1] text-sm">{formData.amountSbtc} sBTC (${formData.amountUsd} USD)</div>
                <div className="text-gray-700 font-semibold">Invoice: {formData.invoiceNumber} • Target Block #{formData.dueBlockTarget}</div>
              </div>

              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 space-y-2">
                <span className="text-[10px] font-syne font-semibold uppercase text-gray-500 block">Debtor</span>
                <div className="font-semibold text-black text-sm">{formData.debtorName}</div>
                <div className="text-gray-700 font-semibold">{formData.debtorCountry} ({formData.debtorRegNumber})</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="pt-4 border-t-2 border-black flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          ) : (
            <div />
          )}

          <Button variant="primary" onClick={handleNext} className="px-6 py-2.5 text-sm font-semibold">
            {currentStep === 5 ? '⚡ Submit Receivable' : 'Continue →'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
