import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { MOCK_RECEIVABLE } from '../data/mockData';
import { FundingModal } from '../components/modular/receivable/FundingModal';

// Tiny hand-drawn 4-point star for high-energy neo-brutal aesthetics
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
  const { wallet, connect, disconnect } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black font-syne selection:bg-[#a8ff3e] selection:text-black">
      {/* ── Public Top Header Bar ── */}
      <header className="sticky top-0 z-40 border-b-[3px] border-black bg-white px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Brand Logo */}
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
                <span className="font-syne font-black text-lg tracking-tight text-black">
                  FlowFi-BTC
                </span>
                <span className="bg-[#a8ff3e] text-black text-[10px] font-syne font-extrabold px-2 py-0.5 rounded-full neo-border">
                 Beta
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden sm:block">
                sBTC Capital Settlement Rail
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-syne text-sm font-bold">
            <Link to="/dashboard" className="text-gray-700 hover:text-black transition-colors">
              Overview
            </Link>
            <Link to="/funding" className="text-gray-700 hover:text-black transition-colors">
              Active Funding
            </Link>
            <Link to="/verification" className="text-gray-700 hover:text-black transition-colors">
              Verification
            </Link>
            <Link to="/history" className="text-gray-700 hover:text-black transition-colors">
              Transparency
            </Link>
            <Link to="/api-docs" className="text-gray-700 hover:text-black transition-colors">
              Docs
            </Link>
          </nav>

          {/* Action CTAs & Wallet */}
          <div className="flex items-center gap-3">
            {wallet.isConnected ? (
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 rounded-full neo-border bg-[#22d3ee] px-3.5 py-1.5 font-syne text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
              >
                <span className="h-2 w-2 rounded-full bg-black" />
                <span>
                  {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="rounded-full neo-border bg-[#a8ff3e] px-4 py-2 text-xs font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
              >
                Connect Wallet
              </button>
            )}

            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full neo-border bg-[#6B46C1] px-4 py-2 font-syne text-xs font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <span>Launch App</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl text-center space-y-8 relative z-10">
          {/* Decorative Stars */}
          <RailStar className="absolute top-0 left-4 sm:left-12 h-8 w-8 animate-bounce opacity-80" />
          <RailStar className="absolute bottom-4 right-4 sm:right-16 h-10 w-10 rotate-45 opacity-80" />

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full neo-border bg-white px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#a8ff3e] neo-border" />
            <span className="font-syne text-xs font-extrabold uppercase tracking-wider text-black">
              Bitcoin-Native Receivable Financing Rail
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-syne text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-black leading-[1.05]">
            Unlock Working Capital with <span className="text-[#6B46C1] underline decoration-[#a8ff3e] decoration-wavy">sBTC Liquidity</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl font-syne text-base sm:text-xl font-semibold text-gray-700 leading-relaxed">
            Connect verified real-world trade receivables directly to Bitcoin holders. Execute trust-minimized capital settlement powered by Stacks testnet Clarity smart contracts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/submit-receivable"
              className="rounded-full neo-border bg-[#a8ff3e] px-8 py-4 font-syne text-base font-extrabold text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
            >
              Submit Receivable →
            </Link>

            <Link
              to="/history"
              className="rounded-full neo-border bg-white px-8 py-4 font-syne text-base font-extrabold text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
            >
              🔍 View Pilot Transparency
            </Link>

            <Link
              to="/dashboard"
              className="rounded-full neo-border bg-[#c4b5fd] px-8 py-4 font-syne text-base font-extrabold text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
            >
              Enter Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Bar ── */}
      <section className="border-y-[3px] border-black bg-white py-8 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1 border-r-2 border-black/10 last:border-r-0">
            <div className="font-syne text-3xl sm:text-4xl font-black text-black">$2.4M+</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 font-syne">
              Receivables Submitted
            </div>
          </div>

          <div className="space-y-1 border-r-2 border-black/10 last:border-r-0">
            <div className="font-syne text-3xl sm:text-4xl font-black text-[#6B46C1]">34.5 sBTC</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 font-syne">
              Capital Deployed
            </div>
          </div>

          <div className="space-y-1 border-r-2 border-black/10 last:border-r-0">
            <div className="font-syne text-3xl sm:text-4xl font-black text-black">9.8% APY</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 font-syne">
              Avg. Capital Provider Yield
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-syne text-3xl sm:text-4xl font-black text-black">Instant</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 font-syne">
              Clarity On-Chain Settlement
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (4 Steps per UI Flow) ── */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="font-syne text-xs font-extrabold uppercase tracking-wider text-[#6B46C1] bg-[#c4b5fd]/30 px-3 py-1 rounded-full neo-border">
            End-To-End Settlement Flow
          </span>
          <h2 className="font-syne text-3xl sm:text-5xl font-black text-black tracking-tight">
            How sBTC Capital Rail Works
          </h2>
          <p className="text-gray-600 font-semibold max-w-xl mx-auto text-sm sm:text-base">
            From business invoice registration to on-chain verification and automated Bitcoin capital settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="neo-border-thick bg-white rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 relative flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-full bg-[#ffb6b9] neo-border flex items-center justify-center font-syne font-black text-black text-lg mb-4">
                01
              </div>
              <h3 className="font-syne font-extrabold text-black text-lg">Submit Receivable</h3>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-2">
                Business completes a 5-step registration specifying invoice amount, due blocks, counterparty details, and document hashes.
              </p>
            </div>
            <Link
              to="/submit-receivable"
              className="inline-block pt-3 font-syne text-xs font-extrabold text-[#6B46C1] hover:underline"
            >
              Start Submission →
            </Link>
          </div>

          {/* Step 2 */}
          <div className="neo-border-thick bg-white rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 relative flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-full bg-[#a8ff3e] neo-border flex items-center justify-center font-syne font-black text-black text-lg mb-4">
                02
              </div>
              <h3 className="font-syne font-extrabold text-black text-lg">Verification & Attestation</h3>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-2">
                Independent reviewer nodes verify invoice authenticity, trade history, and store SHA-256 document attestations off-chain.
              </p>
            </div>
            <Link
              to="/verification"
              className="inline-block pt-3 font-syne text-xs font-extrabold text-[#6B46C1] hover:underline"
            >
              Check Attestations →
            </Link>
          </div>

          {/* Step 3 */}
          <div className="neo-border-thick bg-white rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 relative flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-full bg-[#22d3ee] neo-border flex items-center justify-center font-syne font-black text-black text-lg mb-4">
                03
              </div>
              <h3 className="font-syne font-extrabold text-black text-lg">sBTC Capital Funding</h3>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-2">
                Capital providers review verified receivables and fund sBTC liquidity directly via Stacks Clarity smart contracts.
              </p>
            </div>
            <Link
              to="/funding"
              className="inline-block pt-3 font-syne text-xs font-extrabold text-[#6B46C1] hover:underline"
            >
              Explore Active Funding →
            </Link>
          </div>

          {/* Step 4 */}
          <div className="neo-border-thick bg-white rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 relative flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-full bg-[#fef08a] neo-border flex items-center justify-center font-syne font-black text-black text-lg mb-4">
                04
              </div>
              <h3 className="font-syne font-extrabold text-black text-lg">Settlement & Audit</h3>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-2">
                Debtor pays invoice upon maturity, smart contract releases sBTC plus yield to provider, recording full lifecycle on Stacks Explorer.
              </p>
            </div>
            <Link
              to="/history"
              className="inline-block pt-3 font-syne text-xs font-extrabold text-[#6B46C1] hover:underline"
            >
              View Public Ledger →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Pilot Receivable Showcase ── */}
      <section className="py-16 px-4 sm:px-8 bg-[#6B46C1] text-white">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-syne text-xs font-extrabold uppercase tracking-wider text-[#a8ff3e] bg-black/40 px-3 py-1 rounded-full neo-border">
                Live Testnet Receivable
              </span>
              <h2 className="font-syne text-3xl sm:text-4xl font-black text-white mt-2">
                Featured Pilot Receivable #01
              </h2>
            </div>
            <Link
              to="/receivable/1"
              className="rounded-full neo-border bg-[#a8ff3e] px-6 py-2.5 font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform self-start md:self-auto"
            >
              Inspect On-Chain Contract →
            </Link>
          </div>

          <div className="neo-border-thick bg-white text-black rounded-[28px] p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-4">
                <div>
                  <h3 className="font-syne font-black text-xl text-black">
                    {MOCK_RECEIVABLE.borrowerName}
                  </h3>
                  <p className="text-xs font-syne font-bold text-gray-600 mt-0.5">
                    Invoice Ref: {MOCK_RECEIVABLE.invoiceNumber} • Counterparty: {MOCK_RECEIVABLE.counterparty}
                  </p>
                </div>
                <span className="rounded-full neo-border bg-[#c4b5fd] px-3 py-1 font-syne text-xs font-extrabold text-black">
                  STATUS: FUNDED (1)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 font-syne text-xs">
                <div className="bg-[#f7f7f7] p-4 rounded-[18px] neo-border">
                  <span className="text-gray-500 block mb-1 font-bold">RECEIVABLE AMOUNT</span>
                  <span className="text-black font-black text-2xl">2.50 sBTC</span>
                  <span className="text-gray-600 block text-[11px] font-bold">
                    ($162,500 USD equivalent)
                  </span>
                </div>

                <div className="bg-[#f7f7f7] p-4 rounded-[18px] neo-border">
                  <span className="text-gray-500 block mb-1 font-bold">DUE BLOCK TARGET</span>
                  <span className="text-black font-black text-2xl">#148,920</span>
                  <span className="text-gray-600 block text-[11px] font-bold">
                    Est. Oct 14, 2026
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-[#f7f7f7] p-6 rounded-[24px] neo-border space-y-4">
              <div>
                <span className="text-xs font-syne font-bold text-gray-500 uppercase block mb-1">
                  On-Chain Action
                </span>
                <h4 className="font-syne font-extrabold text-black text-base">
                  Execute Funding or View Operations
                </h4>
                <p className="text-xs font-semibold text-gray-600 mt-1">
                  Testnet users can trigger state transitions between Registered, Funded, Repaid, and Defaulted.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsFundingModalOpen(true)}
                  className="w-full rounded-full neo-border bg-[#a8ff3e] py-3 text-xs font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                >
                  ⚡ Trigger Funding Modal
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/verification')}
                  className="w-full rounded-full neo-border bg-white py-2.5 text-xs font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                >
                  🔍 View Document Attestations
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Public Footer ── */}
      <footer className="border-t-[3px] border-black bg-white py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 font-syne">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded neo-border bg-[#a8ff3e] flex items-center justify-center font-bold text-xs">
                Flow
              </div>
              <span className="font-syne font-extrabold text-lg text-black">FlowFi-BTC</span>
            </div>
            <p className="text-xs font-semibold text-gray-600 leading-relaxed">
              Bitcoin-native capital settlement rail connecting verified trade receivables to sBTC liquidity pools.
            </p>
          </div>

          <div>
            <h4 className="font-syne font-extrabold text-sm text-black mb-3">Core Pages</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-600 font-syne">
              <li><Link to="/dashboard" className="hover:text-black">Dashboard</Link></li>
              <li><Link to="/submit-receivable" className="hover:text-black">Submit Receivable</Link></li>
              <li><Link to="/funding" className="hover:text-black">Active Funding</Link></li>
              <li><Link to="/verification" className="hover:text-black">Verification</Link></li>
              <li><Link to="/history" className="hover:text-black">Transparency Log</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-extrabold text-sm text-black mb-3">Risk & Protocols</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-600 font-syne">
              <li><Link to="/cascade-risk" className="hover:text-black">Cascade Risk Engine</Link></li>
              <li><Link to="/liquidity" className="hover:text-black">Liquidity Pools</Link></li>
              <li><Link to="/protocols" className="hover:text-black">Tracked Protocols</Link></li>
              <li><Link to="/api-docs" className="hover:text-black">API Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-extrabold text-sm text-black mb-3">Stacks Testnet</h4>
            <div className="space-y-2 text-xs font-syne font-semibold text-gray-600">
              <p>Contract: <span className="text-black font-bold">sbtc-capital-rail-v2</span></p>
              <p>Network: <span className="text-black font-bold">Stacks Testnet</span></p>
              <div className="pt-2">
                <span className="inline-block rounded-full neo-border bg-[#a8ff3e] px-3 py-1 text-[10px] font-extrabold text-black">
                  ● Clarity Smart Contract Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl mt-8 pt-6 border-t-2 border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-500 font-syne">
          <p>© 2026 sBTC Capital Rail / FlowFi. Open source MIT protocol.</p>
          <div className="flex items-center gap-4">
            <Link to="/settings" className="hover:text-black">Settings</Link>
            <span>•</span>
            <Link to="/api-docs" className="hover:text-black">API Docs</Link>
          </div>
        </div>
      </footer>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-syne">
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

      {/* Funding Modal */}
      <FundingModal
        receivable={MOCK_RECEIVABLE}
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
        onConfirmFund={() => {
          setIsFundingModalOpen(false);
          navigate('/receivable/1');
        }}
      />
    </div>
  );
};
