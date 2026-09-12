import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { receivablesApi, marketplaceApi } from '../lib/api';
import type { Receivable, MarketplaceItem } from '../types/api';
import { Plus, RefreshCcw } from 'lucide-react';
import { ScaleLoader } from 'react-spinners';

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

const statusAccent = (status?: string | number) => {
  switch (status) {
    case 'FUNDED': return '#c4b5fd';
    case 'REPAID': return '#a8ff3e';
    default: return '#22d3ee';
  }
};

export const ReceivablesListPage: React.FC = () => {
  const navigate = useNavigate();

  const [receivablesList, setReceivablesList] = useState<Receivable[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchAllReceivables = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoadingList(true);
    try {
      const myRes = await receivablesApi.getMyReceivables(1, 50).catch(() => null);
      let items: Receivable[] = myRes?.items && Array.isArray(myRes.items) ? myRes.items : [];

      if (items.length === 0) {
        const mktRes = await marketplaceApi.listReceivables().catch(() => null);
        if (mktRes?.items && Array.isArray(mktRes.items)) {
          items = mktRes.items.map((m: MarketplaceItem) => ({
            id: m.id,
            title: m.title,
            description: `Trade receivable invoice for ${m.businessName}`,
            amountUsd: m.amountUsd,
            status: m.status,
            verificationStatus: m.verificationStatus,
            dueDate: m.dueDate,
            businessName: m.businessName,
            createdAt: m.createdAt,
            debtor: null,
            documentStatus: 'NONE' as const,
            evidenceStatus: 'PENDING' as const,
            registerTxHash: null,
          }));
        }
      }

      setReceivablesList(items);
    } catch (err) {
      console.error('Failed to fetch receivables list from API:', err);
    } finally {
      setLoadingList(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllReceivables();
  }, []);

  const filteredReceivables = receivablesList.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.businessName && r.businessName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'VERIFIED') return matchesSearch && (r.verificationStatus === 'VERIFIED' || r.status === 'VERIFIED');
    if (filterStatus === 'OPEN') return matchesSearch && (r.status === 'OPEN_FOR_FUNDING' || r.status === 'VERIFIED');
    if (filterStatus === 'FUNDED') return matchesSearch && r.status === 'FUNDED';
    if (filterStatus === 'REPAID') return matchesSearch && r.status === 'REPAID';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
      <div className="mx-auto space-y-6">
        {/* Header Banner */}
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              
           
            </div>
            <h1 className="font-syne text-[1.6rem] font-medium leading-tight text-black">
              Trade Invoices & <span className="text-[#6B46C1]">Receivables</span>
            </h1>
            <p className="text-[13px] text-gray-600">
              Browse all corporate trade receivables registered on-chain.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => fetchAllReceivables(true)}
              disabled={isRefreshing || loadingList}
              className="neo-border bg-[#f7f7f7] hover:bg-white px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}><RefreshCcw size={12} /></span>
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <Link
              to="/submit-receivable"
              className="neo-border bg-[#a8ff3e] px-4 py-2 text-xs font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
            >
              <Plus size={12} className='inline-block' /> Register New
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'VERIFIED', 'OPEN', 'FUNDED', 'REPAID'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 text-xs font-medium neo-border transition-all whitespace-nowrap ${
                    filterStatus === st
                      ? 'bg-[#a8ff3e] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                      : 'bg-[#f7f7f7] text-gray-700 hover:bg-white'
                  }`}
                >
                  {st === 'ALL' ? 'All Receivables' : st}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search invoices or vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full neo-border bg-[#f7f7f7] px-3.5 py-1.5 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e]"
              />
            </div>
          </div>

          {/* Grid */}
          {loadingList ? (
            <div className="py-12 text-center text-xs font-medium text-gray-500 animate-pulse space-y-2">
                     <div className="text-xl inline-block">

<ScaleLoader color="#000000" speedMultiplier={0.9} /></div>
              <div>Fetching receivables list....</div>
            </div>
          ) : filteredReceivables.length === 0 ? (
            <div className="py-10 text-center neo-border bg-[#f7f7f7] p-6 space-y-3">
              <div className="text-2xl">📋</div>
              <div className="font-medium text-black text-sm">No Receivables Found</div>
              <p className="text-gray-600 text-xs max-w-sm mx-auto">
                No registered receivables match your current filter or search criteria.
              </p>
              <Link
                to="/submit-receivable"
                className="inline-block neo-border bg-[#a8ff3e] px-4 py-2 text-xs font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                + Submit Invoice Receivable
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceivables.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/receivables/${item.id}`)}
                  className="cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-black/10 bg-[#f7f7f7] p-4 hover:border-black/40 hover:bg-white transition-all group font-syne neo-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center bg-white neo-border group-hover:bg-[#a8ff3e] shrink-0">
                      <ClockIcon />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-black block truncate">{item.title}</span>
                      <span className="text-xs text-gray-600 font-mono">
                        ${Number(item.amountUsd || 0).toLocaleString()} USD • Ref: {item.invoiceNumber || item.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="neo-border px-2.5 py-0.5 text-[10px] font-medium bg-[#22d3ee] text-black">
                      {item.verificationStatus || 'VERIFIED'}
                    </span>
                    <span
                      className="neo-border px-3 py-1 text-xs font-medium text-black"
                      style={{ backgroundColor: statusAccent(item.status) }}
                    >
                      {item.status || 'VERIFIED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};