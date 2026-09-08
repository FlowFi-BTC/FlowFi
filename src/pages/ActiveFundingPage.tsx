import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceApi, fundingApi } from '../lib/api';
import type { MarketplaceItem, InvestorFundingItem } from '../types/api';
import { useUser } from '../context/UserContext';

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

export const ActiveFundingPage: React.FC = () => {
  const { role } = useUser();
  const isInvestor = role === 'INVESTOR' || role === 'investor';

  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [myFundings, setMyFundings] = useState<InvestorFundingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isInvestor) {
          const [mRes, fRes] = await Promise.all([
            marketplaceApi.listReceivables({ search }),
            fundingApi.getMyFundings(),
          ]);
          if (mounted) {
            setMarketplaceItems(mRes.items);
            setMyFundings(fRes.items);
          }
        } else {
          const res = await marketplaceApi.listReceivables({ search });
          if (mounted) setMarketplaceItems(res.items);
        }
      } catch (err) {
        console.error('Failed to load marketplace / funding data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [isInvestor, search]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
      <div className="mx-auto max-w-[840px] space-y-6">
        {/* Header */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div>
            <h1 className="font-syne text-[1.6rem] font-black leading-tight text-black">
              Marketplace & <span className="text-[#6B46C1]">Active Fundings</span>
            </h1>
            <p className="mt-1 text-[14px] font-semibold text-gray-600">
              {isInvestor
                ? 'Discover open receivables for sBTC funding or review active portfolio holdings.'
                : 'Browse registered trade receivables open for sBTC liquidity.'}
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by invoice or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64  neo-border bg-[#f7f7f7] px-4 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#a8ff3e]"
            />
          </div>
        </div>

        {/* Investor My Active Fundings */}
        {isInvestor && myFundings.length > 0 && (
          <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h2 className="font-syne text-lg font-black text-black">My Active sBTC Holdings</h2>
            <div className="space-y-3">
              {myFundings.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[18px] neo-border bg-[#c4b5fd]/20 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div>
                    <span className="font-syne font-black text-black text-sm block">{item.businessName}</span>
                    <span className="text-xs font-semibold text-gray-600">
                      Amount: <span className="text-[#6B46C1] font-black">{item.amountSbtc} sBTC</span> • Due: {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className=" neo-border bg-[#a8ff3e] px-3 py-1 text-xs font-black text-black">
                      {item.status}
                    </span>
                    <Link
                      to={`/receivable/${item.receivableId}`}
                      className=" neo-border bg-white px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketplace Grid */}
        <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h2 className="font-syne text-lg font-black text-black">
            Explore Open Receivables (GET /v1/marketplace/receivables)
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-gray-500 animate-pulse">
              Loading marketplace opportunities...
            </div>
          ) : marketplaceItems.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-gray-500">
              No matching open receivables found.
            </div>
          ) : (
            <div className="space-y-3">
              {marketplaceItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[20px] neo-border bg-[#f7f7f7] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-syne font-black text-black text-base">{item.title}</span>
                      <span className=" neo-border bg-[#a8ff3e] px-2.5 py-0.5 text-[10px] font-black text-black">
                        {item.verificationStatus}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-600">
                      Issuer: <span className="text-black font-extrabold">{item.businessName}</span> • Valuation:{' '}
                      <span className="text-[#6B46C1] font-black">${item.amountUsd} USD</span>
                    </div>
                  </div>

                  <Link
                    to={`/receivable/${item.id}`}
                    className=" neo-border bg-[#22d3ee] px-5 py-2.5 text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                  >
                    View & Fund sBTC →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};