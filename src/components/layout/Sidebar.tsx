import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';

interface NavConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const railNavItems: NavConfig[] = [
  {
    path: '/dashboard',
    label: 'Overview',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    path: '/receivable',
    label: 'Receivable',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: '/funding',
    label: 'Active Funding',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    path: '/history',
    label: 'Transparency',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    path: '/verification',
    label: 'Verification',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  }
];

// --- Decorative background doodles, styled after the landing page's floating stars/squiggles ---
const Star4Point = ({ className = '', fill = '#ffb6b9' }: { className?: string; fill?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill={fill} stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const Star8Point = ({ className = '', fill = '#ff9e43' }: { className?: string; fill?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <path d="M50 0 L58 38 L96 28 L66 50 L96 72 L58 62 L50 100 L42 62 L4 72 L34 50 L4 28 L42 38 Z" fill={fill} stroke="black" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

const SquigglyLine = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 120 60" className={className}>
    <path d="M5 45 Q 25 5 50 30 T 110 25" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" />
    <path d="M5 45 Q 25 5 50 30 T 110 25" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const Dot = ({ className = '', fill = '#a8ff3e' }: { className?: string; fill?: string }) => (
  <span className={`block rounded-full border-2 border-black ${className}`} style={{ backgroundColor: fill }} />
);

const SidebarDoodles = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 opacity-[0.55]">
    <Star4Point className="absolute top-[8%] right-[10%] w-5 h-5 -rotate-12" fill="#ffb6b9" />
    <Star4Point className="absolute top-[34%] left-[6%] w-4 h-4 rotate-6" fill="#fef08a" />
    <Star8Point className="absolute top-[52%] right-[14%] w-6 h-6 rotate-[15deg]" fill="#ff9e43" />
    <Star4Point className="absolute top-[70%] left-[12%] w-4 h-4 -rotate-6" fill="#c4b5fd" />
    <Star4Point className="absolute bottom-[16%] right-[8%] w-5 h-5 rotate-[20deg]" fill="#a8ff3e" />
    <SquigglyLine className="absolute top-[22%] right-[4%] w-16 h-10 rotate-[8deg] opacity-70" />
    <SquigglyLine className="absolute bottom-[28%] left-[2%] w-14 h-8 -rotate-[10deg] opacity-60" />
    <Dot className="absolute top-[16%] left-[20%] w-3 h-3" fill="#22d3ee" />
    <Dot className="absolute top-[44%] right-[22%] w-2.5 h-2.5" fill="#ffb6b9" />
    <Dot className="absolute bottom-[10%] left-[30%] w-3 h-3" fill="#fef08a" />
  </div>
);

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { wallet, connect, disconnect } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <aside className="relative flex w-full flex-col overflow-hidden border-b-[3px] border-black bg-[#f7f7f7] px-3 py-5 select-none lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r-[3px] lg:py-6 z-30 font-syne">
      {/* ── Background doodles ── */}
      <SidebarDoodles />

      {/* ── Brand ── */}
      <div className="relative z-10 flex items-center justify-between px-2 pb-6 pt-1 lg:block">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded neo-border neo-shadow-btn overflow-hidden bg-[#a8ff3e]">
            <img src="https://avatars.githubusercontent.com/u/296891105?s=200&v=4" alt="FlowFi" className="h-full w-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[16px] tracking-tight text-black">FlowFi-BTC</span>
            </div>
            <p className="hidden text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Capital Settlement Rail
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-0">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1.5 mt-1 mr-1">
              {railNavItems.map(({ path, label, icon }) => {
                const isActive =
                  path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`relative flex w-full items-center gap-3 rounded-full px-3 py-2 text-left text-[13.5px] font-bold transition-all select-none ${
                      isActive
                        ? 'neo-border bg-[#a8ff3e] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                        : 'text-gray-700 hover:bg-white hover:neo-border hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Icon */}
                    <span className={`shrink-0 ${isActive ? 'text-black' : 'text-[#6B46C1]'}`}>
                      {icon}
                    </span>



                    {/* Label */}
                    <span className="truncate">{label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="relative z-10 mx-1 my-3 border-t-[3px] border-dashed border-black/20" />

      {/* ── Bottom Section: Settings & Wallet Connect ── */}
      <div className="relative z-10 flex flex-col gap-2.5 px-0 pt-1">
        {/* Wallet Trigger Button & Balance Info */}
        {wallet.isConnected ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="flex w-full items-center justify-between gap-2 rounded-full neo-border bg-[#22d3ee] px-3.5 py-2 font-syne text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full bg-black shrink-0" />
                <span className="truncate">
                  {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                </span>
              </div>
              <span className="text-[10px] font-syne font-extrabold bg-white neo-border px-2 py-0.5 rounded-full shrink-0">
                {wallet.sbtcBalance} sBTC
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowWalletModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full neo-border bg-[#a8ff3e] px-4 py-2.5 text-xs font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            Connect Wallet
          </button>
        )}
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-md rounded-[24px] neo-border-thick bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <h3 className="font-extrabold text-black text-lg">Connect Stacks Wallet</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="h-8 w-8 rounded-full neo-border bg-[#f7f7f7] text-black font-bold flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => {
                  connect('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
                  setShowWalletModal(false);
                }}
                className="flex w-full items-center justify-between rounded-[18px] neo-border bg-[#f7f7f7] p-4 text-left hover:bg-[#a8ff3e] transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-400 neo-border flex items-center justify-center font-syne font-bold text-black">
                    LT
                  </div>
                  <div>
                    <div className="font-extrabold text-black">Leather Wallet</div>
                    <div className="text-xs text-gray-600 font-syne font-bold">Stacks & Bitcoin Native</div>
                  </div>
                </div>
                <span className="font-syne text-xs font-extrabold text-black">Connect →</span>
              </button>

              <button
                onClick={() => {
                  connect('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
                  setShowWalletModal(false);
                }}
                className="flex w-full items-center justify-between rounded-[18px] neo-border bg-[#f7f7f7] p-4 text-left hover:bg-[#c4b5fd] transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-400 neo-border flex items-center justify-center font-syne font-bold text-black">
                    XV
                  </div>
                  <div>
                    <div className="font-extrabold text-black">Xverse Wallet</div>
                    <div className="text-xs text-gray-600 font-syne font-bold">Bitcoin Web3 Wallet</div>
                  </div>
                </div>
                <span className="font-syne text-xs font-extrabold text-black">Connect →</span>
              </button>

              {wallet.isConnected && (
                <div className="pt-3 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => {
                      disconnect();
                      setShowWalletModal(false);
                    }}
                    className="flex w-full items-center justify-center rounded-full neo-border bg-[#ffb6b9] px-4 py-2.5 text-xs font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9]"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 pb-1" />
    </aside>
  );
};