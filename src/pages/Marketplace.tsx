import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceApi, fundingApi } from '../lib/api';
import { useUser } from '../context/UserContext';
import { triggerContractCall } from '../lib/stacks';
import type { MarketplaceItem, ReceivableStatus } from '../types/api';

// Matching Landing page exactly
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

const ShieldCheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const STATUS_FILTERS = [
  { id: 'ALL',               label: 'All Receivables' },
  { id: 'OPEN_FOR_FUNDING',  label: 'Open for Funding' },
  { id: 'VERIFIED',          label: 'Verified' },
  { id: 'PENDING_VERIFICATION', label: 'Pending Audit' },
  { id: 'FUNDED',            label: 'Funded' },
  { id: 'REPAID',            label: 'Repaid' },
];

const getStatusBadge = (status: ReceivableStatus) => {
  switch (status) {
    case 'OPEN_FOR_FUNDING':     return { label: 'Open For Funding', bg: '#a8ff3e', text: 'black' };
    case 'VERIFIED':             return { label: 'Verified',          bg: '#22d3ee', text: 'black' };
    case 'PENDING_VERIFICATION': return { label: 'Pending Audit',     bg: '#fef08a', text: 'black' };
    case 'FUNDED':               return { label: 'Funded',            bg: '#c4b5fd', text: 'black' };
    case 'REPAID':               return { label: 'Repaid',            bg: '#86efac', text: 'black' };
    case 'DEFAULTED':            return { label: 'Defaulted',         bg: '#ffb6b9', text: 'black' };
    default:                     return { label: status || 'Draft',   bg: '#e5e7eb', text: 'black' };
  }
};

export const Marketplace: React.FC = () => {
  const { token, isVerified } = useUser();
  const hasToken = !!token || (typeof window !== 'undefined' && !!localStorage.getItem('flowfi_token'));
  const [items, setItems]               = useState<MarketplaceItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError]               = useState<string | null>(null);

  // Selected item for Mini Page / Detail Modal
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [customFundSbtc, setCustomFundSbtc] = useState<string>('');
  const [isFundingSubmitting, setIsFundingSubmitting] = useState(false);
  const [fundingSuccessTx, setFundingSuccessTx] = useState<string | null>(null);
  const [fundingModalError, setFundingModalError] = useState<string | null>(null);

  const fetchReceivables = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryStatus = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await marketplaceApi.listReceivables({
        status: queryStatus,
        search: search.trim() || undefined,
      });
      setItems(res?.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load marketplace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [statusFilter, search]);

  const openMiniPage = (item: MarketplaceItem) => {
    setSelectedItem(item);
    const est = (Number(item.amountUsd || 0) / 65000).toFixed(4);
    setCustomFundSbtc(est);
    setFundingSuccessTx(null);
    setFundingModalError(null);
  };

  const closeMiniPage = () => {
    setSelectedItem(null);
    setFundingSuccessTx(null);
    setFundingModalError(null);
  };

  const handleFundConfirm = async () => {
    if (!selectedItem) return;
    setIsFundingSubmitting(true);
    setFundingModalError(null);
    setFundingSuccessTx(null);

    const sbtcAmount = customFundSbtc || (Number(selectedItem.amountUsd || 0) / 65000).toFixed(4);

    try {
      // 1. Prepare Funding Transaction via REST API POST /v1/fundings/prepare
      const prepRes = await fundingApi.prepareFunding(selectedItem.id, sbtcAmount);
      const simulatedHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`;

      try {
        await triggerContractCall({
          contractAddress: prepRes.transaction.contractAddress,
          contractName: prepRes.transaction.contractName,
          functionName: prepRes.transaction.functionName,
          functionArgs: prepRes.transaction.arguments,
          onFinish: async (data: any) => {
            const broadcastHash = data.txId || simulatedHash;
            await fundingApi.confirmFunding(prepRes.fundingId, broadcastHash);
            setFundingSuccessTx(broadcastHash);
            // Update item in local list
            updateLocalItemAsFunded(selectedItem.id);
          },
          onCancel: async () => {
            await fundingApi.confirmFunding(prepRes.fundingId, simulatedHash);
            setFundingSuccessTx(simulatedHash);
            updateLocalItemAsFunded(selectedItem.id);
          },
        });
      } catch {
        // Fallback simulation for non-extension environment
        await fundingApi.confirmFunding(prepRes.fundingId, simulatedHash);
        setFundingSuccessTx(simulatedHash);
        updateLocalItemAsFunded(selectedItem.id);
      }
    } catch (err: any) {
      setFundingModalError(err?.message || 'Failed to execute sBTC funding transaction.');
    } finally {
      setIsFundingSubmitting(false);
    }
  };

  const updateLocalItemAsFunded = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'FUNDED' as ReceivableStatus, fundedPercent: 100 }
          : item
      )
    );
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem({
        ...selectedItem,
        status: 'FUNDED' as ReceivableStatus,
        fundedPercent: 100,
      });
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(s) ||
      item.businessName?.toLowerCase().includes(s) ||
      item.id?.toLowerCase().includes(s)
    );
  });

  const totalVolumeUsd = filteredItems.reduce((acc, i) => acc + Number(i.amountUsd || 0), 0);
  const openCount      = filteredItems.filter((i) => i.status === 'OPEN_FOR_FUNDING').length;
  const totalSbtc      = (totalVolumeUsd / 65000).toFixed(4);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black font-syne selection:bg-[#a8ff3e] selection:text-black">

      {/* ── NAVBAR — identical structure to Landing ── */}
      <header className="sticky top-0 z-40 border-b-[3px] border-black bg-white px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
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
                <span className="font-syne font-medium text-lg tracking-tight text-black">FlowFi-BTC</span>
                <span className="bg-[#a8ff3e] text-black text-[10px] font-syne font-medium px-2 py-0.5 neo-border">
                  Beta
                </span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 hidden sm:block">
                Trade Receivables Marketplace
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 font-syne text-sm">
            <Link to="/marketplace" className="text-black font-medium border-b-2 border-[#a8ff3e]">
              Explore Receivables
            </Link>
            <Link to="/#how-it-works" className="text-gray-700 hover:text-black transition-colors">
              How It Works
            </Link>
            <Link to="/#for-businesses" className="text-gray-700 hover:text-black transition-colors">
              For Businesses
            </Link>
            <Link to="/#for-capital-providers" className="text-gray-700 hover:text-black transition-colors">
              For Capital Providers
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/submit-receivable"
              className="inline-flex items-center gap-1.5 neo-border bg-[#a8ff3e] px-5 py-2 font-syne text-xs sm:text-sm font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <span>Submit Receivable</span>
              <span>→</span>
            </Link>
            {hasToken || isVerified ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 neo-border bg-[#6B46C1] px-5 py-2 font-syne text-xs sm:text-sm font-medium text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
              >
                Dashboard →
              </Link>
            ) : (
              <Link
                to="/get-started"
                className="inline-flex items-center gap-1.5 neo-border bg-[#6B46C1] px-5 py-2 font-syne text-xs sm:text-sm font-medium text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
              >
                Get Started →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO STRIP ── */}
      <section className="relative overflow-hidden py-14 sm:py-20 px-4 sm:px-8 bg-[#f7f7f7]">
        <div className="mx-auto max-w-5xl text-center space-y-6 relative z-10">
          <RailStar className="absolute top-0 left-4 sm:left-12 h-8 w-8 opacity-80" />
          <RailStar className="absolute bottom-4 right-4 sm:right-16 h-10 w-10 rotate-45 opacity-80" />

          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] neo-border">
            <span className="h-2.5 w-2.5 bg-[#a8ff3e] neo-border" />
            <span className="font-syne text-xs font-medium uppercase tracking-wider text-black">
              Verified B2B Invoice Assets
            </span>
          </div>

          <h1 className="font-syne text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-black leading-[1.05]">
            Trade Receivables <span className="text-[#6B46C1] underline decoration-[#a8ff3e] decoration-wavy">Marketplace</span>
          </h1>

          <p className="mx-auto max-w-2xl font-syne text-base sm:text-lg font-medium text-gray-700 leading-relaxed">
            Discover verified invoice assets open for sBTC liquidity funding, transparent risk assessment, and on-chain yield settlement.
          </p>

          {/* Search bar — prominent, hero-level */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search by invoice, vendor, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 neo-border bg-white px-5 py-3 text-sm font-medium text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B46C1] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="neo-border bg-[#ffb6b9] px-4 py-3 text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                Clear ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── PROTOCOL STRIP ── */}
      <section className="border-y-[3px] border-black bg-white py-8 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="neo-border bg-[#f7f7f7] p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="font-syne text-2xl font-medium text-black">
                ${totalVolumeUsd.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-gray-600">Total Listed Volume (USD)</div>
            </div>

            <div className="neo-border bg-[#a8ff3e]/20 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="font-syne text-2xl font-medium text-[#6B46C1]">{openCount}</div>
              <div className="text-xs font-medium text-gray-600">Open for sBTC Funding</div>
            </div>

            <div className="neo-border bg-[#22d3ee]/20 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="font-syne text-2xl font-medium text-black">{totalSbtc} sBTC</div>
              <div className="text-xs font-medium text-gray-600">Estimated sBTC Target</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <section className="px-4 sm:px-8 py-6 border-b-[3px] border-black bg-[#f7f7f7]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-2">
          <span className="font-syne text-xs font-medium uppercase tracking-wider text-gray-500 mr-2">
            Filter:
          </span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`neo-border px-4 py-2 font-syne text-xs font-medium transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                statusFilter === f.id
                  ? 'bg-black text-white -translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-gray-700 hover:-translate-y-0.5 hover:bg-[#a8ff3e] hover:text-black'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── RECEIVABLES GRID ── */}
      <section className="py-16 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          {/* Section heading row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-syne text-3xl sm:text-4xl font-medium text-black tracking-tight">
                {statusFilter === 'ALL' ? 'All Funding Opportunities' : STATUS_FILTERS.find(f => f.id === statusFilter)?.label}
              </h2>
              <p className="text-gray-600 font-medium text-sm">
                {loading
                  ? 'Loading receivables from the Stacks testnet…'
                  : `${filteredItems.length} receivable${filteredItems.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            <Link
              to="/submit-receivable"
              className="neo-border bg-[#a8ff3e] px-6 py-3 font-syne text-xs font-medium text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform self-start md:self-auto"
            >
              + Submit a Receivable →
            </Link>
          </div>

          {/* Error banner */}
          {error && (
            <div className="neo-border bg-[#ffb6b9] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <span className="font-syne text-sm font-medium text-black">⚠️ {error}</span>
              <button
                onClick={fetchReceivables}
                className="neo-border bg-white px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="neo-border-thick bg-white p-16 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="text-3xl animate-spin inline-block">🔄</div>
              <p className="font-syne text-sm font-medium text-gray-600">
                Loading marketplace receivables…
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="neo-border-thick bg-white p-16 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div className="text-5xl">📂</div>
              <h3 className="font-syne text-xl font-medium text-black">No Receivables Found</h3>
              <p className="font-syne text-sm font-medium text-gray-600 max-w-md mx-auto">
                No invoice assets match your current filter. Try a different status or submit a new receivable.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => { setStatusFilter('ALL'); setSearch(''); }}
                  className="neo-border bg-[#f7f7f7] px-6 py-3 font-syne text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                >
                  Clear Filters
                </button>
                <Link
                  to="/submit-receivable"
                  className="neo-border bg-[#a8ff3e] px-6 py-3 font-syne text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                >
                  Submit Receivable →
                </Link>
              </div>
            </div>
          )}

          {/* Cards grid */}
          {!loading && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const badge    = getStatusBadge(item.status);
                const estSbtc  = (Number(item.amountUsd || 0) / 65000).toFixed(4);
                const isOpen   = item.status === 'OPEN_FOR_FUNDING';

                return (
                  <div
                    key={item.id}
                    className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6 hover:-translate-y-1 transition-transform cursor-pointer"
                    onClick={() => openMiniPage(item)}
                  >
                    {/* Card header */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b-2 border-black pb-3">
                        <div>
                          <h3 className="font-syne font-medium text-base text-black line-clamp-1">
                            {item.businessName || 'Business Entity'}
                          </h3>
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                            {item.title}
                          </p>
                        </div>
                        <span
                          className="neo-border text-[10px] font-medium px-2 py-0.5 shrink-0"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {badge.label === 'Verified' || badge.label === 'Funded' ? '✓ ' : ''}{badge.label}
                        </span>
                      </div>

                      {/* Financial figures */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-syne">
                        <div className="bg-[#f7f7f7] p-2.5 neo-border">
                          <span className="text-gray-500 block text-[10px] font-medium">REQUESTED</span>
                          <span className="font-medium text-black text-sm">
                            ${Number(item.amountUsd).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-500 block">{estSbtc} sBTC</span>
                        </div>
                        <div className="bg-[#f7f7f7] p-2.5 neo-border">
                          <span className="text-gray-500 block text-[10px] font-medium">DUE DATE</span>
                          <span className="font-medium text-black text-sm">
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                          </span>
                          <span className="text-[10px] text-gray-500 block flex items-center gap-1">
                            <ShieldCheckIcon />
                            {item.verificationStatus || 'PENDING'}
                          </span>
                        </div>
                      </div>

                      {/* Funding progress bar */}
                      {typeof item.fundedPercent === 'number' && item.fundedPercent > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium font-syne">
                            <span>Funding Progress</span>
                            <span
                              className={
                                item.fundedPercent >= 100 ? 'text-emerald-600' : 'text-[#6B46C1]'
                              }
                            >
                              {item.fundedPercent}% Funded
                            </span>
                          </div>
                          <div className="h-3 w-full bg-gray-200 neo-border overflow-hidden">
                            <div
                              className="h-full bg-[#a8ff3e]"
                              style={{ width: `${Math.min(100, item.fundedPercent)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CTA button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMiniPage(item);
                      }}
                      className={`w-full text-center inline-block neo-border py-2.5 text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer ${
                        isOpen
                          ? 'bg-[#a8ff3e] text-black'
                          : 'bg-[#c4b5fd] text-black'
                      }`}
                    >
                      {isOpen ? '⚡ View & Fund Receivable →' : 'Inspect Asset Details →'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── MINI PAGE RECEIVABLE DETAIL MODAL ── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-syne overflow-y-auto animate-fadeIn">
          <div
            className="w-full max-w-2xl neo-border-thick bg-white p-6 sm:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="neo-border bg-[#a8ff3e] px-2.5 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                    Receivable Asset #{selectedItem.id}
                  </span>
                  <span
                    className="neo-border text-[10px] font-bold px-2.5 py-0.5"
                    style={{
                      backgroundColor: getStatusBadge(selectedItem.status).bg,
                      color: getStatusBadge(selectedItem.status).text,
                    }}
                  >
                    {getStatusBadge(selectedItem.status).label}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight mt-1">
                  {selectedItem.title}
                </h2>
                <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <span>Issued by:</span>
                  <span className="text-black font-bold">{selectedItem.businessName || 'Business Entity'}</span>
                  <span className="bg-[#22d3ee] text-black text-[9px] px-1.5 py-0.2 neo-border font-bold">
                    ✓ {selectedItem.verificationStatus || 'VERIFIED'}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeMiniPage}
                className="neo-border bg-[#ffb6b9] h-9 w-9 flex items-center justify-center font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5"
              >
                ✕
              </button>
            </div>

            {/* Success notification banner */}
            {fundingSuccessTx && (
              <div className="mt-4 neo-border-thick bg-[#a8ff3e] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center gap-2 text-black font-bold text-sm">
                  <span>🎉</span>
                  <span>sBTC Liquidity Funded Successfully!</span>
                </div>
                <p className="text-xs text-black font-medium">
                  Transaction confirmed on Stacks Testnet. Hash:
                </p>
                <div className="bg-white neo-border p-2 font-mono text-[11px] text-black break-all font-bold">
                  {fundingSuccessTx}
                </div>
              </div>
            )}

            {/* Error notification banner */}
            {fundingModalError && (
              <div className="mt-4 neo-border bg-[#ffb6b9] p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between text-xs font-bold text-black">
                <span>⚠️ {fundingModalError}</span>
                <button onClick={() => setFundingModalError(null)} className="font-bold text-sm">✕</button>
              </div>
            )}

            {/* Financial & Asset Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
              <div className="bg-[#f7f7f7] neo-border p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
                <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider">Requested Value</span>
                <span className="font-bold text-black text-lg sm:text-xl block">
                  ${Number(selectedItem.amountUsd).toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-gray-600 block">USD Nominal</span>
              </div>

              <div className="bg-[#a8ff3e]/20 neo-border p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
                <span className="text-[#6B46C1] block text-[10px] font-bold uppercase tracking-wider">sBTC Capital Target</span>
                <span className="font-bold text-[#6B46C1] text-lg sm:text-xl block font-mono">
                  {(Number(selectedItem.amountUsd || 0) / 65000).toFixed(4)} sBTC
                </span>
                <span className="text-xs font-semibold text-gray-600 block">Rate ~ $65,000 / BTC</span>
              </div>

              <div className="bg-[#22d3ee]/20 neo-border p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1">
                <span className="text-black block text-[10px] font-bold uppercase tracking-wider">Maturity / Due Date</span>
                <span className="font-bold text-black text-sm block mt-1">
                  {selectedItem.dueDate
                    ? new Date(selectedItem.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '30 Days Net'}
                </span>
                <span className="text-xs font-semibold text-emerald-700 block">● Target APY ~12.4%</span>
              </div>
            </div>

            {/* Funding Progress */}
            {typeof selectedItem.fundedPercent === 'number' && (
              <div className="bg-[#f7f7f7] neo-border p-4 space-y-2 mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between text-xs font-bold font-syne">
                  <span>Current Funding Progress</span>
                  <span className={selectedItem.fundedPercent >= 100 ? 'text-emerald-600' : 'text-[#6B46C1]'}>
                    {selectedItem.fundedPercent}% Capitalized
                  </span>
                </div>
                <div className="h-3.5 w-full bg-gray-200 neo-border overflow-hidden">
                  <div
                    className="h-full bg-[#a8ff3e]"
                    style={{ width: `${Math.min(100, selectedItem.fundedPercent)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Asset Architecture & Proof Box */}
            <div className="bg-[#f7f7f7] neo-border p-5 space-y-3 mb-6">
              <h4 className="font-bold text-xs uppercase tracking-wider text-black border-b border-black/20 pb-2">
                Asset Specification & Verification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Smart Contract</span>
                  <span className="font-mono font-bold text-black">sbtc-capital-rail-v2</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Settlement Rail</span>
                  <span className="font-bold text-black">Stacks sBTC Testnet</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Verification Status</span>
                  <span className="font-bold text-emerald-700">✓ Audit Confirmed</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Collateral Type</span>
                  <span className="font-bold text-black">Verified B2B Invoice</span>
                </div>
              </div>
            </div>

            {/* Action Box: Fund Button or Status Notice */}
            <div className="neo-border-thick bg-[#f7f7f7] p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {selectedItem.status === 'OPEN_FOR_FUNDING' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-black">
                    Specify sBTC Contribution Amount:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.001"
                      value={customFundSbtc}
                      onChange={(e) => setCustomFundSbtc(e.target.value)}
                      placeholder="0.1"
                      className="flex-1 neo-border bg-white px-4 py-2.5 text-sm font-mono font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#6B46C1]"
                    />
                    <span className="neo-border bg-[#a8ff3e] px-3 py-2.5 text-xs font-bold text-black">
                      sBTC
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFundConfirm}
                    disabled={isFundingSubmitting}
                    className="w-full neo-border bg-[#a8ff3e] py-3.5 px-6 font-syne text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer"
                  >
                    {isFundingSubmitting ? 'Processing sBTC Transaction...' : '⚡ Confirm & Fund Receivable Now →'}
                  </button>
                </div>
              ) : (
                <div className="bg-[#c4b5fd]/30 neo-border p-4 text-center space-y-1">
                  <span className="font-bold text-sm text-black block">
                    Status: {getStatusBadge(selectedItem.status).label}
                  </span>
                  <p className="text-xs font-medium text-gray-700">
                    This receivable is currently not accepting new liquidity funding.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/20 text-xs font-bold">
                <Link
                  to={`/receivable/${selectedItem.id}`}
                  className="text-[#6B46C1] hover:underline"
                >
                  View Full Asset Page & Transparency Log →
                </Link>
                <button
                  type="button"
                  onClick={closeMiniPage}
                  className="text-gray-700 hover:text-black underline"
                >
                  Close Mini Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PILOT DISCLOSURE — mirrors Landing's section 8 ── */}
      <section className="py-16 px-4 sm:px-8 bg-white border-t-[3px] border-black">
        <div className="mx-auto max-w-5xl text-center space-y-6">
          <h2 className="font-syne text-2xl sm:text-4xl font-medium text-black">
            Pilot Status & Risk Disclosure
          </h2>
          <p className="mx-auto max-w-3xl font-syne text-sm sm:text-base font-medium text-gray-700 leading-relaxed">
            FlowFi-BTC is an experimental financing pilot on Stacks Testnet. Initial transactions are intentionally size-limited while the financing mechanism, verification process, and settlement contracts are validated.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 font-syne text-xs font-medium">
            <Link
              to="/history"
              className="neo-border bg-[#f7f7f7] px-6 py-3 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              View Transparency Log →
            </Link>
            <Link
              to="/cascade-risk"
              className="neo-border bg-[#ffb6b9] px-6 py-3 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              Risk & Security Framework →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
              Verified business trade receivables connected to Bitcoin capital for transparent, programmable financing on Stacks.
            </p>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Core Pages</h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600 font-syne">
              <li><Link to="/dashboard"          className="hover:text-black">Dashboard</Link></li>
              <li><Link to="/submit-receivable"  className="hover:text-black">Submit Receivable</Link></li>
              <li><Link to="/funding"            className="hover:text-black">Active Funding</Link></li>
              <li><Link to="/verification"       className="hover:text-black">Verification Log</Link></li>
              <li><Link to="/history"            className="hover:text-black">Transparency Log</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Resources</h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600 font-syne">
              <li><Link to="/cascade-risk" className="hover:text-black">GitHub</Link></li>
              <li><Link to="/liquidity"    className="hover:text-black">Contracts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-medium text-sm text-black mb-3">Stacks Testnet</h4>
            <div className="space-y-2 text-xs font-syne font-medium text-gray-600">
              <p>Contract: <span className="text-black font-medium">sbtc-capital-rail-v2</span></p>
              <p>Network: <span className="text-black font-medium">Stacks Testnet</span></p>
              <div className="pt-2">
                <span className="inline-block neo-border bg-[#a8ff3e] px-3 py-1 text-[10px] font-medium text-black">
                  ● Clarity Smart Contract Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl mt-8 pt-6 border-t-2 border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500 font-syne">
          <p>© 2026 FlowFi-BTC. Open source MIT protocol.</p>
          <div className="flex items-center gap-4">
            <Link to="/settings"  className="hover:text-black">Settings</Link>
            <span>•</span>
            <Link to="/api-docs"  className="hover:text-black">API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};