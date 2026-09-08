import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { wallet, connect, disconnect, role } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleConnect = async () => {
    setShowWalletModal(false);
    await connect();
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b-[3px] border-black bg-white px-6 font-syne">
        {/* Left header context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2  neo-border bg-[#a8ff3e] px-3 py-1 font-syne text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="h-2 w-2  bg-black animate-pulse" />
            <span>Stacks Testnet</span>
          </div>

          <div className="hidden md:flex items-center gap-2  neo-border bg-[#f7f7f7] px-3 py-1 font-syne text-xs font-bold text-black">
            <span className="text-gray-500">Role:</span>
            <span className="uppercase text-black font-extrabold">{role}</span>
          </div>
        </div>

        {/* Right header wallet trigger & stats */}
        <div className="flex items-center gap-3">
          {wallet.isConnected && (
            <div className="hidden sm:flex items-center gap-2  neo-border bg-[#c4b5fd] px-3 py-1 font-syne text-xs font-bold text-black">
              <span className="text-black font-extrabold">{wallet.sbtcBalance} sBTC</span>
              <span className="text-black/40">|</span>
              <span className="text-black/80">{wallet.stxBalance} STX</span>
            </div>
          )}

          {wallet.isConnected ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2  neo-border bg-[#22d3ee] px-3.5 py-1.5 font-syne text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
              >
                <span className="h-2 w-2  bg-black" />
                <span>
                  {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                </span>
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={handleConnect}>
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      {/* Wallet Connection / Disconnect Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[24px] neo-border-thick bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-syne">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <h3 className="font-extrabold text-black text-lg">Stacks Wallet Account</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="h-8 w-8  neo-border bg-[#f7f7f7] text-black font-bold flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 font-syne">
              {wallet.isConnected ? (
                <div className="space-y-4">
                  <div className="bg-[#a8ff3e]/20 neo-border p-4 rounded-[18px]">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                      Connected Address
                    </span>
                    <span className="font-mono text-sm font-black text-black truncate block">
                      {wallet.address}
                    </span>
                  </div>

                  <Button
                    variant="danger"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      disconnect();
                      setShowWalletModal(false);
                    }}
                  >
                    Disconnect Wallet
                  </Button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex w-full items-center justify-between rounded-[18px] neo-border bg-[#a8ff3e] p-5 text-left hover:brightness-105 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10  bg-black neo-border flex items-center justify-center font-syne font-bold text-white">
                      STX
                    </div>
                    <div>
                      <div className="font-extrabold text-black">Connect Stacks Wallet</div>
                      <div className="text-xs text-black/80 font-syne font-bold">Leather / Xverse Extension</div>
                    </div>
                  </div>
                  <span className="font-syne text-xs font-extrabold text-black">Connect →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
