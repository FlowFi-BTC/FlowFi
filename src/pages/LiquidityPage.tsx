import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { StatBox } from '../components/common/StatBox';
import { Button } from '../components/common/Button';
import { useWallet } from '../hooks/useWallet';

export const LiquidityPage: React.FC = () => {
  const { wallet } = useWallet();
  const [depositAmount, setDepositAmount] = useState('0.5');

  return (
    <div className="space-y-6 font-sans">
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-syne text-xs font-bold text-[#6B46C1]">
          <span>04 / ANALYTICS</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mt-1">
          Liquidity & Settlement Pools
        </h1>
        <p className="text-gray-600 text-sm font-semibold mt-1">
          sBTC reserve depth, settlement pool utilization, and capital deposit interface.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBox
          label="Total sBTC Reserve Pool"
          value="48.50 sBTC"
          subValue="$3,152,500 USD"
          change="+12.4% this month"
        />
        <StatBox
          label="Capital Utilization Rate"
          value="74.2%"
          subValue="2.50 sBTC deployed to receivables"
          change="Optimal"
        />
        <StatBox
          label="Net Yield APY"
          value="8.45%"
          subValue="Real-world cash flow backed"
          change="Fixed Rate"
        />
      </div>

      {/* Deposit & Reserve Management Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="font-extrabold text-black text-lg border-b-2 border-black pb-3">Capital Provider Deposit</h3>
          <p className="text-xs text-gray-600 font-semibold">
            Supply sBTC to the settlement pool to fund verified trade receivables.
          </p>

          <div className="space-y-4 font-syne">
            <div>
              <label className="text-xs text-gray-700 font-bold block mb-1.5">Deposit Amount (sBTC):</label>
              <div className="relative">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-3 text-black font-syne text-sm font-extrabold focus:bg-white focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="0.0"
                />
                <span className="absolute right-3.5 top-3 text-xs text-black font-black bg-[#a8ff3e] px-2 py-0.5 rounded neo-border">sBTC</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-700 font-bold pt-1">
              <span>Connected Wallet Balance:</span>
              <span className="text-black font-extrabold">{wallet.sbtcBalance} sBTC</span>
            </div>

            <Button
              variant="primary"
              className="w-full py-3 text-sm"
              onClick={() => alert(`Simulated deposit of ${depositAmount} sBTC into settlement pool`)}
            >
              Deposit {depositAmount} sBTC to Pool
            </Button>
          </div>
        </Card>

        {/* Pool Structure Breakdown */}
        <Card className="space-y-4">
          <h3 className="font-extrabold text-black text-lg border-b-2 border-black pb-3">Settlement Pool Allocations</h3>

          <div className="space-y-3 font-syne text-xs">
            <div className="flex items-center justify-between p-4 rounded-[18px] neo-border bg-[#f7f7f7] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="font-extrabold text-black text-sm">Verified Trade Receivables</div>
                <div className="text-[11px] text-gray-600 font-bold">Primary Pilot Rail #01</div>
              </div>
              <div className="text-right">
                <div className="font-black text-[#6B46C1] text-base">36.00 sBTC</div>
                <div className="text-[10px] font-bold text-gray-600">74.2% Share</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-[18px] neo-border bg-[#f7f7f7] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="font-extrabold text-black text-sm">Instant Liquidity Reserve</div>
                <div className="text-[11px] text-gray-600 font-bold">Unallocated Buffer</div>
              </div>
              <div className="text-right">
                <div className="font-black text-[#22d3ee] text-base">12.50 sBTC</div>
                <div className="text-[10px] font-bold text-gray-600">25.8% Share</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
