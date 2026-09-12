import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import type { UserRole } from '../../types/api';

interface RequireRoleProps {
  allow: UserRole | UserRole[];
  children: React.ReactNode;
  /** Where the "complete registration" CTA points. Defaults to /get-started. */
  ctaTo?: string;
}

/**
 * Graceful role gate for BUSINESS / INVESTOR pages (§6 roles + onboarding nextStep).
 * - Not connected / no session → "Connect wallet" prompt (never a blank page).
 * - Wrong role → explains which role is needed + links to dashboards, keeps styling.
 * Follows the existing neo-brutalist card styling strictly.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ allow, children, ctaTo = '/get-started' }) => {
  const { wallet, user, role, isLoading } = useUser();
  const allowed = Array.isArray(allow) ? allow : [allow];
  const normalized = (role as string)?.toUpperCase() as UserRole;

  if (isLoading) {
    return (
      <div className="neo-border-thick bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center text-xs font-bold text-gray-500 animate-pulse">
        Restoring wallet session…
      </div>
    );
  }

  if (!wallet.isConnected || !user) {
    return (
      <div className="neo-border-thick bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
        <div className="text-2xl">🔌</div>
        <div className="font-bold text-black text-sm">Wallet connection required</div>
        <p className="text-gray-600 text-xs max-w-sm mx-auto">
          Connect your Stacks wallet to access this workspace. Your role is resolved from{' '}
          <span className="font-mono">GET /auth/me</span> after login.
        </p>
        <Link
          to={ctaTo}
          className="inline-block neo-border bg-[#a8ff3e] px-5 py-2.5 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
        >
          Connect & Continue →
        </Link>
      </div>
    );
  }

  if (!allowed.includes(normalized)) {
    const need = allowed.join(' or ');
    return (
      <div className="neo-border-thick bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
        <div className="text-2xl">🔒</div>
        <div className="font-bold text-black text-sm">This workspace needs the {need} role</div>
        <p className="text-gray-600 text-xs max-w-md mx-auto">
          Your connected wallet is registered as <span className="font-bold text-black">{normalized || 'no role yet'}</span>.
          {normalized === 'BUSINESS'
            ? ' Investor actions (funding) need an investor profile — switch via onboarding.'
            : ' Business actions (submit, register, repay) need a business profile — switch via onboarding.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            to="/dashboard"
            className="neo-border bg-[#f7f7f7] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            Go to my dashboard →
          </Link>
          <Link
            to={ctaTo}
            className="neo-border bg-[#c4b5fd] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            Manage role →
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
