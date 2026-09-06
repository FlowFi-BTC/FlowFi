import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { StatBox } from '../components/common/StatBox';
import { Badge } from '../components/common/Badge';

export const CascadeRiskPage: React.FC = () => {
  const [stressBtcDrop, setStressBtcDrop] = useState(25);

  const calculatedLtv = (65 + stressBtcDrop * 0.4).toFixed(1);
  const healthFactor = (1.8 - stressBtcDrop * 0.02).toFixed(2);

  return (
    <div className="space-y-6 font-sans">
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-syne text-xs font-bold text-[#6B46C1]">
          <span>03 / ANALYTICS</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mt-1">
          Cascade Risk & Stress Testing
        </h1>
        <p className="text-gray-600 text-sm font-semibold mt-1">
          Systemic risk assessment, LTV liquidation threshold simulation, and collateral stress test.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBox
          label="Systemic Health Factor"
          value={healthFactor}
          subValue="Target: > 1.25"
          isPositive={parseFloat(healthFactor) > 1.25}
          change={parseFloat(healthFactor) > 1.25 ? 'Healthy' : 'Warning'}
        />
        <StatBox
          label="Estimated Avg LTV"
          value={`${calculatedLtv}%`}
          subValue="Liquidation at 85.0%"
          isPositive={parseFloat(calculatedLtv) < 80}
        />
        <StatBox
          label="Max Drawdown Tolerance"
          value="-42.5%"
          subValue="BTC Price Drop Buffer"
          change="Safe"
        />
      </div>

      {/* Stress Simulator Card */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div>
            <h3 className="font-extrabold text-black text-lg">BTC Price Shock Stress Test</h3>
            <p className="text-xs text-gray-600 font-syne font-bold">Simulate sudden BTC price volatility</p>
          </div>
          <Badge variant={stressBtcDrop > 35 ? 'rose' : stressBtcDrop > 20 ? 'amber' : 'emerald'}>
            {stressBtcDrop > 35 ? 'CRITICAL RISK' : stressBtcDrop > 20 ? 'MODERATE SHOCK' : 'NORMAL'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center font-syne text-xs font-bold">
            <span className="text-gray-700">BTC Price Drop Simulation:</span>
            <span className="neo-border bg-[#a8ff3e] text-black px-3 py-1 rounded-full text-sm font-extrabold">-{stressBtcDrop}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={stressBtcDrop}
            onChange={(e) => setStressBtcDrop(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6B46C1] neo-border"
          />

          <div className="flex justify-between font-syne text-[11px] font-bold text-gray-600">
            <span>0% (Current: $65,000)</span>
            <span>-30% ($45,500)</span>
            <span>-60% ($26,000)</span>
          </div>
        </div>

        {/* Simulation Output Table */}
        <div className="rounded-[18px] neo-border bg-[#f7f7f7] overflow-hidden font-syne text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-left">
            <thead className="border-b-2 border-black bg-white text-black font-extrabold text-xs">
              <tr>
                <th className="p-3.5">Protocol / Rail</th>
                <th className="p-3.5">Simulated LTV</th>
                <th className="p-3.5">Liquidation Gap</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black font-bold">
              <tr>
                <td className="p-3.5 font-extrabold text-black">sBTC Capital Rail (Pilot #1)</td>
                <td className="p-3.5">{(60 + stressBtcDrop * 0.35).toFixed(1)}%</td>
                <td className="p-3.5 text-black font-extrabold">+{(25 - stressBtcDrop * 0.35).toFixed(1)}%</td>
                <td className="p-3.5">
                  <span className="neo-border bg-[#a8ff3e] text-black px-2 py-0.5 rounded-full text-[10px]">Solvent</span>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-extrabold text-black">Zest sBTC Vault</td>
                <td className="p-3.5">{(65 + stressBtcDrop * 0.4).toFixed(1)}%</td>
                <td className="p-3.5 text-black font-extrabold">+{(20 - stressBtcDrop * 0.4).toFixed(1)}%</td>
                <td className="p-3.5">
                  <span className="neo-border bg-[#a8ff3e] text-black px-2 py-0.5 rounded-full text-[10px]">Solvent</span>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-extrabold text-black">SSE CDP Engine</td>
                <td className="p-3.5">{(70 + stressBtcDrop * 0.45).toFixed(1)}%</td>
                <td className="p-3.5 text-black font-extrabold">+{(15 - stressBtcDrop * 0.45).toFixed(1)}%</td>
                <td className="p-3.5">
                  <span className={`neo-border px-2 py-0.5 rounded-full text-[10px] ${stressBtcDrop > 30 ? 'bg-[#ffb6b9] text-black' : 'bg-[#fef08a] text-black'}`}>
                    {stressBtcDrop > 30 ? 'At Risk' : 'Monitored'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
