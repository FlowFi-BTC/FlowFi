import React from 'react';
import { Card } from '../components/common/Card';
import { StatusHistoryTimeline } from '../components/modular/receivable/StatusHistoryTimeline';
import { MOCK_STATUS_EVENTS } from '../data/mockData';

export const TransparencyLogPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-syne text-xs font-bold text-[#6B46C1]">
          <span>03 / CAPITAL RAIL</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mt-1">
          Status History & Transparency Log
        </h1>
        <p className="text-gray-600 text-sm font-semibold mt-1">
          Chronological index of all Stacks testnet contract events, status transitions, and transaction hashes.
        </p>
      </div>

      <Card className="space-y-6">
        <StatusHistoryTimeline events={MOCK_STATUS_EVENTS} />
      </Card>
    </div>
  );
};
