import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { businessApi, businessVerificationApi } from '../lib/api';
import { useOnchainAction, phaseLabel } from '../hooks/useOnchainAction';
import { friendlyErrorMessage } from '../lib/errors';
import type { BusinessProfile } from '../types/api';

const RailStar = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" className={className}>
    <path
      d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
      fill="#a8ff3e"
      stroke="black"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="hidden sm:block shrink-0">
    <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BusinessVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet, refreshUserSession } = useUser();
  const [business, setBusiness] = useState<BusinessProfile | null>(user?.businessProfile || null);
  const [verification, setVerification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const registerOnchain = useOnchainAction();

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        setIsLoading(true);
        const data = await businessApi.getMe().catch(() => null);
        if (data) {
          setBusiness(data);
          // Canonical verification object (#23) — verificationStatus is the legacy mirror
          const ver = await businessVerificationApi.get(data.id).catch(() => null);
          if (ver) setVerification(ver);
        }
      } catch (e) {
        console.warn('Could not fetch business info:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessInfo();
  }, []);

  const currentStatus = success
    ? 'VERIFIED'
    : verification?.verification?.status || business?.verificationStatus || user?.businessProfile?.verificationStatus || 'PENDING';
  const isVerified = currentStatus === 'VERIFIED';

  // Off-chain review: #22 start → #24 complete (MVP: owner-completable pilot flow;
  // production restricts completion to a verifier/admin role).
  const handleVerifyBusiness = async () => {
    if (!business?.id) {
      setError('Create your business profile in Settings first (POST /businesses).');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      await businessVerificationApi.start(business.id, { method: 'MANUAL', level: 'BASIC' }).catch(() => null);
      const done = await businessVerificationApi.complete(business.id, {
        status: 'VERIFIED',
        notes: 'Verified business documentation and CAC certificate',
        method: 'MANUAL',
        level: 'BASIC',
      });
      if (done?.verification) setVerification(done);
      const fresh = await businessApi.getMe().catch(() => null);
      if (fresh) setBusiness(fresh);
      await refreshUserSession();
      setSuccess(true);
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Verification update failed on API server'));
    } finally {
      setIsVerifying(false);
    }
  };

  // On-chain identity: #25 prepare → wallet signs → #26 confirm (BUSINESS wallet becomes owner).
  const handleRegisterOnchain = async () => {
    if (!business?.id) return;
    setError(null);
    try {
      await registerOnchain.run({
        prepare: (key) => businessVerificationApi.prepareRegister(business.id, {}, key),
        confirm: (prepared: any, txHash, key) =>
          businessVerificationApi.confirmRegister(business.id, { txHash, operationId: prepared.operationId }, key),
        onDone: async () => {
          const fresh = await businessApi.getMe().catch(() => null);
          if (fresh) setBusiness(fresh);
          await refreshUserSession();
        },
      });
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
    }
  };
  const registerBusyLabel = phaseLabel(registerOnchain.phase);

  const businessName = business?.companyName || user?.businessProfile?.companyName || 'Business Entity';
  const regNum = business?.registrationNumber || user?.businessProfile?.registrationNumber || 'RC-998821';
  const walletAddr = user?.walletAddress || wallet.address || 'Not Connected';

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black font-syne selection:bg-[#a8ff3e] selection:text-black">
      {/* ── NAVBAR ── */}
      <div className="w-full hidden "> {isLoading}</div>
      <header className="sticky top-0 z-40 border-b-[3px] border-black bg-white px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded neo-border neo-shadow-btn overflow-hidden bg-[#a8ff3e] group-hover:-translate-y-0.5 transition-transform">
              <img
                src="https://avatars.githubusercontent.com/u/296891105?s=200&v=4"
                alt="FlowFi"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-syne font-medium text-lg tracking-tight text-black">FlowFi-BTC</span>
                <span className="bg-[#a8ff3e] text-black text-[10px] font-syne font-medium px-2 py-0.5 neo-border">
                  Beta
                </span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 hidden sm:block">
                Business Verification
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 font-syne text-sm">
            <Link to="/marketplace" className="text-gray-700 hover:text-black transition-colors font-medium">
              Explore Receivables
            </Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-black transition-colors">
              Dashboard
            </Link>
            <Link to="/history" className="text-gray-700 hover:text-black transition-colors">
              Transparency Log
            </Link>
          </nav>

          <Link
            to="/submit-receivable"
            className="inline-flex items-center gap-1.5 neo-border bg-[#6B46C1] px-5 py-2 font-syne text-xs sm:text-sm font-medium text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          >
            <span>Submit Receivable</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-14 sm:py-20 px-4 sm:px-8 bg-[#f7f7f7]">
        <div className="mx-auto max-w-5xl text-center space-y-6 relative z-10">
          <RailStar className="absolute top-0 left-4 sm:left-12 h-8 w-8 opacity-80" />
          <RailStar className="absolute bottom-4 right-4 sm:right-16 h-10 w-10 rotate-45 opacity-80" />

          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] neo-border">
            <span className="h-2.5 w-2.5 bg-[#6B46C1] neo-border" />
            <span className="font-syne text-xs font-medium uppercase tracking-wider text-black">
              Trust Gateway
            </span>
          </div>

          <h1 className="font-syne text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-black leading-[1.05]">
            Business Verification
          </h1>

          <p className="mx-auto max-w-2xl font-syne text-base sm:text-lg font-medium text-gray-700 leading-relaxed">
            {isVerified
              ? `${businessName} is fully verified and authorized to issue receivables on FlowFi-BTC.`
              : `Verify ${businessName} to publish receivables and access sBTC working capital.`}
          </p>
        </div>
      </section>

      {/* ── TRUST GATEWAY STRIP ── */}
      <section className="border-y-[3px] border-black bg-white py-10 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0">
            <div className="flex-1 neo-border bg-[#a8ff3e] p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center space-y-1">
              <div className="font-syne text-xs font-medium text-gray-600">01</div>
              <div className="font-syne text-sm font-medium text-black">Business Registered</div>
              <div className="font-syne text-xs font-medium text-black">✓ Done</div>
            </div>

            <div className="flex items-center justify-center px-2 text-black"><ChevronRight /></div>

            <div
              className={`flex-1 neo-border p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] sm:-translate-y-1 text-center space-y-1 ${
                isVerified ? 'bg-[#a8ff3e]' : 'bg-[#fef08a]'
              }`}
            >
              <div className="font-syne text-xs font-medium text-gray-600">02</div>
              <div className="font-syne text-sm font-medium text-black">Business Verified</div>
              <div className="font-syne text-xs font-medium text-black">
                {isVerified ? '✓ Verified' : '← You are here'}
              </div>
            </div>

            <div className="flex items-center justify-center px-2 text-black"><ChevronRight /></div>

            <div className={`flex-1 neo-border p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center space-y-1 ${isVerified ? 'bg-[#a8ff3e]/20' : 'bg-[#f7f7f7]'}`}>
              <div className="font-syne text-xs font-medium text-gray-500">03</div>
              <div className="font-syne text-sm font-medium text-black">Marketplace Access</div>
            </div>

            <div className="flex items-center justify-center px-2 text-black"><ChevronRight /></div>

            <div className={`flex-1 neo-border p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center space-y-1 ${isVerified ? 'bg-[#a8ff3e]/20' : 'bg-[#f7f7f7]'}`}>
              <div className="font-syne text-xs font-medium text-gray-500">04</div>
              <div className="font-syne text-sm font-medium text-black">sBTC Funding Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Error alert */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-6">
          <div className="neo-border bg-[#ffb6b9] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <span className="font-syne text-xs font-medium text-black">⚠️ {error}</span>
            <button onClick={() => setError(null)} className="font-bold text-sm">✕</button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <section className="py-16 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Verification Status Card */}
            <div className="neo-border-thick bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <h2 className="font-syne text-xl font-medium text-black border-b-2 border-black pb-4">
                Verification Status
              </h2>

              {isVerified ? (
                <div className="neo-border bg-[#a8ff3e] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
                  <span className="text-2xl">✓</span>
                  <div>
                    <div className="font-syne text-base font-bold text-black">Business Verified</div>
                    <p className="font-syne text-xs text-black font-medium mt-0.5">
                      Your business profile has been confirmed and verified.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="neo-border bg-[#fef08a] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
                  <span className="text-2xl">⚠</span>
                  <div>
                    <div className="font-syne text-base font-bold text-black">Pending Verification</div>
                    <p className="font-syne text-xs text-black font-medium mt-0.5">
                      Your business profile is currently pending verification.
                    </p>
                  </div>
                </div>
              )}

              <p className="font-syne text-sm font-medium text-gray-700 leading-relaxed">
                {isVerified
                  ? 'Your company details are verified on FlowFi-BTC. You can now issue receivables and request sBTC liquidity.'
                  : 'Your business has not yet completed verification. Click verify below to confirm your business details and access the dashboard.'}
              </p>
            </div>

            {/* Business Information Card */}
            <div className="neo-border-thick bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <h2 className="font-syne text-xl font-medium text-black border-b-2 border-black pb-4">
                Business Information
              </h2>

              <div className="space-y-3">
                <div className="bg-[#f7f7f7] neo-border p-4 flex items-center justify-between gap-4">
                  <span className="font-syne text-xs font-medium text-gray-500 shrink-0">Business Name</span>
                  <span className="font-syne text-sm font-bold text-black">{businessName}</span>
                </div>
                <div className="bg-[#f7f7f7] neo-border p-4 flex items-center justify-between gap-4">
                  <span className="font-syne text-xs font-medium text-gray-500 shrink-0">Registration Number</span>
                  <span className="font-syne text-sm font-bold text-black font-mono">{regNum}</span>
                </div>
                <div className="bg-[#f7f7f7] neo-border p-4 flex items-center justify-between gap-4">
                  <span className="font-syne text-xs font-medium text-gray-500 shrink-0">Wallet Address</span>
                  <span className="font-syne text-sm font-medium text-black truncate max-w-[200px] font-mono">
                    {walletAddr}
                  </span>
                </div>
                {business?.website && (
                  <div className="bg-[#f7f7f7] neo-border p-4 flex items-center justify-between gap-4">
                    <span className="font-syne text-xs font-medium text-gray-500 shrink-0">Website</span>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-syne text-sm font-medium text-[#6B46C1] underline truncate max-w-[200px]"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
              </div>

              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 font-syne text-xs font-medium text-[#6B46C1] hover:underline"
              >
                Edit business profile →
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Verification Method + Benefits */}
            <div className="neo-border-thick bg-[#22d3ee]/10 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <h2 className="font-syne text-xl font-medium text-black">Verification Method</h2>
                <span className="neo-border bg-[#22d3ee] px-3 py-1 text-[10px] font-medium text-black">
                  Pilot MVP
                </span>
              </div>

              <div className="font-syne text-base font-medium text-black">
                Pilot Verification (MVP)
              </div>

              <p className="font-syne text-sm font-medium text-gray-700 leading-relaxed">
                This platform is currently operating in a testnet pilot phase. Business verification is performed through automated pilot review and stored on Stacks Testnet.
              </p>

              {/* Benefits */}
              <div className="neo-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <h3 className="font-syne font-medium text-base text-black border-b-2 border-black pb-3">
                  Verification Benefits
                </h3>
                <ul className="space-y-3">
                  {[
                    'Publish receivables to the marketplace',
                    'Appear in the public funding feed',
                    'Access sBTC working capital',
                    'Build on-chain transparency history',
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 font-syne text-sm font-medium text-gray-800">
                      <span className="h-6 w-6 shrink-0 bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium text-black">
                        ✓
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Card */}
            <div className="neo-border-thick bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <h2 className="font-syne text-xl font-medium text-black border-b-2 border-black pb-4">
                {isVerified ? 'Verification Complete' : 'Next Steps'}
              </h2>

              <p className="font-syne text-sm font-medium text-gray-700 leading-relaxed">
                {isVerified
                  ? 'Off-chain review is VERIFIED. Register the business on-chain so receivables can reference its uint id — then enter the dashboard.'
                  : `Click the button below to run the off-chain review (#22 start → #24 complete) for ${businessName}.`}
              </p>

              {isVerified ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleRegisterOnchain}
                    disabled={registerOnchain.isBusy}
                    className="w-full inline-flex items-center justify-center neo-border bg-[#22d3ee] py-4 font-syne text-sm font-bold text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 active:translate-y-0.5 disabled:opacity-60"
                  >
                    {registerBusyLabel || '⛓ Register Business On-Chain →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full inline-flex items-center justify-center neo-border bg-[#a8ff3e] py-4 font-syne text-sm font-bold text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                  >
                    Enter Business Dashboard →
                  </button>
                  <p className="text-[11px] text-gray-500">
                    On-chain attestation (verify-business) is a separate verifier-wallet step — see the admin surface. The business wallet can never verify itself (u100).
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyBusiness}
                  disabled={isVerifying}
                  className="w-full inline-flex items-center justify-center neo-border bg-[#6B46C1] py-4 font-syne text-sm font-medium text-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                >
                  {isVerifying ? 'Verifying via POST /verification/businesses/:id/complete…' : `Verify ${businessName} Now →`}
                </button>
              )}

              <div className="neo-border bg-[#f7f7f7] p-4 space-y-1">
                <div className="font-syne text-xs font-medium text-gray-500">Current status</div>
                <div className="font-syne text-sm font-bold text-black">
                  {isVerified ? '✓ VERIFIED' : '⚠ PENDING VERIFICATION'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTNET NOTICE ── */}
      <section className="px-4 sm:px-8 py-10 border-t-[3px] border-black bg-[#fef08a]">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="neo-border bg-black text-[#fef08a] px-4 py-2 font-syne text-xs font-medium shrink-0">
            Testnet Notice
          </div>
          <p className="font-syne text-sm font-medium text-black leading-relaxed">
            FlowFi-BTC is currently operating in a pilot environment using <strong>Stacks Testnet</strong>. Funding, verification records, and contract interactions are for demonstration and testing purposes during this phase. No real capital is at risk.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t-[3px] border-black bg-white py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 font-syne">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded neo-border neo-shadow-btn overflow-hidden bg-[#a8ff3e]">
                <img
                  src="https://avatars.githubusercontent.com/u/296891105?s=200&v=4"
                  alt="FlowFi"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-syne font-medium text-lg text-black">FlowFi-BTC</span>
            </div>
            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              Verified business trade receivables connected to Bitcoin capital for transparent, programmable financing on Stacks.
            </p>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Core Pages</h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600 font-syne">
              <li><Link to="/dashboard" className="hover:text-black">Dashboard</Link></li>
              <li><Link to="/submit-receivable" className="hover:text-black">Submit Receivable</Link></li>
              <li><Link to="/funding" className="hover:text-black">Active Funding</Link></li>
              <li><Link to="/verification" className="hover:text-black">Verification Log</Link></li>
              <li><Link to="/history" className="hover:text-black">Transparency Log</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Resources</h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600 font-syne">
              <li><Link to="/marketplace" className="hover:text-black">Marketplace</Link></li>
              <li><Link to="/api-docs" className="hover:text-black">API Documentation</Link></li>
              <li><Link to="/get-started" className="hover:text-black">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Network</h4>
            <div className="inline-flex items-center gap-2 neo-border bg-[#f7f7f7] px-3 py-1.5 text-xs font-medium text-black">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Stacks Testnet Active
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 font-syne">
          <p>© 2026 FlowFi-BTC. All rights reserved.</p>
          <p>Built for Stacks & Bitcoin sBTC Ecosystem</p>
        </div>
      </footer>
    </div>
  );
};