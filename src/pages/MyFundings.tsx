import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fundingApi } from '../lib/api';
import { friendlyErrorMessage } from '../lib/errors';
import type { InvestorFundingItem } from '../types/api';
import { ScaleLoader } from 'react-spinners';

/** My Fundings — #31 GET /fundings/me. Kept as a legacy alias of /investor/fundings. */
export const MyFundings: React.FC = () => {
  const [items, setItems] = useState<InvestorFundingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fundingApi
      .getMyFundings()
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(friendlyErrorMessage(err, 'Failed to load your fundings.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-syne">
      <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-medium text-black">My Fundings</h1>
          <p className="mt-1 text-[13px] text-gray-600">Investor portfolio — full view lives at /investor/fundings.</p>
        </div>
        <Link
          to="/investor/fundings"
          className="neo-border bg-[#c4b5fd] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
        >
          Open full view →
        </Link>
      </div>

      {error && (
        <div className="neo-border-thick bg-[#ffb6b9] p-4 text-xs font-bold text-black">{`⚠️ ${error}`}</div>
      )}

      <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
        {loading ? (
          <div className="py-10 text-center text-xs text-gray-500 animate-pulse">
            <ScaleLoader color="#000000" speedMultiplier={0.9} />
          </div>
        ) : items.length === 0 && !error ? (
          <div className="py-10 text-center neo-border bg-[#f7f7f7] p-6 text-xs text-gray-600">
            No funding positions yet — explore the marketplace to deploy sBTC.
          </div>
        ) : (
          items.map((f) => (
            <Link
              key={f.id}
              to={`/investor/fundings/${f.id}`}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 neo-border bg-[#f7f7f7] p-4 hover:bg-white"
            >
              <div>
                <span className="text-sm font-bold text-black block">{f.businessName}</span>
                <span className="text-xs text-gray-600 font-mono">
                  {f.amountSbtc} sBTC • due {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <span className="neo-border px-3 py-1 text-xs font-bold bg-[#a8ff3e] text-black">{f.status}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
