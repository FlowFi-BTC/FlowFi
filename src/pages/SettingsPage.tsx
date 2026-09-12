import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/common/Card';
import { useUser } from '../context/UserContext';
import { businessApi, investorApi, onboardingApi } from '../lib/api';
import type { BusinessProfile, InvestorProfile, OnboardingStatusResponse } from '../types/api';

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

const NETWORK_KEY = 'flowfi_network';
const RPC_KEY = 'flowfi_rpc_endpoint';

function getApiErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  return (
    err?.message ||
    err?.error?.message ||
    err?.data?.error?.message ||
    err?.response?.data?.error?.message ||
    fallback
  );
}

export const SettingsPage: React.FC = () => {
  const {
    wallet,
    user,
    role,
    isLoading: contextLoading,
    connectWallet,
    disconnectWallet,
    refreshUserSession,
    registerBusinessProfile,
    registerInvestorProfile,
    updateBusinessProfile,
    updateInvestorProfile,
  } = useUser();

  const normalizedRole = role === 'INVESTOR' || (role as string) === 'investor' ? 'INVESTOR' : 'BUSINESS';
  const isBusiness = normalizedRole === 'BUSINESS';

  // Network / RPC prefs (local only, persisted)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>(() => {
    const saved = localStorage.getItem(NETWORK_KEY);
    return saved === 'mainnet' ? 'mainnet' : 'testnet';
  });
  const [rpcEndpoint, setRpcEndpoint] = useState(
    () => localStorage.getItem(RPC_KEY) || 'https://api.testnet.hiro.so'
  );

  // Live API-backed profiles (fresher than cached UserContext user)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatusResponse | null>(null);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);

  // Business form state — PATCH /v1/businesses/me
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');

  // Investor form state — PATCH /v1/investors/me
  const [displayName, setDisplayName] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const hasBusinessProfile = !!(businessProfile || user?.businessProfile);
  const hasInvestorProfile = !!(investorProfile || user?.investorProfile);

  const fetchProfiles = useCallback(async () => {
    if (!wallet.isConnected && !user) return;
    setIsFetchingProfiles(true);
    try {
      // Onboarding status drives profileComplete / nextStep / verification badges
      // GET /v1/onboarding/status
      try {
        const status = await onboardingApi.getStatus();
        setOnboarding(status);
      } catch {
        setOnboarding(null);
      }

      // GET /v1/businesses/me — 404 when investor-only or not yet registered
      try {
        const biz = await businessApi.getMe();
        if (biz && (biz.id || biz.companyName)) setBusinessProfile(biz);
        else setBusinessProfile(null);
      } catch {
        setBusinessProfile(null);
      }

      // GET /v1/investors/me — 404 when business-only or not yet registered
      try {
        const inv = await investorApi.getMe();
        if (inv && (inv.id || inv.displayName)) setInvestorProfile(inv);
        else setInvestorProfile(null);
      } catch {
        setInvestorProfile(null);
      }
    } finally {
      setIsFetchingProfiles(false);
    }
  }, [wallet.isConnected, user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Hydrate forms from the freshest available profile (API result wins, context fallback)
  useEffect(() => {
    const biz = businessProfile || user?.businessProfile;
    if (biz) {
      setCompanyName(biz.companyName || '');
      setRegistrationNumber(biz.registrationNumber || '');
      setWebsite(biz.website || '');
      setDescription(biz.description || '');
      setCountry((biz as any).country || '');
    }
  }, [businessProfile, user?.businessProfile]);

  useEffect(() => {
    const inv = investorProfile || user?.investorProfile;
    if (inv) {
      setDisplayName(inv.displayName || '');
    }
  }, [investorProfile, user?.investorProfile]);

  useEffect(() => {
    localStorage.setItem(NETWORK_KEY, network);
  }, [network]);

  useEffect(() => {
    localStorage.setItem(RPC_KEY, rpcEndpoint);
  }, [rpcEndpoint]);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setApiError('Company name is required.');
      return;
    }
    setIsUpdating(true);
    try {
      const payload = {
        companyName: trimmedName,
        registrationNumber: registrationNumber.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        country: country.trim()?.toUpperCase() || undefined,
      };
      if (hasBusinessProfile) {
        await updateBusinessProfile(payload);
      } else {
        await registerBusinessProfile(payload);
      }
      await fetchProfiles();
      await refreshUserSession();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update business profile:', err);
      setApiError(getApiErrorMessage(err, 'Failed to save business profile. Check API connection.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setApiError('Display name / vault label is required.');
      return;
    }
    setIsUpdating(true);
    try {
      if (hasInvestorProfile) {
        await updateInvestorProfile(trimmed);
      } else {
        await registerInvestorProfile(trimmed);
      }
      await fetchProfiles();
      await refreshUserSession();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update investor profile:', err);
      setApiError(getApiErrorMessage(err, 'Failed to save investor profile. Check API connection.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const activeBusiness = businessProfile || user?.businessProfile || null;
  const activeInvestor = investorProfile || user?.investorProfile || null;
  const verificationStatus =
    activeBusiness?.verificationStatus || (onboarding?.verificationStatus as string) || 'PENDING';

  return (
    <div className="space-y-6 font-syne">
      {/* Header Banner */}
      <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
        <h1 className="font-syne text-[1.6rem] font-medium leading-tight text-black">
          Profile & Settlement <span className="text-[#6B46C1]">Rail Preferences</span>
        </h1>
        <p className="mt-1 text-[13px] text-gray-600 max-w-[460px]">
          Update your {isBusiness ? 'business' : 'investor'} profile via the Capital Rail API and
          configure the Stacks node your account settles through.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium">
          <span className="neo-border bg-white px-2.5 py-1">
            Role: {normalizedRole}
          </span>
          <span className="neo-border bg-white px-2.5 py-1">
            {onboarding?.profileComplete || user?.profileComplete ? '● Profile complete' : '○ Profile incomplete'}
          </span>
          {isBusiness && (
            <span className="neo-border bg-[#22d3ee] px-2.5 py-1 text-black">
              {verificationStatus}
            </span>
          )}
          {onboarding?.nextStep && (
            <span className="neo-border bg-[#f7f7f7] px-2.5 py-1 text-gray-600">
              Next: {onboarding.nextStep}
            </span>
          )}
        </div>
      </div>

      {apiError && (
        <div className="neo-border-thick bg-[#ffb6b9] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[13px] font-medium text-black flex items-center justify-between gap-3">
          <span>⚠️ {apiError}</span>
          <button onClick={() => setApiError(null)} className="font-medium">✕</button>
        </div>
      )}

      {!wallet.isConnected ? (
        <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3 text-center">
          <p className="font-medium text-gray-600 text-[13px]">
            Connect your Stacks wallet to load and edit your on-chain profile.
          </p>
          <button
            type="button"
            onClick={() => connectWallet()}
            className="neo-border bg-[#a8ff3e] px-5 py-2.5 text-[13px] font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
          >
            Connect Stacks Wallet
          </button>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form — role aware */}
          <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
              <h3 className="font-syne font-medium text-black text-[1.1rem]">
                {isBusiness ? 'Business Profile Settings' : 'Investor Profile Settings'}
              </h3>
              <span className="text-[11px] font-medium text-gray-500">
                {isFetchingProfiles || contextLoading
                  ? 'Syncing with API…'
                  : hasBusinessProfile || hasInvestorProfile
                  ? '● Linked to API profile'
                  : '○ No API profile yet — saving will create one'}
              </span>
            </div>

            {saveSuccess && (
              <div className="neo-border bg-[#a8ff3e] px-4 py-2.5 text-[13px] font-syne font-medium text-black">
                Profile saved and refreshed from API.
              </div>
            )}

            {isBusiness ? (
              <form onSubmit={handleUpdateBusiness} className="space-y-4 font-syne text-[13px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-600 font-medium block mb-1.5">Company Name *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ABC Logistics Ltd"
                      className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium block mb-1.5">Registration Number</label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="RC123456"
                      className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-600 font-medium block mb-1.5">Company Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium block mb-1.5">Country (ISO-2) *</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="NG"
                      className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">Required before on-chain register-business.</p>
                  </div>
                </div>

                <div>
                  <label className="text-gray-600 font-medium block mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Logistics company serving West Africa"
                    className="w-full neo-border bg-[#f7f7f7] p-3 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                  />
                </div>

                {activeBusiness && (
                  <div className="neo-border bg-[#f7f7f7] p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-gray-600">
                    <div><span className="block text-gray-400">STATUS</span><span className="text-black">{activeBusiness.verificationStatus}</span></div>
                    <div><span className="block text-gray-400">RECEIVABLES</span><span className="text-black">{activeBusiness.receivablesCount ?? 0}</span></div>
                    <div className="col-span-2"><span className="block text-gray-400">PROFILE ID</span><span className="text-black font-mono truncate block">{activeBusiness.id}</span></div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="neo-border bg-[#a8ff3e] px-5 py-2.5 text-[13px] font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-60"
                >
                  {isUpdating
                    ? hasBusinessProfile ? 'Updating via PATCH /businesses/me…' : 'Creating via POST /businesses…'
                    : 'Save Profile Changes →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdateInvestor} className="space-y-4 font-syne text-[13px]">
                <div>
                  <label className="text-gray-600 font-medium block mb-1.5">
                    Display Name / Vault Label *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Prudence Capital Vault"
                    className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    This is the <span className="font-mono">displayName</span> sent to{' '}
                    <span className="font-mono">POST /v1/investors</span> on create and{' '}
                    <span className="font-mono">PATCH /v1/investors/me</span> on update.
                  </p>
                </div>

                {activeInvestor && (
                  <div className="neo-border bg-[#f7f7f7] p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-medium text-gray-600">
                    <div><span className="block text-gray-400">FUNDINGS</span><span className="text-black">{activeInvestor.fundingsCount ?? 0}</span></div>
                    <div><span className="block text-gray-400">ACTIVE</span><span className="text-black">{activeInvestor.activeFundings ?? 0}</span></div>
                    <div><span className="block text-gray-400">PROFILE ID</span><span className="text-black font-mono truncate block">{activeInvestor.id}</span></div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="neo-border bg-[#c4b5fd] px-5 py-2.5 text-[13px] font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-60"
                >
                  {isUpdating
                    ? hasInvestorProfile ? 'Updating via PATCH /investors/me…' : 'Creating via POST /investors…'
                    : 'Save Investor Profile →'}
                </button>
              </form>
            )}
          </Card>

          {/* Stacks Node Config */}
          <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-syne font-medium text-black text-[1.1rem] border-b-2 border-black/10 pb-3">
              Stacks Blockchain Node & RPC Configuration
            </h3>

            <div className="space-y-4 font-syne text-[13px]">
              <div className="space-y-2">
                <label className="text-gray-600 font-medium block">
                  Target Stacks Network Environment
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setNetwork('testnet'); setRpcEndpoint('https://api.testnet.hiro.so'); }}
                    className={`flex-1 py-2.5 px-4 neo-border font-medium text-center transition-transform hover:-translate-y-0.5 ${
                      network === 'testnet'
                        ? 'bg-[#a8ff3e] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-600'
                    }`}
                  >
                    ● Stacks Testnet (sBTC Enabled)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setNetwork('mainnet'); setRpcEndpoint('https://api.hiro.so'); }}
                    className={`flex-1 py-2.5 px-4 neo-border font-medium text-center transition-transform hover:-translate-y-0.5 ${
                      network === 'mainnet'
                        ? 'bg-[#c4b5fd] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-600'
                    }`}
                  >
                    Mainnet (Preview Mode)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-gray-600 font-medium block">Hiro API RPC Endpoint URL</label>
                <input
                  type="text"
                  value={rpcEndpoint}
                  onChange={(e) => setRpcEndpoint(e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                />
                <p className="text-[11px] text-gray-500">Stored locally — used for sBTC balance lookups.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-syne font-medium text-black text-[1.1rem] border-b-2 border-black/10 pb-3">
              Connected Stacks Wallet
            </h3>

            {wallet.isConnected ? (
              <div className="space-y-4 font-syne text-[13px]">
                <div className="neo-border bg-[#c4b5fd] p-4 space-y-2">
                  <span className="text-[11px] font-medium text-black/70 block">
                    Active Account Address
                  </span>
                  <div className="font-medium text-black truncate">{wallet.address || user?.walletAddress}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/20 text-[13px] font-medium">
                    <span>sBTC Balance:</span>
                    <span className="neo-border bg-white px-2.5 py-0.5 text-[11px] font-medium">
                      {wallet.sbtcBalance} sBTC
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-black/70">
                    <span>User ID:</span>
                    <span className="font-mono truncate max-w-[140px]">{user?.id || '—'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={disconnectWallet}
                  className="w-full py-2.5 neo-border bg-[#ffb6b9] font-medium text-[13px] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
                >
                  Disconnect Wallet
                </button>

                <button
                  type="button"
                  onClick={() => { fetchProfiles(); refreshUserSession(); }}
                  disabled={isFetchingProfiles}
                  className="w-full py-2.5 neo-border bg-white font-medium text-[13px] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isFetchingProfiles ? 'Refreshing from API…' : 'Refresh from API ↻'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 font-syne text-[13px]">
                <p className="font-medium text-gray-600">No wallet connected.</p>
                <button
                  type="button"
                  onClick={() => connectWallet()}
                  className="w-full py-2.5 neo-border bg-[#a8ff3e] font-medium text-[13px] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
                >
                  Connect Stacks Wallet
                </button>
              </div>
            )}
          </Card>

          {/* Session / API snapshot */}
          <Card className="neo-border-thick bg-[#f7f7f7] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <h3 className="font-syne font-medium text-black text-[1rem] border-b-2 border-black/10 pb-2">
              API Session Snapshot
            </h3>
            <div className="font-mono text-[11px] space-y-1.5 text-gray-700 break-all">
              <div><span className="font-syne font-medium">GET /auth/me → </span>{user ? 'loaded' : 'no session'}</div>
              <div>wallet: {user?.walletAddress || wallet.address || '—'}</div>
              <div>role: {user?.role || normalizedRole}</div>
              <div>business: {activeBusiness?.companyName || '—'} ({activeBusiness?.verificationStatus || '—'})</div>
              <div>investor: {activeInvestor?.displayName || '—'}</div>
              <div>nextStep: {onboarding?.nextStep || '—'}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
