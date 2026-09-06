import React from 'react';
import { ProtocolGrid } from '../components/modular/protocols/ProtocolGrid';
import { TRACKED_PROTOCOLS } from '../data/mockData';
import { Card } from '../components/common/Card';

export const ProtocolsPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-syne text-xs font-bold text-[#6B46C1]">
          <span>02 / ANALYTICS</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mt-1">
          Tracked Infrastructure & Protocols
        </h1>
        <p className="text-gray-600 text-sm font-semibold mt-1">
          Live monitoring of sBTC credit facilities, liquidity pools, and CDP engines on Stacks.
        </p>
      </div>

      <ProtocolGrid protocols={TRACKED_PROTOCOLS} />

      {/* Deep-dive Infrastructure Summary Card */}
      <Card className="space-y-4">
        <h3 className="font-extrabold text-black text-lg border-b-2 border-black pb-3">Protocol Integration Architecture</h3>
        <p className="text-xs text-gray-700 font-semibold leading-relaxed font-sans">
          FlowScan monitors sBTC capital movement across key lending markets and liquidity reserves. Smart contract events from Zest Protocol, Granite, and SSE CDP engines are indexed in real-time to compute systemic risk metrics and settlement velocity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-black font-syne text-xs">
          <div className="bg-[#f7f7f7] p-4 rounded-[18px] neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-gray-600 font-bold block mb-1">TOTAL MONITORED TVL</span>
            <span className="text-black font-black text-lg">1,313.4 sBTC</span>
          </div>
          <div className="bg-[#f7f7f7] p-4 rounded-[18px] neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-gray-600 font-bold block mb-1">AVERAGE YIELD APY</span>
            <span className="text-[#6B46C1] font-black text-lg">7.12%</span>
          </div>
          <div className="bg-[#f7f7f7] p-4 rounded-[18px] neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-gray-600 font-bold block mb-1">CONTRACT INTEGRATION</span>
            <span className="text-black font-black text-lg">Clarity v2.4</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
