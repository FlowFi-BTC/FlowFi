import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { onboardingApi } from '../lib/api';
import { friendlyErrorMessage } from '../lib/errors';
import { RequireRole } from '../components/auth/RequireRole';

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

/**
 * Onboarding — modal or /onboarding (§6 #4/#5).
 * POST /onboarding {role} then GET /status → nextStep routes to
 * /dashboard/settings (business #6) or investor profile form (#9).
 */
export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectRoleOnboarding, role, setRole } = useUser();
  const [busy, setBusy] = useState<'BUSINESS' | 'INVESTOR' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (next: 'BUSINESS' | 'INVESTOR') => {
    setBusy(next);
    setError(null);
    try {
      setRole(next);
      await selectRoleOnboarding(next);
      const status = await onboardingApi.getStatus().catch(() => null);
      const nextStep = (status?.nextStep || '').toUpperCase();
      if (next === 'BUSINESS') {
        // CREATE_BUSINESS_PROFILE / verification / CREATE_RECEIVABLE all land in settings first
        navigate('/dashboard/settings');
      } else {
        navigate(nextStep.includes('FUND') ? '/investor/fundings' : '/settings');
      }
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Role selection failed.'));
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    onboardingApi.getStatus().catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-10 sm:px-6 font-syne">
      <div className="mx-auto max-w-[680px] space-y-6">
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-center">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="text-[1.6rem] font-bold text-black">Choose your workspace</h1>
          <p className="mt-1 text-[13px] text-gray-600">
            Two distinct dashboards, one wallet. This is a real role split in the backend
            (POST /v1/onboarding) — not a UI toggle.
          </p>
        </div>

        {error && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 text-xs font-bold text-black flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['BUSINESS', 'INVESTOR'] as const).map((r) => (
            <button
              key={r}
              onClick={() => choose(r)}
              disabled={!!busy}
              className={`neo-border-thick p-6 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${
                role === r ? 'bg-[#a8ff3e]/30' : 'bg-white'
              }`}
            >
              <div className="text-2xl">{r === 'BUSINESS' ? '🏢' : '💰'}</div>
              <div className="mt-2 font-bold text-black">{r === 'BUSINESS' ? 'Business Owner' : 'Capital Investor'}</div>
              <p className="mt-1 text-xs text-gray-600">
                {r === 'BUSINESS'
                  ? 'Submit receivables, register on-chain, repay sBTC.'
                  : 'Fund open receivables with sBTC and track settlement.'}
              </p>
              <div className="mt-3 text-xs font-bold text-[#6B46C1]">
                {busy === r ? 'Saving role…' : `Continue as ${r} →`}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <Link to="/dashboard" className="text-xs font-bold text-gray-600 hover:text-black underline">
            Skip — decide later in Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RequireRole allow={['BUSINESS', 'INVESTOR']}>{children}</RequireRole>
);
