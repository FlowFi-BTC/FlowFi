import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScaleLoader } from 'react-spinners';
import { useUser } from '../context/UserContext';
import { businessApi, investorApi } from '../lib/api';
import type { BusinessProfile, InvestorProfile } from '../types/api';

// Small in-button loader styled to fit the neo-brutalist UI (compact bars, inherits button color)
const ButtonLoader = ({ color = '#000000' }: { color?: string }) => (
  <span className="flex h-5 items-center justify-center" aria-hidden="true">
    <ScaleLoader
      className="flex items-center"
      color={color}
      speedMultiplier={0.9}
      height={18}
      width={3}
      margin={2}
    />
  </span>
);

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

export const GetStartedPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    role,
    setRole,
    wallet,
    user,
    connectWallet,
    disconnectWallet,
    isVerified,
    selectRoleOnboarding,
    registerBusinessProfile,
    registerInvestorProfile,
  } = useUser();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(() => {
    if (!wallet.isConnected) return 1;
    if (!isVerified) return 2;
    return 3;
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [existingBusiness, setExistingBusiness] = useState<BusinessProfile | null>(user?.businessProfile || null);
  const [existingInvestor, setExistingInvestor] = useState<InvestorProfile | null>(user?.investorProfile || null);
  const [showManualForm, setShowManualForm] = useState<boolean>(false);

  const isBusy = isConnecting || isVerifying || isSubmitting;

  // Auto-advance: as soon as wallet connects, take user to Verify (step 2)
  // at any point in the flow — even if they are still on step 1 or navigated away.
  useEffect(() => {
    if (wallet.isConnected && activeStep === 1 && !isConnecting) {
      setActiveStep(2);
    }
  }, [wallet.isConnected, activeStep, isConnecting]);

  // Auto-advance: as soon as wallet is verified, take user to Profile (step 3).
  useEffect(() => {
    if (wallet.isConnected && isVerified && activeStep !== 3 && !isVerifying) {
      setActiveStep(3);
    }
  }, [wallet.isConnected, isVerified, activeStep, isVerifying]);

  useEffect(() => {
    // Reset based on context user first
    setExistingBusiness(user?.businessProfile || null);
    setExistingInvestor(user?.investorProfile || null);

    const fetchProfiles = async () => {
      if (!isVerified) {
        setExistingBusiness(null);
        setExistingInvestor(null);
        return;
      }
      try {
        if (!user?.businessProfile) {
          try {
            const biz = await businessApi.getMe();
            if (biz && (biz.companyName || biz.id)) {
              setExistingBusiness(biz);
            } else {
              setExistingBusiness(null);
            }
          } catch {
            setExistingBusiness(null);
          }
        } else {
          setExistingBusiness(user.businessProfile);
        }

        if (!user?.investorProfile) {
          try {
            const inv = await investorApi.getMe();
            if (inv && (inv.displayName || inv.id)) {
              setExistingInvestor(inv);
            } else {
              setExistingInvestor(null);
            }
          } catch {
            setExistingInvestor(null);
          }
        } else {
          setExistingInvestor(user.investorProfile);
        }
      } catch {
        // Quiet failure
      }
    };

    fetchProfiles();
  }, [isVerified, user, activeStep]);

  const handleContinueWithExistingProfile = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const selectedRole =
        (role === 'BUSINESS' || role === 'business' || (existingBusiness && !existingInvestor))
          ? 'BUSINESS'
          : (role === 'INVESTOR' || role === 'investor' || (existingInvestor && !existingBusiness))
          ? 'INVESTOR'
          : role === 'BUSINESS' || role === 'business'
          ? 'BUSINESS'
          : 'INVESTOR';

      setRole(selectedRole);
      await selectRoleOnboarding(selectedRole);

      if (selectedRole === 'BUSINESS') {
        const biz = existingBusiness || user?.businessProfile || (await businessApi.getMe().catch(() => null));
        if (biz && biz.verificationStatus !== 'VERIFIED') {
          navigate('/business-verification');
          return;
        }
      }
      navigate('/dashboard');
    } catch (err: any) {
      const fallbackRole = (role === 'BUSINESS' || role === 'business' || existingBusiness) ? 'BUSINESS' : 'INVESTOR';
      setRole(fallbackRole);
      if (fallbackRole === 'BUSINESS') {
        const biz = existingBusiness || user?.businessProfile;
        if (biz && biz.verificationStatus !== 'VERIFIED') {
          navigate('/business-verification');
          return;
        }
      }
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectWalletModal = async () => {
    setIsConnecting(true);
    setApiError(null);
    try {
      await connectWallet();
      setActiveStep(2);
    } catch (err: any) {
      setApiError(err?.message || 'Wallet connection was cancelled or unavailable.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setExistingBusiness(null);
    setExistingInvestor(null);
    setActiveStep(1);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setApiError(null);
    try {
      const selectedRole = role === 'BUSINESS' || role === 'business' ? 'BUSINESS' : 'INVESTOR';
      setRole(selectedRole);
      await selectRoleOnboarding(selectedRole);
      setActiveStep(3);
    } catch (e: any) {
      setApiError(e?.message || 'Wallet signature authentication failed on API server');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteProfile = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const selectedRole = role === 'BUSINESS' || role === 'business' ? 'BUSINESS' : 'INVESTOR';
      setRole(selectedRole);
      if (selectedRole === 'BUSINESS') {
        const trimmedName = companyName.trim();
        if (!trimmedName) {
          setApiError('Enter your registered company name to create the business profile.');
          setIsSubmitting(false);
          return;
        }
        const biz = await registerBusinessProfile({
          companyName: trimmedName,
          country: companyCountry.trim()?.toUpperCase() || undefined,
        });
        const currentBiz = biz || (await businessApi.getMe().catch(() => null));
        if (!currentBiz || currentBiz.verificationStatus !== 'VERIFIED') {
          navigate('/business-verification');
          return;
        }
      } else {
        const trimmedDisplay = displayName.trim();
        if (!trimmedDisplay) {
          setApiError('Enter an investor display name to create the investor profile.');
          setIsSubmitting(false);
          return;
        }
        await registerInvestorProfile(trimmedDisplay);
      }
      navigate(selectedRole === 'INVESTOR' ? '/investor' : '/dashboard');
    } catch (err: any) {
      setApiError(err?.message || 'Failed to register profile on API server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black font-syne selection:bg-[#a8ff3e] selection:text-black flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b-[3px] border-black bg-white px-4 sm:px-8 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded neo-border bg-[#a8ff3e] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-0.5 transition-transform overflow-hidden">
              <img
                src="https://avatars.githubusercontent.com/u/296891105?s=200&v=4"
                alt="FlowFi"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="font-syne font-medium text-lg text-black">FlowFi-BTC</span>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Onboarding & Account Setup
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {wallet.isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isBusy}
                className=" neo-border bg-[#ffb6b9] px-3.5 py-1.5 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <ButtonLoader />
                    <span>Working…</span>
                  </span>
                ) : (
                  'Disconnect Wallet'
                )}
              </button>
            )}

            <Link
              to="/"
              className=" neo-border bg-[#f7f7f7] px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl w-full px-4 sm:px-8 py-10 flex-1 space-y-8 font-syne">
        <div className="text-center space-y-3 relative">
          <RailStar className="absolute top-0 right-4 sm:right-24 h-7 w-7 animate-bounce opacity-70" />
        
          <h1 className="text-3xl sm:text-5xl font-medium text-black tracking-tight">
            Get Started
          </h1>

        </div>

        {/* API Error Notification */}
        {apiError && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-syne text-xs font-medium text-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️ Notice:</span>
              <span>{apiError}</span>
            </div>
            <button onClick={() => setApiError(null)} className="font-medium text-sm">✕</button>
          </div>
        )}

        {/* Step Indicator */}
        <div className="neo-border-thick bg-white  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-3 gap-2 relative">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              disabled={isBusy}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3  neo-border transition-all relative z-10 ${
                activeStep === 1
                  ? 'bg-[#a8ff3e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                  : wallet.isConnected
                  ? 'bg-[#a8ff3e]/30 hover:bg-[#a8ff3e]/50'
                  : 'bg-[#f7f7f7]'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="h-8 w-8  bg-white neo-border flex items-center justify-center font-medium text-xs text-black">
                {wallet.isConnected ? '✓' : '1'}
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xs font-medium text-black">1. Connect Wallet</div>
                <div className="text-[10px] font-medium text-gray-600 hidden sm:block">
                  {wallet.isConnected ? 'Connected' : 'Pending'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => wallet.isConnected && setActiveStep(2)}
              disabled={!wallet.isConnected || isBusy}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3  neo-border transition-all relative z-10 ${
                activeStep === 2
                  ? 'bg-[#22d3ee] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                  : isVerified
                  ? 'bg-[#22d3ee]/30 hover:bg-[#22d3ee]/50'
                  : 'bg-[#f7f7f7] opacity-60 cursor-not-allowed'
              } disabled:cursor-not-allowed`}
            >
              <div className="h-8 w-8  bg-white neo-border flex items-center justify-center font-medium text-xs text-black">
                {isVerified ? '✓' : '2'}
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xs font-medium text-black">2. Verify Wallet</div>
                <div className="text-[10px] font-medium text-gray-600 hidden sm:block">
                  {isVerified ? 'Attested' : 'Challenge Check'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => isVerified && setActiveStep(3)}
              disabled={!isVerified || isBusy}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3  neo-border transition-all relative z-10 ${
                activeStep === 3
                  ? 'bg-[#c4b5fd] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                  : 'bg-[#f7f7f7] opacity-60 cursor-not-allowed'
              } disabled:cursor-not-allowed`}
            >
              <div className="h-8 w-8  bg-white neo-border flex items-center justify-center font-medium text-xs text-black">
                3
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xs font-medium text-black">3. Profile Register</div>
                <div className="text-[10px] font-medium text-gray-600 hidden sm:block">
                  {role === 'BUSINESS' || role === 'business' ? 'Business Profile' : 'Investor Profile'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* STEP 1 */}
        {activeStep === 1 && (
          <div className="neo-border-thick bg-white  p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="border-b-2 border-black pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-black">Step 1: Connect Stacks Wallet</h2>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">
                  Launch the official Stacks wallet modal (Leather, Xverse) to link your wallet.
                </p>
              </div>
              {wallet.isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isBusy}
                  className=" neo-border bg-[#ffb6b9] px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  Disconnect Wallet
                </button>
              )}
            </div>

            {!wallet.isConnected ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConnectWalletModal}
                  disabled={isConnecting}
                  aria-busy={isConnecting}
                  className="w-full flex items-center justify-between neo-border bg-[#a8ff3e] p-6 text-left hover:brightness-105 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100"
                >
                  <div className="flex items-center gap-4">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4HdyuM_mhRNfvlv2xd9S03JUAivmvPFFfryIuhvkVp0IDcJXdpFtnhjKp&s" alt="Stacks" className='w-14 h-14' />
                    <div>
                      <div className="font-syne font-medium text-black text-xl">
                        {isConnecting ? 'Launching Wallet Modal...' : 'Connect Stacks Wallet'}
                      </div>
                      {isConnecting && (
                        <div className="text-xs font-medium text-gray-700 mt-1">
                          Waiting for wallet approval — you will be taken to Verify automatically…
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-medium text-lg text-black group-hover:translate-x-1 transition-transform min-w-[48px] flex justify-end">
                    {isConnecting ? <ButtonLoader /> : '→'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="bg-[#a8ff3e]/20 neo-border  p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-block bg-[#a8ff3e] text-black text-[10px] font-medium px-2.5 py-0.5  neo-border">
                      ● WALLET CONNECTED
                    </span>
                    <div className="font-medium text-lg text-black font-mono">
                      {wallet.address}
                    </div>
                    <div className="hidden text-xs  text-gray-700">
                      Balance: <span className="text-[#6B46C1] font-medium">{wallet.sbtcBalance} sBTC</span> • {wallet.stxBalance} STX
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={isBusy}
                      className=" neo-border bg-[#ffb6b9] px-5 py-3 text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      disabled={isBusy}
                      className=" neo-border bg-[#a8ff3e] px-6 py-3 text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      Proceed to Step 2 →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {activeStep === 2 && (
          <div className="neo-border-thick bg-white  p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="border-b-2 border-black pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-black">Step 2: Verify Wallet Attestation</h2>
              
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isBusy}
                className=" neo-border bg-[#ffb6b9] px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                Disconnect Wallet
              </button>
            </div>

            <div className="space-y-6 pt-2">
              <div className="bg-[#22d3ee]/10 neo-border  p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-3">
                 
                  <div>
                    <h3 className="font-medium text-black text-base">sBTC Challenge Authentication</h3>
                    <p className="text-xs font-semibold text-gray-600">
                      Wallet: <span className="font-mono text-black font-medium">{wallet.address}</span>
                    </p>
                  </div>
                </div>

                {!isVerified ? (
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying || isConnecting}
                    aria-busy={isVerifying}
                    className="w-full neo-border bg-[#22d3ee] py-4 text-xs sm:text-sm text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isVerifying ? (
                      <>
                        <ButtonLoader />
                        <span>Verifying Signature & Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Authenticate Wallet & Sign Challenge</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-[#a8ff3e] neo-border p-4  flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium text-xs text-black">
                      <span>✓</span>
                      <span>Wallet verified</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      disabled={isBusy}
                      className=" neo-border bg-white px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      Proceed to Step 3 →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {activeStep === 3 && (
          <div className="neo-border-thick bg-white  p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="border-b-2 border-black pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-black">Step 3: Select & Register Profile</h2>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">
                  Choose your primary role and submit or select your profile information.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isBusy}
                className=" neo-border bg-[#ffb6b9] px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                Disconnect Wallet
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option 1: Business Owner */}
              <div
                onClick={() => {
                  if (isBusy) return;
                  setRole('BUSINESS');
                  setShowManualForm(false);
                }}
                aria-disabled={isBusy}
                className={`p-6 neo-border transition-all space-y-4 relative ${
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${
                  role === 'BUSINESS' || role === 'business'
                    ? 'bg-[#a8ff3e]/20 neo-border-thick shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                    : 'bg-[#f7f7f7] hover:bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12  bg-[#a8ff3e] neo-border flex items-center justify-center text-xl">
                    🏢
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {(role === 'BUSINESS' || role === 'business') && (
                      <span className="bg-[#a8ff3e] text-black text-xs font-medium px-3 py-1  neo-border">
                        ✓ BUSINESS
                      </span>
                    )}
                    {existingBusiness && (
                      <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 neo-border">
                        Profile Exists
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-syne font-medium text-xl text-black">Business Owner</h3>
                  <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-1">
                    Submit verified corporate invoices and draw down sBTC liquidity.
                  </p>
                  {existingBusiness && (
                    <div className="mt-2 text-xs font-bold text-[#6B46C1]">
                      ● Linked: {existingBusiness.companyName}
                    </div>
                  )}
                </div>
              </div>

              {/* Option 2: Capital Investor */}
              <div
                onClick={() => {
                  if (isBusy) return;
                  setRole('INVESTOR');
                  setShowManualForm(false);
                }}
                aria-disabled={isBusy}
                className={`p-6 neo-border transition-all space-y-4 relative ${
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${
                  role === 'INVESTOR' || role === 'investor'
                    ? 'bg-[#c4b5fd]/30 neo-border-thick shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                    : 'bg-[#f7f7f7] hover:bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12  bg-[#c4b5fd] neo-border flex items-center justify-center text-xl">
                    💰
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {(role === 'INVESTOR' || role === 'investor') && (
                      <span className="bg-[#6B46C1] text-white text-xs font-medium px-3 py-1  neo-border">
                        ✓ INVESTOR
                      </span>
                    )}
                    {existingInvestor && (
                      <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 neo-border">
                        Profile Exists
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-syne font-medium text-xl text-black">Capital Investor</h3>
                  <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-1">
                    Fund verified trade receivables with sBTC and earn interest yields.
                  </p>
                  {existingInvestor && (
                    <div className="mt-2 text-xs font-bold text-[#6B46C1]">
                      ● Linked: {existingInvestor.displayName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Section: Existing Profile vs Manual Form */}
            {(role === 'BUSINESS' || role === 'business') && existingBusiness && !showManualForm ? (
              /* Previously Created Business Profile View */
              <div className="bg-[#a8ff3e]/10 neo-border p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    <h4 className="font-syne font-bold text-base text-black">Previously Created Business Profile</h4>
                  </div>
                  <span className="bg-[#a8ff3e] text-black text-xs font-bold px-3 py-1 neo-border">
                    ● PROFILE REGISTERED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-syne">
                  <div className="bg-white neo-border p-3.5 space-y-1">
                    <span className="text-gray-500 font-medium block text-[11px]">COMPANY NAME</span>
                    <span className="font-bold text-black text-sm block">{existingBusiness.companyName}</span>
                  </div>
                  <div className="bg-white neo-border p-3.5 space-y-1">
                    <span className="text-gray-500 font-medium block text-[11px]">REGISTRATION NUMBER</span>
                    <span className="font-mono font-bold text-black block">
                      {existingBusiness.registrationNumber || 'RC-998821'}
                    </span>
                  </div>
                  <div className="bg-white neo-border p-3.5 space-y-1">
                    <span className="text-gray-500 font-medium block text-[11px]">WEBSITE</span>
                    <span className="font-bold text-black block">
                      {existingBusiness.website || 'https://apexsupply.io'}
                    </span>
                  </div>
                  <div className="bg-white neo-border p-3.5 space-y-1">
                    <span className="text-gray-500 font-medium block text-[11px]">VERIFICATION STATUS</span>
                    <span className="inline-block bg-[#22d3ee] text-black font-bold px-2 py-0.5 neo-border text-[10px]">
                      {existingBusiness.verificationStatus || 'VERIFIED'}
                    </span>
                  </div>
                </div>

                {existingBusiness.description && (
                  <div className="bg-white neo-border p-3 text-xs font-syne">
                    <span className="text-gray-500 font-medium block text-[11px] mb-1">BUSINESS DESCRIPTION</span>
                    <p className="text-black font-medium">{existingBusiness.description}</p>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="hidden text-xs font-bold text-gray-700 hover:text-black underline cursor-pointer"
                  >
                    Need to register another profile or update details?
                  </button>

                  <button
                    type="button"
                    onClick={handleContinueWithExistingProfile}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full sm:w-auto neo-border bg-[#a8ff3e] px-8 py-4 font-syne text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 min-h-[56px]"
                  >
                    {isSubmitting ? (
                      <>
                        <ButtonLoader />
                        <span>Loading Dashboard...</span>
                      </>
                    ) : (
                      `Continue as ${existingBusiness.companyName} →`
                    )}
                  </button>
                </div>
              </div>
            ) : (role === 'INVESTOR' || role === 'investor') && existingInvestor && !showManualForm ? (
              /* Previously Created Investor Profile View */
              <div className="bg-[#c4b5fd]/20 neo-border p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <h4 className="font-syne font-bold text-base text-black">Previously Created Investor Profile</h4>
                  </div>
                  <span className="bg-[#6B46C1] text-white text-xs font-bold px-3 py-1 neo-border">
                    ● PROFILE REGISTERED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-syne">
                  <div className="bg-white neo-border p-3.5 space-y-1">
                    <span className="text-gray-500 font-medium block text-[11px]">INVESTOR DISPLAY NAME</span>
                    <span className="font-bold text-black text-sm block">{existingInvestor.displayName}</span>
                  </div>
                  <div className="bg-white neo-border p-3.5 space-y-1">
                    <span className="text-gray-500 font-medium block text-[11px]">ACTIVE CAPITAL POSITIONS</span>
                    <span className="font-mono font-bold text-[#6B46C1] text-sm block">
                      {existingInvestor.fundingsCount ?? existingInvestor.activeFundings ?? 1} Positions
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="hidden text-xs font-bold text-gray-700 hover:text-black underline cursor-pointer"
                  >
                    Need to register another profile or update details?
                  </button>

                  <button
                    type="button"
                    onClick={handleContinueWithExistingProfile}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full sm:w-auto neo-border bg-[#c4b5fd] px-8 py-4 font-syne text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 min-h-[56px]"
                  >
                    {isSubmitting ? (
                      <>
                        <ButtonLoader />
                        <span>Loading Dashboard...</span>
                      </>
                    ) : (
                      `Continue as ${existingInvestor.displayName} →`
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Fallback Manual Registration Form */
              <>
                <div className="bg-[#f7f7f7] neo-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-black">Profile Registration Details</h4>
                    {((role === 'BUSINESS' || role === 'business') && existingBusiness) ||
                    ((role === 'INVESTOR' || role === 'investor') && existingInvestor) ? (
                      <button
                        type="button"
                        onClick={() => setShowManualForm(false)}
                        className="text-xs font-bold text-[#6B46C1] hover:underline"
                      >
                        ← Use Previously Created Profile
                      </button>
                    ) : null}
                  </div>

                  {role === 'BUSINESS' || role === 'business' ? (
                    <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Company / Business Name *</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="ABC Logistics Ltd"
                        disabled={isSubmitting}
                        className="w-full neo-border  px-4 py-2.5 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e] disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Country (ISO-2)</label>
                      <input
                        type="text"
                        value={companyCountry}
                        onChange={(e) => setCompanyCountry(e.target.value.toUpperCase())}
                        maxLength={2}
                        placeholder="NG"
                        disabled={isSubmitting}
                        className="w-full neo-border px-4 py-2.5 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e] disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">Required before on-chain register-business.</p>
                    </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Investor Display Name / Vault Label
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Prudence Capital Vault"
                        disabled={isSubmitting}
                        className="w-full neo-border  px-4 py-2.5 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-black flex justify-end">
                  <button
                    type="button"
                    onClick={handleCompleteProfile}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full sm:w-auto neo-border bg-[#a8ff3e] px-8 py-4 font-syne text-sm font-medium text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 min-h-[56px]"
                  >
                    {isSubmitting ? (
                      <>
                        <ButtonLoader />
                        <span>Registering Profile via API...</span>
                      </>
                    ) : (
                      'Complete Profile & Enter Dashboard →'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="border-t-[3px] border-black bg-white py-6 px-4 text-center font-syne text-xs font-medium text-gray-500">
        FlowFi-BTC • sBTC Capital Settlement Rail • Stacks Testnet
      </footer>
    </div>
  );
};
