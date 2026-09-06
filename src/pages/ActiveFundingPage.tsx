// --- Types ---
type FundingStatus = 'Repaid' | 'Active' | 'Defaulted' | 'Overdue';

interface SummaryStat {
  label: string;
  value: number;
  accent: string;
}

interface FundingRow {
  id: string;
  vendor: string;
  amount: string;
  status: FundingStatus;
  dueDate: string;
}

// --- Data ---
const summary: SummaryStat[] = [
  { label: 'Funded', value: 1, accent: '#a8ff3e' },
  { label: 'Repaid', value: 1, accent: '#22d3ee' },
  { label: 'Defaulted', value: 0, accent: '#ffb6b9' },
];

const rows: FundingRow[] = [
  { id: '#001', vendor: 'ABC Supplies', amount: '0.15 sBTC', status: 'Repaid', dueDate: 'Oct 15, 2026' },
];

const statusStyles: Record<FundingStatus, string> = {
  Repaid: 'bg-[#a8ff3e] text-black',
  Active: 'bg-[#c4b5fd] text-black',
  Defaulted: 'bg-[#ffb6b9] text-black',
  Overdue: 'bg-[#fef08a] text-black',
};

// A tiny hand-drawn 4-point star, reused across the app's UI.
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

const SummaryCard = ({ label, value, accent }: SummaryStat) => (
  <div className="neo-border-thick bg-white rounded-[24px] p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
    <div className="mb-3 flex items-center gap-2">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full neo-border"
        style={{ backgroundColor: accent }}
      >
        <RailStar className="h-3.5 w-3.5" />
      </div>
      <span className="text-[13px] font-bold text-gray-600">{label}</span>
    </div>
    <div className="font-syne text-3xl font-extrabold text-black">{value}</div>
  </div>
);

export const  ActiveFundingPage = () => {
  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-sans">
      <div className="mx-auto max-w-[760px] space-y-6">

        {/* ── Header ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="font-syne text-[1.6rem] font-extrabold leading-tight text-black">
            Active <span className="text-[#6B46C1]">Funding</span>
          </h1>
          <p className="mt-1 text-[14px] font-semibold text-gray-600">
            Track all your funded receivables.
          </p>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summary.map((s) => (
            <SummaryCard key={s.label} {...s} />
          ))}
        </div>

        {/* ── Funding table ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {/* Table header row */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 border-b-[3px] border-black pb-3 mb-1">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B46C1]">Receivable</span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B46C1]">Amount</span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B46C1]">Status</span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B46C1]">Due Date</span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B46C1]">&nbsp;</span>
          </div>

          <div className="divide-y-2 divide-black/10">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 sm:gap-4 items-center py-4"
              >
                <div>
                  <div className="font-bold text-black text-[14px]">{row.id}</div>
                  <div className="text-[12px] font-semibold text-gray-500">{row.vendor}</div>
                </div>
                <div className="font-syne font-bold text-[13px] text-black">{row.amount}</div>
                <div>
                  <span className={`inline-block rounded-full neo-border px-3 py-1 text-[11px] font-bold ${statusStyles[row.status]}`}>
                    {row.status}
                  </span>
                </div>
                <div className="text-[13px] font-semibold text-gray-700">{row.dueDate}</div>
                <div className="text-right sm:text-left">
                  <button className="text-[13px] font-bold text-[#6B46C1] hover:underline">
                    View
                  </button>
                </div>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="py-10 text-center text-[13px] font-semibold text-gray-400">
                No funded receivables yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}