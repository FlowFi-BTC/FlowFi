import React from 'react';
import { Link } from 'react-router-dom';
import type { Receivable } from '../../../types';
import { StatusBadge } from '../../common/Badge';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

interface ReceivableCardProps {
  receivable: Receivable;
}

export const ReceivableCard: React.FC<ReceivableCardProps> = ({ receivable }) => {
  return (
    <Card hoverable className="flex flex-col justify-between h-full font-sans">
      <div>
        {/* Header line: ID & Status */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="font-syne text-xs font-black text-[#6B46C1]">
              Receivable #{receivable.id}
            </span>
            <span className="text-gray-400">•</span>
            <span className="font-syne text-xs font-bold text-gray-600">{receivable.invoiceNumber}</span>
          </div>
          <StatusBadge status={receivable.status} />
        </div>

        {/* Counterparty & Borrower */}
        <div className="mt-4 space-y-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
              Borrower / Counterparty
            </span>
            <h3 className="font-black text-black text-lg leading-tight mt-0.5">
              {receivable.borrowerName}
            </h3>
            <p className="font-syne text-xs font-bold text-gray-600 mt-1">
              Invoice Counterparty: <span className="text-black">{receivable.counterparty}</span>
            </p>
          </div>

          {/* Amount Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-black/10">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
                Capital Required
              </span>
              <div className="font-syne text-xl font-black text-black">
                {(receivable.amount / 100000000).toFixed(2)} sBTC
              </div>
              <div className="font-syne text-[11px] font-bold text-gray-600">
                ${receivable.amountUsd.toLocaleString()} USD
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
                Maturity Target
              </span>
              <div className="font-syne text-sm font-black text-black mt-1">
                Block #{receivable.dueBlock}
              </div>
              <div className="font-syne text-[11px] font-bold text-gray-600">
                Est. {receivable.dueDateEstimated}
              </div>
            </div>
          </div>

          {/* Doc Hash preview */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
              Verification Hash (doc-hash)
            </span>
            <div className="font-syne text-[10px] font-bold text-black bg-[#f7f7f7] neo-border rounded-[10px] px-2.5 py-1 truncate mt-0.5">
              {receivable.docHash}
            </div>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between">
        <span className="text-xs text-gray-600 font-syne font-bold">Pilot Receivable #{receivable.id}</span>
        <Link to={`/receivable/${receivable.id}`}>
          <Button size="sm" variant="primary">
            View Details & Actions →
          </Button>
        </Link>
      </div>
    </Card>
  );
};
