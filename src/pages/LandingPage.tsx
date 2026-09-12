import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FundingModal } from '../components/modular/receivable/FundingModal';

// Hand-drawn 4-point star for neo-brutal aesthetics
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

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, isVerified } = useUser();
  const hasToken = !!token || (typeof window !== 'undefined' && !!localStorage.getItem('flowfi_token'));

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black font-syne selection:bg-[#a8ff3e] selection:text-black">
      {/* ── 1. NAVBAR ── */}
      <header className="sticky top-0 z-40 border-b-[3px] border-black bg-white px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
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
                <span className="font-syne font-medium text-lg tracking-tight text-black">
                  FlowFi-BTC
                </span>
                <span className="bg-[#a8ff3e] text-black text-[10px] font-syne font-medium px-2 py-0.5  neo-border">
                  Beta
                </span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 hidden sm:block">

              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 font-syne text-sm">
            <Link to="/marketplace" className="text-gray-700 hover:text-black transition-colors font-medium">
              Explore Receivables
            </Link>
            <a href="#how-it-works" className="text-gray-700 hover:text-black transition-colors">
              How It Works
            </a>
            <a href="#for-businesses" className="text-gray-700 hover:text-black transition-colors">
              For Businesses
            </a>
            <a href="#for-capital-providers" className="text-gray-700 hover:text-black transition-colors">
              For Capital Providers
            </a>

          </nav>

          {/* Header Action CTA */}
          <div className="flex items-center gap-3">
            {hasToken || isVerified ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 neo-border bg-[#a8ff3e] px-5 py-2 font-syne text-xs sm:text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <span>Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <Link
                to="/get-started"
                className="inline-flex items-center gap-1.5 neo-border bg-[#6B46C1] px-5 py-2 font-syne text-xs sm:text-sm font-medium text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <span>Get started</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 bg-[#f7f7f7]">
        <div className="mx-auto max-w-5xl text-center space-y-8 relative z-10">
          <RailStar className="absolute top-0 left-4 sm:left-12 h-8 w-8 animate-bounce opacity-80" />
          <RailStar className="absolute bottom-4 right-4 sm:right-16 h-10 w-10 rotate-45 opacity-80" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2   bg-white px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="h-2.5 w-2.5  bg-[#a8ff3e] neo-border" />
            <span className="font-syne text-xs font-medium uppercase tracking-wider text-black">
              Bitcoin-Native Receivables Financing Rail
            </span>
          </div>

          {/* Title */}
          <h1 className="font-syne text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-black leading-[1.05]">
            Bridging Real-World <br /> Receivables to <span className="text-[#6B46C1] underline decoration-[#a8ff3e] decoration-wavy">Bitcoin Capital</span>.
          </h1>

          {/* Subtitle per UI Flow */}
          <p className="mx-auto max-w-3xl font-syne text-base sm:text-xl font-medium text-gray-700 leading-relaxed">
            FlowFi-BTC connects verified business receivables with Bitcoin capital, enabling transparent, programmable financing and settlement on Stacks.
          </p>

          {/* Dual Main CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/marketplace"
              className=" neo-border bg-[#a8ff3e] px-8 py-4 font-syne text-base font-medium text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
            >
              Explore Receivables →
            </Link>

            <Link
              to="/submit-receivable"
              className=" neo-border bg-[#6B46C1] text-white px-8 py-4 font-syne text-base font-medium shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
            >
              Submit a Receivable →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST / PROTOCOL STRIP (Built on Bitcoin) ── */}
      <section className="border-y-[3px] border-black bg-white py-10 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="text-center">
            <span className="font-syne text-xs font-medium uppercase tracking-wider text-gray-500">
              Powered by Bitcoin • Built on Stacks
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="neo-border  bg-[#f7f7f7] p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="font-syne text-lg font-medium text-black">Bitcoin</div>
              <div className="text-xs font-medium text-gray-600">Security & Liquidity</div>
            </div>

            <div className="neo-border  bg-[#a8ff3e]/20 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="font-syne text-lg font-medium text-[#6B46C1]">sBTC</div>
              <div className="text-xs font-medium text-gray-600">Capital Movement</div>
            </div>

            <div className="neo-border  bg-[#22d3ee]/20 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="font-syne text-lg font-medium text-black">Stacks</div>
              <div className="text-xs font-medium text-gray-600">Programmable Settlement</div>
            </div>

            <div className="neo-border  bg-[#fef08a]/40 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="font-syne text-lg font-medium text-black">On-Chain Records</div>
              <div className="text-xs font-medium text-gray-600">Transparent Lifecycle</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TWO-SIDED MODEL SECTION ── */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">

          <h2 className="font-syne text-3xl sm:text-5xl font-medium text-black tracking-tight">
            Built for Businesses & Capital Providers
          </h2>
          <p className="text-gray-600 font-medium max-w-xl mx-auto text-sm sm:text-base">
            Connecting real-world corporate invoices directly with decentralized sBTC liquidity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Businesses Column */}
          <div id="for-businesses" className="neo-border-thick bg-white  p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-block  neo-border bg-[#a8ff3e] px-3.5 py-1 text-xs font-medium uppercase text-black">
                For Businesses
              </div>
              <h3 className="font-syne text-2xl sm:text-3xl font-medium text-black">
                Accelerate Working Capital with Verified Invoices
              </h3>
              <p className="text-sm font-medium text-gray-600 leading-relaxed">
                Transform pending accounts receivable into instant sBTC liquidity without waiting 30–90 days for client payment.
              </p>

              <ul className="space-y-3 pt-2 font-syne text-sm font-medium text-gray-800">
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6  bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium">✓</span>
                  <span>Submit verified trade receivables</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6  bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium">✓</span>
                  <span>Request programmable working capital</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6  bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium">✓</span>
                  <span>Track financing status through settlement</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/get-started"
                className="w-full inline-flex items-center justify-center  neo-border bg-[#a8ff3e] py-4 text-sm font-medium text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                I'm a Business →
              </Link>
            </div>
          </div>

          {/* For Capital Providers Column */}
          <div id="for-capital-providers" className="neo-border-thick bg-[#6B46C1] text-white  p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-block  neo-border bg-[#c4b5fd] text-black px-3.5 py-1 text-xs font-medium uppercase">
                For Capital Providers
              </div>
              <h3 className="font-syne text-2xl sm:text-3xl font-medium text-white">
                Fund Real-World Trade Receivables with sBTC
              </h3>
              <p className="text-sm font-medium text-purple-100 leading-relaxed">
                Deploy sBTC into transparent, short-term trade finance backed by verified corporate invoices and on-chain settlement.
              </p>

              <ul className="space-y-3 pt-2 font-syne text-sm font-medium text-white">
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6  bg-[#a8ff3e] text-black neo-border flex items-center justify-center text-xs font-medium">✓</span>
                  <span>Discover verified financing opportunities</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6  bg-[#a8ff3e] text-black neo-border flex items-center justify-center text-xs font-medium">✓</span>
                  <span>Fund receivables directly with sBTC</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6  bg-[#a8ff3e] text-black neo-border flex items-center justify-center text-xs font-medium">✓</span>
                  <span>Track funding through maturity & settlement</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/get-started"
                className="w-full inline-flex items-center justify-center  neo-border bg-[#a8ff3e] py-4 text-sm font-medium text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                I'm a Capital Provider →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS (4 Steps) ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 border-t-[3px] border-black bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">

            <h2 className="font-syne text-3xl sm:text-5xl font-medium text-black tracking-tight">
              How FlowFi-BTC Works
            </h2>
            <p className="text-gray-600 font-medium max-w-xl mx-auto text-sm sm:text-base">
              The entire trade financing journey explained in 10 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 01 Submit */}
            <div className="neo-border-thick bg-[#f7f7f7]  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10  bg-[#ffb6b9] neo-border flex items-center justify-center font-syne font-medium text-black text-lg mb-4">
                  01
                </div>
                <h3 className="font-syne font-medium text-black text-xl">Submit</h3>
                <p className="text-xs font-medium text-gray-700 leading-relaxed mt-2">
                  Business submits a receivable with invoice details, due block target, counterparty info, and SHA-256 document hash.
                </p>
              </div>
              <Link
                to="/submit-receivable"
                className="inline-block pt-3 font-syne text-xs font-medium text-[#6B46C1] hover:underline"
              >
                Submit Receivable →
              </Link>
            </div>

            {/* 02 Verify */}
            <div className="neo-border-thick bg-[#f7f7f7]  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10  bg-[#a8ff3e] neo-border flex items-center justify-center font-syne font-medium text-black text-lg mb-4">
                  02
                </div>
                <h3 className="font-syne font-medium text-black text-xl">Verify</h3>
                <p className="text-xs font-medium text-gray-700 leading-relaxed mt-2">
                  Business identity and supporting receivable evidence are reviewed and cryptographic attestations stored off-chain.
                </p>
              </div>
              <Link
                to="/verification"
                className="inline-block pt-3 font-syne text-xs font-medium text-[#6B46C1] hover:underline"
              >
                View Verification →
              </Link>
            </div>

            {/* 03 Fund */}
            <div className="neo-border-thick bg-[#f7f7f7]  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10  bg-[#22d3ee] neo-border flex items-center justify-center font-syne font-medium text-black text-lg mb-4">
                  03
                </div>
                <h3 className="font-syne font-medium text-black text-xl">Fund</h3>
                <p className="text-xs font-medium text-gray-700 leading-relaxed mt-2">
                  Capital provider funds the verified receivable with sBTC directly through Stacks Clarity smart contracts.
                </p>
              </div>
              <Link
                to="/receivable"
                className="inline-block pt-3 font-syne text-xs font-medium text-[#6B46C1] hover:underline"
              >
                Explore Funding →
              </Link>
            </div>

            {/* 04 Settle */}
            <div className="neo-border-thick bg-[#f7f7f7]  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10  bg-[#fef08a] neo-border flex items-center justify-center font-syne font-medium text-black text-lg mb-4">
                  04
                </div>
                <h3 className="font-syne font-medium text-black text-xl">Settle</h3>
                <p className="text-xs font-medium text-gray-700 leading-relaxed mt-2">
                  Repayment or default is recorded transparently on-chain, releasing yield to provider and updating public logs.
                </p>
              </div>
              <Link
                to="/history"
                className="inline-block pt-3 font-syne text-xs font-medium text-[#6B46C1] hover:underline"
              >
                Inspect Ledger →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. VERIFICATION CONCEPT SECTION ── */}
      <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-10">
        <div className="neo-border-thick bg-[#22d3ee]/10  p-8 sm:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-black grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="font-syne text-xs font-medium uppercase tracking-wider text-black bg-[#22d3ee] px-3 py-1  neo-border">
              Trust & Transparency Framework
            </span>
            <div className="h-5" />
            <h2 className="font-syne text-3xl sm:text-4xl font-medium text-black">
              Verified Receivables
            </h2>
            <p className="font-syne text-sm sm:text-base font-medium text-gray-700 leading-relaxed">
              Each financing opportunity includes verification information about the business and supporting receivable evidence before it becomes eligible for funding.
            </p>

            <div className="pt-2">
              <Link
                to="/verification"
                className="inline-flex items-center gap-2  neo-border bg-[#22d3ee] px-6 py-3 font-syne text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                <span>Inspect Attestations & Verification Log</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="neo-border bg-white  p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-syne font-medium text-lg border-b-2 border-black pb-3 text-black">
              Verification Checklist
            </h3>

            <div className="space-y-3 font-syne text-xs font-medium">
              <div className="flex items-center gap-3 bg-[#f7f7f7] p-3 rounded-xl neo-border">
                <span className="h-6 w-6  bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium text-black">✓</span>
                <span className="text-gray-800">Business information reviewed</span>
              </div>

              <div className="flex items-center gap-3 bg-[#f7f7f7] p-3 rounded-xl neo-border">
                <span className="h-6 w-6  bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium text-black">✓</span>
                <span className="text-gray-800">Receivable evidence reviewed</span>
              </div>

              <div className="flex items-center gap-3 bg-[#f7f7f7] p-3 rounded-xl neo-border">
                <span className="h-6 w-6  bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium text-black">✓</span>
                <span className="text-gray-800">Cryptographic verification recorded</span>
              </div>

              <div className="flex items-center gap-3 bg-[#f7f7f7] p-3 rounded-xl neo-border">
                <span className="h-6 w-6  bg-[#a8ff3e] neo-border flex items-center justify-center text-xs font-medium text-black">✓</span>
                <span className="text-gray-800">On-chain financing state registered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FUNDING MARKETPLACE PREVIEW ── */}
      <section id="marketplace" className="py-20 px-4 sm:px-8 bg-[#6B46C1] text-white">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">

              <h2 className="font-syne text-3xl sm:text-5xl font-medium text-white">
                Explore Funding Opportunities
              </h2>
              <p className="text-purple-200 text-sm font-medium max-w-lg">
                Discover active receivables verified and ready for sBTC funding on Stacks testnet.
              </p>
            </div>

            <Link
              to="/marketplace"
              className=" neo-border bg-[#a8ff3e] px-6 py-3 font-syne text-xs font-medium text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform self-start md:self-auto"
            >
              Explore All Receivables →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="neo-border-thick bg-white text-black  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div>
                    <h3 className="font-syne font-medium text-base">ABC Logistics Inc.</h3>
                    <p className="text-[11px] font-medium text-gray-500">Receivable #CR-001</p>
                  </div>
                  <span className="bg-[#a8ff3e] text-black text-[10px] font-medium px-2 py-0.5  neo-border">
                    ✓ Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-syne">
                  <div className="bg-[#f7f7f7] p-2.5 rounded-xl neo-border">
                    <span className="text-gray-500 block text-[10px] font-medium">REQUESTED</span>
                    <span className="font-medium text-black text-sm">$10,000</span>
                    <span className="text-[10px] text-gray-500 block">0.15 sBTC</span>
                  </div>
                  <div className="bg-[#f7f7f7] p-2.5 rounded-xl neo-border">
                    <span className="text-gray-500 block text-[10px] font-medium">TERM</span>
                    <span className="font-medium text-black text-sm">45 Days</span>
                    <span className="text-[10px] text-gray-500 block">Due Block #151k</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium font-syne">
                    <span>Funding Progress</span>
                    <span className="text-[#6B46C1]">70% Funded</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200  neo-border overflow-hidden">
                    <div className="h-full bg-[#a8ff3e] w-[70%]" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFundingModalOpen(true)}
                className="w-full  neo-border bg-[#a8ff3e] py-2.5 text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                View Opportunity
              </button>
            </div>

            {/* Card 2 - MOCK_RECEIVABLE */}
            <div className="neo-border-thick bg-white text-black  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div>
                    <h3 className="font-syne font-medium text-base truncate max-w-[170px]">
                      Apex Supply Chain Ltd
                    </h3>
                    <p className="text-[11px] font-medium text-gray-500">
                      Invoice #INV-2041
                    </p>
                  </div>
                  <span className="bg-[#a8ff3e] text-black text-[10px] font-medium px-2 py-0.5  neo-border">
                    ✓ Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-syne">
                  <div className="bg-[#f7f7f7] p-2.5 rounded-xl neo-border">
                    <span className="text-gray-500 block text-[10px] font-medium">REQUESTED</span>
                    <span className="font-medium text-black text-sm">2.50 sBTC</span>
                    <span className="text-[10px] text-gray-500 block">$162,500 USD</span>
                  </div>
                  <div className="bg-[#f7f7f7] p-2.5 rounded-xl neo-border">
                    <span className="text-gray-500 block text-[10px] font-medium">DUE TARGET</span>
                    <span className="font-medium text-black text-sm">#148,920</span>
                    <span className="text-[10px] text-gray-500 block">Oct 14, 2026</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium font-syne">
                    <span>Funding Progress</span>
                    <span className="text-emerald-600 font-medium">100% Funded</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200  neo-border overflow-hidden">
                    <div className="h-full bg-[#22d3ee] w-[100%]" />
                  </div>
                </div>
              </div>

              <Link
                to="/receivable"
                className="w-full text-center inline-block  neo-border bg-[#c4b5fd] py-2.5 text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                View Opportunity
              </Link>
            </div>

            {/* Card 3 */}
            <div className="neo-border-thick bg-white text-black  p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div>
                    <h3 className="font-syne font-medium text-base">Apex Freight Supply</h3>
                    <p className="text-[11px] font-medium text-gray-500">Receivable #CR-003</p>
                  </div>
                  <span className="bg-[#a8ff3e] text-black text-[10px] font-medium px-2 py-0.5  neo-border">
                    ✓ Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-syne">
                  <div className="bg-[#f7f7f7] p-2.5 rounded-xl neo-border">
                    <span className="text-gray-500 block text-[10px] font-medium">REQUESTED</span>
                    <span className="font-medium text-black text-sm">$78,000</span>
                    <span className="text-[10px] text-gray-500 block">1.20 sBTC</span>
                  </div>
                  <div className="bg-[#f7f7f7] p-2.5 rounded-xl neo-border">
                    <span className="text-gray-500 block text-[10px] font-medium">TERM</span>
                    <span className="font-medium text-black text-sm">30 Days</span>
                    <span className="text-[10px] text-gray-500 block">Due Block #153k</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium font-syne">
                    <span>Funding Progress</span>
                    <span className="text-[#6B46C1]">40% Funded</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200  neo-border overflow-hidden">
                    <div className="h-full bg-[#a8ff3e] w-[40%]" />
                  </div>
                </div>
              </div>

              <Link
                to="/receivable"
                className="w-full text-center inline-block  neo-border bg-[#a8ff3e] py-2.5 text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                View Opportunity
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. EXPERIMENTAL PILOT / RISK DISCLOSURE ── */}
      <section className="py-16 px-4 sm:px-8 bg-white border-t-[3px] border-black">
        <div className="mx-auto max-w-5xl text-center space-y-6">


          <h2 className="font-syne text-2xl sm:text-4xl font-medium text-black">
            Pilot Status & Risk Disclosure
          </h2>

          <p className="mx-auto max-w-3xl font-syne text-sm sm:text-base font-medium text-gray-700 leading-relaxed">
            FlowFi-BTC is currently an experimental financing pilot. Initial transactions are intentionally limited in size while the financing mechanism, verification process, and settlement contracts are validated.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 font-syne text-xs font-medium">
            <Link
              to="/history"
              className=" neo-border bg-[#f7f7f7] px-6 py-3 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              View Pilot Transparency Log →
            </Link>

            <Link
              to="/history"
              className=" neo-border bg-[#ffb6b9] px-6 py-3 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              Read Risk & Security Framework →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. OPEN SOURCE & DOCS SECTION ── */}
      <section className="py-16 px-4 sm:px-8 bg-[#f7f7f7] border-t-[3px] border-black">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <h2 className="font-syne text-2xl sm:text-3xl font-medium text-black">
            Open Source & Auditable
          </h2>
          <p className="font-syne text-sm font-medium text-gray-600 max-w-xl mx-auto">
            Core financing contracts are open source and independently inspectable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className=" neo-border bg-white px-6 py-2.5 font-syne text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              GitHub Repository
            </a>
            <Link
              to="/api-docs"
              className=" neo-border bg-[#c4b5fd] px-6 py-2.5 font-syne text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              Documentation & API →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. PUBLIC FOOTER ── */}
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
              FlowFi-BTC connects verified business trade receivables with Bitcoin capital for transparent, programmable financing and settlement on Stacks.
            </p>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Core Pages</h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600 font-syne">
              <li><Link to="/dashboard" className="hover:text-black">Dashboard</Link></li>
              <li><Link to="/dashboard/submit" className="hover:text-black">Submit Receivable</Link></li>
              <li><Link to="/dashboard/funding" className="hover:text-black">Active Funding</Link></li>
              <li><Link to="/verification" className="hover:text-black">Verification Log</Link></li>
              <li><Link to="/history" className="hover:text-black">Transparency Log</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Resources</h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600 font-syne">
              <li><Link to="https://github.com/FlowFi-BTC/FlowFi-BTC" className="hover:text-black">Github</Link></li>
              <li><Link to="/api-docs" className="hover:text-black">Contracts</Link></li>

            </ul>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Stacks Testnet</h4>
            <div className="space-y-2 text-xs font-syne font-medium text-gray-600">
              <p>Contract: <span className="text-black font-medium">flowfi-escrow</span></p>
              <p>Network: <span className="text-black font-medium">Stacks Testnet</span></p>
              <div className="pt-2">
                <span className="inline-block  neo-border bg-[#a8ff3e] px-3 py-1 text-[10px] font-medium text-black">
                  ● Clarity Smart Contract Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl mt-8 pt-6 border-t-2 border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500 font-syne">
          <p>© 2026 FlowFi-BTC / FlowFi-BTC. Open source MIT protocol.</p>
          <div className="flex items-center gap-4">
            <Link to="/dashboard/settings" className="hover:text-black">Settings</Link>
            <span>•</span>
            <Link to="/api-docs" className="hover:text-black">API Docs</Link>
          </div>
        </div>
      </footer>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-syne">
          <div className="w-full max-w-md  neo-border-thick bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <h3 className="font-medium text-black text-lg">Connect Stacks Wallet</h3>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="h-8 w-8  neo-border bg-[#f7f7f7] text-black font-medium flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>


          </div>
        </div>
      )}

      {/* Funding Modal */}
      <FundingModal
        receivable={{
          id: 'rec_112233',
          title: 'Invoice INV-2041',
          invoiceNumber: 'INV-2041',
          amountUsd: '45000',
          businessName: 'Apex Supply Chain Ltd',
        }}
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
        onConfirmFund={() => {
          setIsFundingModalOpen(false);
          navigate('/receivable/rec_112233');
        }}
      />
    </div>
  );
};
