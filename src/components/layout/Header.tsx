import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { wallet, connect, disconnect } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b-[3px] border-black bg-white px-6 font-sans">
        {/* Left header context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full neo-border bg-[#a8ff3e] px-3 py-1 font-syne text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
            <span>Stacks Testnet</span>
          </div>

        
        </div>

        {/* Right header wallet trigger & stats */}
        <div className="flex items-center gap-3">
          {wallet.isConnected && (
            <div className="hidden sm:flex items-center gap-2 rounded-full neo-border bg-[#c4b5fd] px-3 py-1 font-syne text-xs font-bold text-black">
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
                className="flex items-center gap-2 rounded-full neo-border bg-[#22d3ee] px-3.5 py-1.5 font-syne text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
              >
                <span className="h-2 w-2 rounded-full bg-black" />
                <span>
                  {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                </span>
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setShowWalletModal(true)}>
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[24px] neo-border-thick bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-sans">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <h3 className="font-extrabold text-black text-lg">Connect Stacks Wallet</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="h-8 w-8 rounded-full neo-border bg-[#f7f7f7] text-black font-bold flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => {
                  connect('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
                  setShowWalletModal(false);
                }}
                className="flex w-full items-center justify-between rounded-[18px] neo-border bg-[#f7f7f7] p-4 text-left hover:bg-[#a8ff3e] transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-400 neo-border flex items-center justify-center font-syne font-bold text-black">
                    LT
                  </div>
                  <div>
                    <div className="font-extrabold text-black">Leather Wallet</div>
                    <div className="text-xs text-gray-600 font-syne font-bold">Stacks & Bitcoin Native</div>
                  </div>
                </div>
                <span className="font-syne text-xs font-extrabold text-black">Connect →</span>
              </button>

              <button
                onClick={() => {
                  connect('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
                  setShowWalletModal(false);
                }}
                className="flex w-full items-center justify-between rounded-[18px] neo-border bg-[#f7f7f7] p-4 text-left hover:bg-[#c4b5fd] transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-400 neo-border flex items-center justify-center font-syne font-bold text-black">
                    XV
                  </div>
                  <div>
                    <div className="font-extrabold text-black">Xverse Wallet</div>
                    <div className="text-xs text-gray-600 font-syne font-bold">Bitcoin Web3 Wallet</div>
                  </div>
                </div>
                <span className="font-syne text-xs font-extrabold text-black">Connect →</span>
              </button>

              {wallet.isConnected && (
                <div className="pt-3 border-t-2 border-black">
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
