import React from 'react';
import { Link } from 'react-router-dom';

// --- Types ---
type ReceivableStatus = 'Verified' | 'Funded' | 'Repaid' | 'Submitted';

interface StatCard {
  label: string;
  value: number;
  accent: string; // bg color for the icon chip
}

interface ActivityItem {
  id: string;
  receivableId: number;
  status: ReceivableStatus;
  time: string;
}

// --- Data ---
const stats: StatCard[] = [
  { label: 'Submitted Receivables', value: 3, accent: '#ffb6b9' },
  { label: 'Verified Receivables', value: 2, accent: '#a8ff3e' },
  { label: 'Funded Receivables', value: 1, accent: '#fef08a' },
  { label: 'Completed Receivables', value: 1, accent: '#22d3ee' },
];

const activity: ActivityItem[] = [
  { id: '#001', receivableId: 1, status: 'Verified', time: '2 hours ago' },
  { id: '#001', receivableId: 1, status: 'Funded', time: '1 hour ago' },
  { id: '#001', receivableId: 1, status: 'Repaid', time: '30 mins ago' },
];

// --- Status pill styling ---
const statusStyles: Record<ReceivableStatus, string> = {
  Verified: 'bg-[#a8ff3e] text-black',
  Funded: 'bg-[#c4b5fd] text-black',
  Repaid: 'bg-[#fef08a] text-black',
  Submitted: 'bg-[#ffb6b9] text-black',
};

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

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const StatCardView = ({ label, value, accent }: StatCard) => (
  <div className="neo-border-thick bg-white rounded-[24px] p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
    <div
      className="mb-4 flex h-9 w-9 items-center justify-center rounded-full neo-border"
      style={{ backgroundColor: accent }}
    >
      <RailStar className="h-4 w-4" />
    </div>
    <div className="font-syne text-3xl font-extrabold text-black">{value}</div>
    <div className="mt-1 text-[13px] font-bold text-gray-600">{label}</div>
  </div>
);

const ActivityRow = ({ id, receivableId, status, time }: ActivityItem) => (
  <Link
    to={`/receivable/${receivableId}`}
    className="flex items-center justify-between rounded-[18px] border-2 border-black/10 bg-[#f7f7f7] px-4 py-3 hover:border-black/40 hover:bg-white transition-all group font-syne"
  >
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white neo-border group-hover:bg-[#a8ff3e]">
        <ClockIcon />
      </div>
      <span className="text-[14px] font-bold text-black group-hover:underline">Receivable {id}</span>
      <span className={`rounded-full neo-border px-2.5 py-0.5 text-[11px] font-bold ${statusStyles[status]}`}>
        {status}
      </span>
    </div>
    <span className="text-[12px] font-semibold text-gray-500">{time}</span>
  </Link>
);

export const OverviewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-sans">
      <div className="mx-auto max-w-[640px] space-y-6">

        {/* ── Welcome header ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="font-syne text-[1.6rem] font-extrabold leading-tight text-black">
            Welcome back, <span className="text-[#6B46C1]">Builder</span>
          </h1>
          <p className="mt-1 text-[14px] font-semibold text-gray-600">
            Here's your sBTC capital rail dashboard overview.
          </p>
        </div>

        {/* ── Stat grid ── */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <StatCardView key={s.label} {...s} />
          ))}
        </div>

        {/* ── Recent activity ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-syne text-[1.2rem] font-extrabold text-black">Recent Activity</h2>
            <Link to="/history" className="text-[13px] font-bold text-[#6B46C1] hover:underline">
              View All History →
            </Link>
          </div>
          <div className="space-y-2.5">
            {activity.map((a, i) => (
              <ActivityRow key={i} {...a} />
            ))}
          </div>
        </div>

        {/* ── CTA banner ── */}
        <div className="neo-border-thick bg-[#6B46C1] rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 opacity-30">
            <RailStar className="h-20 w-20" />
          </div>
          <div className="relative z-10">
            <h3 className="font-syne text-[1.15rem] font-extrabold text-white">
              Ready to submit a new receivable?
            </h3>
            <p className="mt-1 text-[13px] font-semibold text-white/80 max-w-[320px]">
              Get your business receivable verified and connect with sBTC capital.
            </p>
          </div>
          <Link
            to="/submit-receivable"
            className="relative z-10 shrink-0 rounded-full bg-[#a8ff3e] px-5 py-2.5 font-bold text-black neo-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            Submit Receivable
          </Link>
        </div>

      </div>
    </div>
  );
};