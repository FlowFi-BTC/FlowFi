import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useUser } from '../context/UserContext';
import { receivablesApi, verificationApi } from '../lib/api';

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

export const SubmitReceivablePage: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Clean Form State strictly initialized with logged in user data or empty strings
  const [formData, setFormData] = useState({
    // Step 1: Business
    businessName: user?.businessProfile?.companyName || '',
    businessRegNumber: user?.businessProfile?.registrationNumber || '',
    representativeName: '',
    representativeEmail: '',
    walletAddress: wallet.address || user?.walletAddress || '',

    // Step 2: Receivable
    invoiceTitle: '',
    invoiceNumber: '',
    description: '',
    amountUsd: '',
    dueDate: '',

    // Step 3: Debtor
    debtorName: '',
    debtorRegNumber: '',
    debtorEmail: '',
    debtorCountry: '',

    // Step 4: Documents
    docHash: '',
    docFileName: '',

    // Status
    isSubmitted: false,
    submittedId: '',
  });

  // Update initial form values when user context loads
  useEffect(() => {
    if (user?.businessProfile) {
      setFormData((prev) => ({
        ...prev,
        businessName: prev.businessName || user.businessProfile?.companyName || '',
        businessRegNumber: prev.businessRegNumber || user.businessProfile?.registrationNumber || '',
      }));
    }
    if (wallet.address) {
      setFormData((prev) => ({
        ...prev,
        walletAddress: prev.walletAddress || wallet.address || '',
      }));
    }
  }, [user, wallet]);

  const handleChange = (field: string, value: string) => {
    setStepError(null);
    setApiError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStepError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setFormData((prev) => ({
        ...prev,
        docFileName: file.name,
        docHash: hashHex,
      }));
    } catch {
      setStepError('Failed to calculate SHA-256 hash for selected file.');
    }
  };

  const validateCurrentStep = (): boolean => {
    setStepError(null);
    if (currentStep === 1) {
      if (!formData.businessName.trim()) {
        setStepError('Please enter your business name.');
        return false;
      }
      if (!formData.walletAddress.trim()) {
        setStepError('Please provide your wallet address.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.invoiceTitle.trim()) {
        setStepError('Please enter an invoice title.');
        return false;
      }
      if (!formData.invoiceNumber.trim()) {
        setStepError('Please enter the invoice number.');
        return false;
      }
      if (!formData.amountUsd || Number(formData.amountUsd) <= 0) {
        setStepError('Please enter a valid USD valuation amount greater than 0.');
        return false;
      }
      if (!formData.dueDate) {
        setStepError('Please select a due date for the invoice.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.debtorName.trim()) {
        setStepError('Please enter the debtor company name.');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.docHash) {
        setStepError('Please upload an invoice document to compute its SHA-256 digest.');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsSubmitting(true);
      setApiError(null);
      try {
        // 1. Submit Receivable to REST API /v1/receivables
        const created = await receivablesApi.submit({
          title: formData.invoiceTitle,
          description: formData.description || `Receivable for ${formData.debtorName} (Invoice ${formData.invoiceNumber})`,
          invoiceNumber: formData.invoiceNumber,
          amountUsd: parseFloat(formData.amountUsd),
          dueDate: new Date(formData.dueDate).toISOString(),
        });

        // 2. Initiate Verification via /v1/verification/receivables/:id
        try {
          await verificationApi.initiate(created.id, 'PILOT_REVIEW');
        } catch (verErr) {
          console.warn('Verification initiation note:', verErr);
        }

        setFormData((prev) => ({
          ...prev,
          isSubmitted: true,
          submittedId: created.id,
        }));
      } catch (err: any) {
        if (err?.code === 'FORBIDDEN' || err?.message?.includes('Role')) {
          setApiError('Access denied: You must be registered with BUSINESS role to submit receivables. Please complete profile registration in Get Started.');
        } else {
          setApiError(err?.message || 'Failed to submit receivable to API server.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (formData.isSubmitted) {
    return (
      <div className="mx-auto max-w-[680px] space-y-6 font-syne py-4">
        <div className="neo-border-thick bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-4 relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div className="mx-auto h-14 w-14 bg-[#a8ff3e] neo-border flex items-center justify-center text-xl font-bold">
            ✓
          </div>
          <h1 className="text-[1.6rem] font-bold text-black">
            Receivable Submitted Successfully!
          </h1>
          <p className="text-gray-600 text-[13px] font-medium max-w-[440px] mx-auto">
            Your receivable for <span className="text-black font-bold">{formData.businessName}</span> has been submitted to the API and queued for verification.
          </p>

          <div className="neo-border bg-[#f7f7f7] p-4 font-syne text-[13px] text-left space-y-2">
            <div className="flex justify-between border-b border-black/10 pb-1.5">
              <span className="text-gray-500 font-medium">Receivable ID:</span>
              <span className="font-mono font-bold text-black">{formData.submittedId}</span>
            </div>
            <div className="flex justify-between border-b border-black/10 pb-1.5">
              <span className="text-gray-500 font-medium">Invoice Number:</span>
              <span className="font-bold text-black">{formData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between border-b border-black/10 pb-1.5">
              <span className="text-gray-500 font-medium">USD Valuation:</span>
              <span className="font-bold text-[#6B46C1]">${Number(formData.amountUsd).toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">SHA-256 Digest:</span>
              <span className="font-mono text-[11px] text-gray-700 truncate max-w-[240px]">{formData.docHash}</span>
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
    <div className="mx-auto  space-y-6 font-syne py-2 sm:py-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between font-syne text-[11px] font-medium text-gray-600">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="hover:text-black hover:underline">Overview</Link>
          <span>/</span>
          <span className="text-black">Submit a New Receivable</span>
        </div>
        <Link to="/dashboard" className="text-[#6B46C1] hover:underline">
          ✕ Cancel
        </Link>
      </div>

      {/* Header Banner */}
      <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
        <h1 className="font-syne text-[1.6rem] font-bold leading-tight text-black">
          Submit a New Receivable
        </h1>
        <p className="mt-1 text-[13px] text-gray-600">
          Complete the 5 steps below to submit your trade invoice for verification.
        </p>

        {/* Stepper Bar */}
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
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 neo-border font-syne text-[11px] font-bold transition-all ${
                    isActive
                      ? 'bg-[#a8ff3e] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                      : isCompleted
                      ? 'bg-[#c4b5fd] text-black hover:bg-[#b4a5ed]'
                      : 'bg-[#f7f7f7] text-gray-400'
                  }`}
                >
                  <span className="h-5 w-5 bg-black text-white text-[10px] flex items-center justify-center font-bold">
                    {isCompleted ? '✓' : step.id}
                  </span>
                  <span className="truncate hidden sm:inline">{step.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Error Notification */}
      {stepError && (
        <div className="neo-border-thick bg-[#ffb6b9] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-bold text-black flex items-center justify-between">
          <span>⚠️ {stepError}</span>
          <button onClick={() => setStepError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* API Error Notification */}
      {apiError && (
        <div className="neo-border-thick bg-[#ffb6b9] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-bold text-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>⚠️ {apiError}</span>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/get-started"
              className="neo-border bg-white px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              Complete Business Setup →
            </Link>
            <button onClick={() => setApiError(null)} className="font-bold">✕</button>
          </div>
        </div>
      )}

      {/* Step Form Card */}
      <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black/10 pb-3">
              <h2 className="text-[1.1rem] font-bold text-black">1. Business Information</h2>
              <p className="text-[13px] text-gray-600 mt-1">
                Verify your business identity details before registering the invoice.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-black mb-1.5">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-medium text-black focus:bg-white focus:outline-none"
                  placeholder="Enter registered company name"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-black mb-1.5">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  value={formData.businessRegNumber}
                  onChange={(e) => handleChange('businessRegNumber', e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-syne font-medium text-black focus:bg-white focus:outline-none"
                  placeholder="Enter corporate registration ID"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-black mb-1.5">
                  Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.walletAddress}
                  onChange={(e) => handleChange('walletAddress', e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-syne font-medium text-black focus:bg-white focus:outline-none"
                  placeholder="Stacks wallet address"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black/10 pb-3">
              <h2 className="text-[1.1rem] font-bold text-black">2. Receivable Details</h2>
              <p className="text-[13px] text-gray-600 mt-1">
                Enter trade invoice details, USD valuation, and maturity due date.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-black mb-1.5">
                  Invoice Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.invoiceTitle}
                  onChange={(e) => handleChange('invoiceTitle', e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-medium text-black focus:bg-white focus:outline-none"
                  placeholder="Invoice title or description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-black mb-1.5">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-syne font-medium text-black focus:bg-white focus:outline-none"
                    placeholder="Invoice reference ID"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-black mb-1.5">
                    USD Valuation Amount ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amountUsd}
                    onChange={(e) => handleChange('amountUsd', e.target.value)}
                    className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-syne font-medium text-black focus:bg-white focus:outline-none"
                    placeholder="Valuation in USD"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-black mb-1.5">
                  Maturity Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-syne font-medium text-black focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-black mb-1.5">
                  Description / Service Details
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full neo-border bg-[#f7f7f7] p-3 text-[13px] font-medium text-black focus:bg-white focus:outline-none"
                  placeholder="Additional context about underlying services or goods delivered"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black/10 pb-3">
              <h2 className="text-[1.1rem] font-bold text-black">3. Debtor & Counterparty</h2>
              <p className="text-[13px] text-gray-600 mt-1">
                Specify the debtor entity responsible for settling the trade receivable.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-black mb-1.5">
                  Debtor Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.debtorName}
                  onChange={(e) => handleChange('debtorName', e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-medium text-black focus:bg-white focus:outline-none"
                  placeholder="Debtor company name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-black mb-1.5">
                    Debtor Country
                  </label>
                  <input
                    type="text"
                    value={formData.debtorCountry}
                    onChange={(e) => handleChange('debtorCountry', e.target.value)}
                    className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-medium text-black focus:bg-white focus:outline-none"
                    placeholder="Jurisdiction / Country"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-black mb-1.5">
                    Debtor Registration #
                  </label>
                  <input
                    type="text"
                    value={formData.debtorRegNumber}
                    onChange={(e) => handleChange('debtorRegNumber', e.target.value)}
                    className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-syne font-medium text-black focus:bg-white focus:outline-none"
                    placeholder="Debtor registration ID"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black/10 pb-3">
              <h2 className="text-[1.1rem] font-bold text-black">4. Invoice Document & Hashing</h2>
              <p className="text-[13px] text-gray-600 mt-1">
                Upload invoice document to generate cryptographic SHA-256 hash digest for Stacks attestation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="neo-border bg-[#f7f7f7] p-6 text-center space-y-3">
                <div className="h-12 w-12 bg-[#c4b5fd] neo-border mx-auto flex items-center justify-center text-xl">
                  📄
                </div>
                <div>
                  <label className="cursor-pointer inline-block neo-border bg-white px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5">
                    Upload Invoice File (PDF / Image)
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.docFileName ? (
                  <div className="text-xs font-bold text-black mt-2">
                    Selected File: <span className="text-[#6B46C1]">{formData.docFileName}</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-medium text-gray-500">
                    No document selected yet. Click above to compute SHA-256 digest.
                  </div>
                )}
              </div>

              {formData.docHash && (
                <div>
                  <label className="block text-[13px] font-bold text-black mb-1.5">
                    Computed SHA-256 Digest
                  </label>
                  <div className="w-full neo-border bg-white px-4 py-2.5 text-[12px] font-mono font-bold text-black break-all">
                    {formData.docHash}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b-2 border-black/10 pb-3">
              <h2 className="text-[1.1rem] font-bold text-black">5. Review & Submit</h2>
              <p className="text-[13px] text-gray-600 mt-1">
                Review your receivable parameters before sending payload to POST /v1/receivables.
              </p>
            </div>

            <div className="space-y-3 font-syne text-[13px]">
              <div className="neo-border bg-[#f7f7f7] p-4 space-y-1">
                <span className="text-[11px] font-bold text-gray-500 block">INVOICE TITLE</span>
                <div className="font-bold text-black text-sm">{formData.invoiceTitle}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="neo-border bg-[#f7f7f7] p-4 space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 block">INVOICE REF #</span>
                  <div className="font-mono font-bold text-black">{formData.invoiceNumber}</div>
                </div>

                <div className="neo-border bg-[#f7f7f7] p-4 space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 block">VALUATION AMOUNT</span>
                  <div className="font-bold text-[#6B46C1]">${Number(formData.amountUsd).toLocaleString()} USD</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="neo-border bg-[#f7f7f7] p-4 space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 block">DEBTOR ENTITY</span>
                  <div className="font-bold text-black">{formData.debtorName}</div>
                </div>

                <div className="neo-border bg-[#f7f7f7] p-4 space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 block">DUE DATE</span>
                  <div className="font-mono font-bold text-black">{formData.dueDate}</div>
                </div>
              </div>

              <div className="neo-border bg-[#f7f7f7] p-4 space-y-1">
                <span className="text-[11px] font-bold text-gray-500 block">DOCUMENT SHA-256 HASH</span>
                <div className="font-mono text-xs font-bold text-black break-all">{formData.docHash}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              ← Back
            </Button>
          ) : (
            <div />
          )}

          <Button variant="primary" onClick={handleNext} disabled={isSubmitting} className="px-6 py-2.5 text-[13px] font-bold">
            {isSubmitting
              ? 'Submitting via API...'
              : currentStep === 5
              ? '⚡ Submit Receivable via API'
              : 'Continue →'}
          </Button>
        </div>
      </Card>
    </div>
  );
};