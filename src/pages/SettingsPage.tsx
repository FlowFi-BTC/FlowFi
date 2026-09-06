import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { useWallet } from '../hooks/useWallet';

export const SettingsPage: React.FC = () => {
  const { wallet, connect, disconnect } = useWallet();
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [rpcEndpoint, setRpcEndpoint] = useState('https://api.testnet.hiro.so');
  const [autoApprove, setAutoApprove] = useState(true);
  const [resetNotice, setResetNotice] = useState(false);

  const handleReset = () => {
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-syne text-xs font-bold text-[#6B46C1]">
          <span>SETTINGS & CONFIGURATION</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mt-1">
          Settlement Rail Preferences
        </h1>
        <p className="text-gray-600 text-sm font-semibold mt-1">
          Configure Stacks RPC nodes, sBTC testnet parameters, wallet behaviors, and mock state reset.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Network & Wallet Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-6">
            <h3 className="font-syne font-extrabold text-black text-lg border-b-2 border-black pb-3">
              Stacks Blockchain Node & RPC Configuration
            </h3>

            <div className="space-y-4 font-syne text-xs">
              <div className="space-y-2">
                <label className="text-gray-700 font-extrabold block">
                  Target Stacks Network Environment
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNetwork('testnet')}
                    className={`flex-1 py-2.5 px-4 rounded-full neo-border font-bold text-center transition-transform hover:-translate-y-0.5 ${
                      network === 'testnet'
                        ? 'bg-[#a8ff3e] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    ● Stacks Testnet (sBTC Enabled)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNetwork('mainnet')}
                    className={`flex-1 py-2.5 px-4 rounded-full neo-border font-bold text-center transition-transform hover:-translate-y-0.5 ${
                      network === 'mainnet'
                        ? 'bg-[#c4b5fd] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    Mainnet (Preview Mode)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-gray-700 font-extrabold block">
                  Hiro API RPC Endpoint URL
                </label>
                <input
                  type="text"
                  value={rpcEndpoint}
                  onChange={(e) => setRpcEndpoint(e.target.value)}
                  className="w-full rounded-[14px] neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-xs text-black font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-black/10">
                <div>
                  <span className="font-bold text-black block">Auto-broadcasting Simulation</span>
                  <span className="text-gray-500 font-sans text-xs">
                    Simulate instant Clarity contract confirmations in demo mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoApprove(!autoApprove)}
                  className={`h-6 w-12 rounded-full neo-border transition-colors relative ${
                    autoApprove ? 'bg-[#a8ff3e]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform ${
                      autoApprove ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Smart Contract Deployments */}
          <Card className="space-y-4 font-syne text-xs">
            <h3 className="font-syne font-extrabold text-black text-lg border-b-2 border-black pb-3">
              Clarity Smart Contract Artifacts
            </h3>

            <div className="space-y-3">
              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-black block text-sm font-syne">
                    sbtc-capital-rail-v2.clar
                  </span>
                  <span className="text-gray-500 text-[11px]">Principal: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM</span>
                </div>
                <span className="bg-[#a8ff3e] text-black font-extrabold px-2.5 py-1 rounded-full neo-border text-[10px] self-start sm:self-auto">
                  ACTIVE DEPLOYMENT
                </span>
              </div>

              <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-black block text-sm font-syne">
                    sbtc-token-mock.clar
                  </span>
                  <span className="text-gray-500 text-[11px]">SIP-010 Fungible Token Standard</span>
                </div>
                <span className="bg-[#22d3ee] text-black font-extrabold px-2.5 py-1 rounded-full neo-border text-[10px] self-start sm:self-auto">
                  SIP-010 OK
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Wallet State & Developer Tools */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="font-syne font-extrabold text-black text-lg border-b-2 border-black pb-3">
              Connected Stacks Wallet
            </h3>

            {wallet.isConnected ? (
              <div className="space-y-4 font-syne text-xs">
                <div className="rounded-[18px] neo-border bg-[#c4b5fd] p-4 space-y-2">
                  <span className="text-[10px] uppercase font-sans font-extrabold text-black/70 block">
                    Active Account Address
                  </span>
                  <div className="font-black text-black truncate">{wallet.address}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/20 text-xs font-bold">
                    <span>sBTC Balance:</span>
                    <span className="bg-white neo-border px-2 py-0.5 rounded">{wallet.sbtcBalance} sBTC</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={disconnect}
                  className="w-full py-2.5 rounded-full neo-border bg-[#ffb6b9] font-extrabold text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-3 font-sans text-xs">
                <p className="font-semibold text-gray-600">
                  No wallet currently connected. Connect Leather or Xverse to test on-chain contract calls.
                </p>
                <button
                  type="button"
                  onClick={() => connect('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')}
                  className="w-full py-2.5 rounded-full neo-border bg-[#a8ff3e] font-extrabold text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                >
                  Connect Mock Leather Wallet
                </button>
              </div>
            )}
          </Card>

          {/* Reset Demo State */}
          <Card className="space-y-4">
            <h3 className="font-syne font-extrabold text-black text-lg border-b-2 border-black pb-3">
              Developer State Reset
            </h3>
            <p className="text-xs font-semibold text-gray-600 leading-relaxed">
              Reset all local state stores, mock transactions, and receivable statuses to default pilot values.
            </p>

            {resetNotice && (
              <div className="rounded-[14px] neo-border bg-[#a8ff3e] p-3 text-xs font-bold text-black font-syne text-center">
                ✓ Local state reset successfully!
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 rounded-full neo-border bg-[#ffb6b9] font-extrabold text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffa6a9] transition-transform hover:-translate-y-0.5"
            >
              🔄 Reset Demo State & Cache
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
