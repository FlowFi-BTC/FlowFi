import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useUser } from '../context/UserContext';
import { receivablesApi, businessApi } from '../lib/api';
import { friendlyErrorMessage } from '../lib/errors';

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
  const { wallet, user, registerBusinessProfile } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  // Clean Form State strictly initialized with logged in user data or empty strings
  const [formData, setFormData] = useState({
    // Step 1: Business
    businessName: user?.businessProfile?.companyName || '',
    businessRegNumber: user?.businessProfile?.registrationNumber || '',
    businessCountry: (user?.businessProfile as any)?.country || '',
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
        businessCountry: (prev as any).businessCountry || (user.businessProfile as any)?.country || '',
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
    // Client-side allowlist mirrors backend ALLOWED_FILE_TYPES + 10 MB cap
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setStepError('Upload a PDF, JPEG, PNG or WebP invoice file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStepError('That file exceeds the 10 MB upload limit.');
      return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setSelectedFile(file);
      setUploadNote(null);
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
      if (!user?.businessProfile && (formData as any).businessCountry && !/^[A-Za-z]{2}$/.test(((formData as any).businessCountry as string).trim())) {
        setStepError('Business country must be a 2-letter code (e.g. NG) — required for on-chain registration.');
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
      // Contract has no optional fields — ISO-2 country is required before register.
      if (formData.debtorCountry && !/^[A-Za-z]{2}$/.test(formData.debtorCountry.trim())) {
        setStepError('Debtor country must be a 2-letter code (e.g. NG).');
        return false;
      }
    } else if (currentStep === 4) {
      if (!selectedFile) {
        setStepError('Please upload an invoice document — its SHA-256 goes on-chain at registration.');
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
      setUploadNote(null);
      try {
        // Ensure the business profile exists first (#6). Country is collected now
        // so the later on-chain register-business never blocks on COUNTRY_REQUIRED.
        if (!user?.businessProfile) {
          try {
            await registerBusinessProfile({
              companyName: formData.businessName.trim(),
              registrationNumber: formData.businessRegNumber.trim() || undefined,
              country: (formData as any).businessCountry?.trim()?.toUpperCase() || undefined,
            });
          } catch (bizErr: any) {
            const code = (bizErr as any)?.code;
            // PROFILE_EXISTS → fall through to update path inside context; else surface
            if (code !== 'PROFILE_EXISTS' && code !== 'DUPLICATE_ENTRY') {
              const existing = await businessApi.getMe().catch(() => null);
              if (!existing) throw bizErr;
            }
          }
        } else if ((formData as any).businessCountry?.trim() && !(user.businessProfile as any)?.country) {
          // Backfill country via PATCH /businesses/me when it was missing
          try {
            await businessApi.updateMe({ country: (formData as any).businessCountry.trim().toUpperCase() });
          } catch {
            // non-fatal — register/prepare will surface COUNTRY_REQUIRED with guidance
          }
        }

        // 1. Create the OFF-CHAIN record (#11) — includes debtor so register/prepare
        //    never fails DEBTOR_REQUIRED immediately after submit.
        const created = await receivablesApi.submit({
          title: formData.invoiceTitle,
          description: formData.description || `Receivable for ${formData.debtorName} (Invoice ${formData.invoiceNumber})`,
          invoiceNumber: formData.invoiceNumber,
          amountUsd: parseFloat(formData.amountUsd),
          dueDate: new Date(formData.dueDate).toISOString(),
          debtor: {
            companyName: formData.debtorName.trim(),
            country: formData.debtorCountry.trim()?.toUpperCase() || undefined,
            registrationNumber: formData.debtorRegNumber.trim() || undefined,
          },
        });

        // 2. Upload invoice evidence (#18) — requires the receivable to exist,
        //    so this MUST happen after create, not before. Only the SHA-256 goes on-chain.
        if (selectedFile) {
          try {
            await receivablesApi.uploadDocument(created.id, selectedFile);
          } catch (upErr: any) {
            setUploadNote(
              `${friendlyErrorMessage(upErr, 'Document upload failed.')} You can retry the upload from the receivable detail page — registration stays blocked until DOCUMENT_REQUIRED is satisfied.`,
            );
          }
        }

        // NOTE: verification is business-level + one-time (PAGES_SPEC §7). A new
        // receivable from a VERIFIED business is already business-verified — there
        // is no per-receivable "wait for reviewer" step. The next step is
        // Register On-Chain (#16/#17) from the detail page.

        setFormData((prev) => ({
          ...prev,
          isSubmitted: true,
          submittedId: created.id,
        }));
      } catch (err: any) {
        if (err?.code === 'FORBIDDEN' || err?.message?.includes('Role')) {
          setApiError('Access denied: You must be registered with BUSINESS role to submit receivables. Please complete profile registration in Get Started.');
        } else {
          setApiError(friendlyErrorMessage(err, 'Failed to submit receivable to API server.'));
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
            Your off-chain receivable record was created{uploadNote ? ' but the invoice upload needs attention' : ''}.
            {user?.businessProfile?.verificationStatus === 'VERIFIED'
              ? ' The next step is Register On-Chain from its detail page — that is what makes it fundable.'
              : ' Once your business is VERIFIED, use Register On-Chain from its detail page to make it fundable.'}
          </p>

          {uploadNote && (
            <div className="neo-border bg-[#fef08a] p-3 text-left text-[12px] font-bold text-black">
              ⚠️ {uploadNote}
            </div>
          )}

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
            <Button variant="primary" onClick={() => navigate(`/receivables/${formData.submittedId}`)}>
              Register On-Chain →
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
                  Business Country (ISO-2) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={(formData as any).businessCountry}
                  onChange={(e) => handleChange('businessCountry', e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-syne font-medium text-black focus:bg-white focus:outline-none"
                  placeholder="NG"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Required before on-chain register-business (e.g. NG). Already stored profiles skip this.
                </p>
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
                    Debtor Country (ISO-2) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.debtorCountry}
                    onChange={(e) => handleChange('debtorCountry', e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 text-[13px] font-medium text-black focus:bg-white focus:outline-none"
                    placeholder="NG"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">2-letter code — required for on-chain registration.</p>
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
                    Upload Invoice File (PDF / JPEG / PNG / WebP, max 10 MB)
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-[11px] font-medium text-gray-500">
                    Preview hash is computed in-browser; the file is uploaded to POST /receivables/:id/documents after the record is created (Step 5).
                  </p>
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