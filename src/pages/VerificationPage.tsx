// --- Types ---
interface TimelineStep {
  title: string;
  description: string;
  date: string;
  done: boolean;
}

// --- Data ---
const steps: TimelineStep[] = [
  { title: 'Submitted', description: 'Receivable submitted successfully.', date: 'Apr 18, 2025 10:24 AM', done: true },
  { title: 'Under Review', description: 'Reviewed by verification team.', date: 'Apr 18, 2025 2:15 PM', done: true },
  { title: 'Business Verified', description: 'Business registration confirmed.', date: 'Apr 18, 2025 6:12 AM', done: true },
  { title: 'Debtor Confirmed', description: 'Debtor acknowledged receivable.', date: 'Apr 18, 2025 1:30 PM', done: true },
  { title: 'Receivable Verified', description: 'Verification complete.', date: 'Apr 18, 2025 3:41 PM', done: true },
];

const verifierNotes = [
  'Business registration confirmed.',
  'Debtor acknowledged receivable.',
  'Invoice reviewed.',
];

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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TimelineRow = ({ step, isLast }: { step: TimelineStep; isLast: boolean }) => (
  <div className="flex gap-4">
    {/* Node + connecting line */}
    <div className="flex flex-col items-center">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full neo-border bg-[#a8ff3e]">
        <CheckIcon />
      </div>
      {!isLast && <div className="w-[3px] flex-1 bg-black/15 my-1" />}
    </div>

    {/* Content */}
    <div className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="font-syne text-[15px] font-extrabold text-black">{step.title}</span>
        <span className="text-[11px] font-bold text-gray-400">{step.date}</span>
      </div>
      <p className="mt-0.5 text-[13px] font-semibold text-gray-600">{step.description}</p>
    </div>
  </div>
);

export const  VerificationPage = () => {
  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-sans">
      <div className="mx-auto max-w-[680px] space-y-6">

        {/* ── Header ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <h1 className="font-syne text-[1.6rem] font-extrabold leading-tight text-black">
            Verification <span className="text-[#6B46C1]">Status</span>
          </h1>
          <p className="mt-1 text-[14px] font-semibold text-gray-600">
            Track the progress of your receivable verification.
          </p>
        </div>

        {/* ── Receivable summary bar ── */}
        <div className="neo-border-thick bg-white rounded-[24px] p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-syne text-[16px] font-extrabold text-black">Receivable #001</div>
            <div className="mt-0.5 text-[12px] font-semibold text-gray-500">Submitted 2 days ago</div>
          </div>
          <span className="rounded-full neo-border bg-[#a8ff3e] px-3 py-1 text-[12px] font-bold text-black">
            Verified
          </span>
        </div>

        {/* ── Timeline ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {steps.map((step, i) => (
            <TimelineRow key={step.title} step={step} isLast={i === steps.length - 1} />
          ))}
        </div>

        {/* ── Verification details ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-syne text-[1.1rem] font-extrabold text-black mb-4">Verification Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-[16px] border-2 border-black/10 bg-[#f7f7f7] p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B46C1] mb-1">Verifier</div>
              <div className="text-[14px] font-bold text-black">Capital Rail</div>
            </div>
            <div className="rounded-[16px] border-2 border-black/10 bg-[#f7f7f7] p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B46C1] mb-1">Verifier Hash</div>
                <div className="truncate font-syne text-[13px] font-bold text-black">0x7a1f...8c5e</div>
              </div>
              <button className="shrink-0 text-[12px] font-bold text-[#6B46C1] hover:underline">
                View on Explorer
              </button>
            </div>
          </div>
        </div>

        {/* ── Verifier notes ── */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-syne text-[1.1rem] font-extrabold text-black mb-4">Verifier Notes</h2>
          <ul className="space-y-2.5">
            {verifierNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#a8ff3e] border border-black" />
                <span className="text-[13.5px] font-semibold text-gray-700">{note}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}