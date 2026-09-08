import React from 'react';
import { Page } from '../../types';

interface SidebarProps {
  active: Page;
  onNavigate: (page: Page) => void;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems: { page: Page; icon: React.ReactNode }[] = [
  {
    page: 'Overview',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    page: 'Protocols',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    page: 'Cascade Risk',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
  {
    page: 'Liquidity',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    page: 'API Docs',
    icon: (
      <svg className="h-[15px] w-[15px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

// ─── Tracked infrastructure ───────────────────────────────────────────────────

const trackedProtocols = [
  { name: 'Zest Protocol', type: 'Lending',   color: 'text-emerald-400' },
  { name: 'SSE Engine',    type: 'CDP Vault',  color: 'text-blue-400'   },
  { name: 'Granite',       type: 'Lending',    color: 'text-amber-400'  },
  { name: 'Bitflow / ALEX',type: 'DEX AMM',   color: 'text-purple-400' },
];

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  icon,
  label,
  index,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center gap-3  px-3 py-1.5 text-left text-[13.5px] transition-colors select-none ${
        active
          ? 'bg-white/[0.07] text-white font-medium'
          : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
      }`}
    >
      {/* Active bar */}
      {active && (
        <span className="absolute -left-3 top-1/2 h-4 w-[3px] -translate-y-1/2  bg-blue-500" />
      )}

      {/* Icon */}
      <span className={`shrink-0 transition-colors ${active ? 'text-blue-400' : 'text-zinc-500'}`}>
        {icon}
      </span>

      {/* Index */}
      <span className={`shrink-0 font-syne text-[10px] tabular-nums transition-colors ${
        active ? 'text-blue-400/60' : 'text-zinc-700'
      }`}>
        0{index + 1}
      </span>

      {/* Label */}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => {
  return (
    <aside className="flex w-full flex-col border-b border-white/10 bg-black/30 px-3 py-5 backdrop-blur-xl select-none lg:fixed lg:inset-y-0 lg:w-60 lg:border-b-0 lg:border-r lg:border-white/10 lg:py-5">

      {/* ── Brand ── */}
      <div className="flex items-center justify-between px-3 pb-6 pt-1 lg:block">
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="grid h-8 w-8 shrink-0 place-items-center  bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-md shadow-sky-500/20">
            <span className="font-syne text-[11px] font-black tracking-wider">FS</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold tracking-tight text-white">FlowScan</span>
              {/* MVP badge — version pill style */}
              <span className="flex items-center gap-1  border border-white/10 bg-white/[0.02] px-2 py-0.5 font-syne text-[9px] font-semibold text-blue-300">
                <span className="h-1.5 w-1.5  bg-blue-500" />
                MVP
              </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Stacks Risk Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="flex-1 overflow-y-auto px-0">
        <div className="flex flex-col gap-6">

          {/* ANALYTICS group */}
          <div className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-zinc-500">
              ANALYTICS
            </span>
            <div className="flex flex-col gap-0.5">
              {navItems.slice(0, 4).map(({ page, icon }, i) => (
                <NavItem
                  key={page}
                  icon={icon}
                  label={page}
                  index={i}
                  active={active === page}
                  onClick={() => onNavigate(page)}
                />
              ))}
            </div>
          </div>

          {/* DEVELOPER group */}
          <div className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-zinc-500">
              DEVELOPER
            </span>
            <div className="flex flex-col gap-0.5">
              {navItems.slice(4).map(({ page, icon }, i) => (
                <NavItem
                  key={page}
                  icon={icon}
                  label={page}
                  index={4 + i}
                  active={active === page}
                  onClick={() => onNavigate(page)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 my-3 border-t border-white/10" />

      {/* ── Tracked Infrastructure ── */}
      <div className="hidden px-3 lg:block">
        <span className="text-[11px] font-semibold tracking-wider text-zinc-500">
          TRACKED INFRASTRUCTURE
        </span>

        <div className="mt-2 space-y-1">
          {trackedProtocols.map(({ name, type, color }) => (
            <div
              key={name}
              className="flex items-center justify-between  border border-white/10 bg-white/[0.02] px-3 py-1.5"
            >
              <span className="font-syne text-[11px] text-zinc-300">{name}</span>
              <span className={`font-syne text-[10px] font-semibold ${color}`}>{type}</span>
            </div>
          ))}
        </div>

        {/* ── Node status ── */}
        <div className="mx-0 my-3 border-t border-white/10" />

        <div className="flex items-center justify-between  border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="flex items-center gap-2 text-[12px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5  bg-emerald-400 animate-pulse" />
            Node Connected
          </span>
          <span className="flex items-center gap-1  border border-white/10 bg-white/[0.02] px-2 py-0.5 font-syne text-[10px] text-zinc-500">
            v2.4
          </span>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="pb-1" />
    </aside>
  );
};