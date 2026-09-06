import React, { useState } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import type { Receivable } from '../../../types';

interface FundingModalProps {
  receivable: Receivable;
  isOpen: boolean;
  onClose: () => void;
  onConfirmFund: (providerAddress: string) => Promise<void> | void;
}

export const FundingModal: React.FC<FundingModalProps> = ({
  receivable,
  isOpen,
  onClose,
  onConfirmFund,
}) => {
  const { wallet, connect } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const sbtcAmount = (receivable.amount / 100000000).toFixed(2);
  const estYieldUsd = (receivable.amountUsd * 0.098).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const activeAddress =
        wallet.address || 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
      await onConfirmFund(activeAddress);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Funding failed:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 font-sans selection:bg-[#a8ff3e]">
      <div className="w-full max-w-lg rounded-[28px] neo-border-thick bg-white p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div>
            <span className="font-syne text-xs font-bold text-[#6B46C1]">
              06 / FUNDING FLOW CONFIRMATION
            </span>
            <h3 className="font-syne font-black text-black text-xl md:text-2xl tracking-tight mt-0.5">
              Confirm sBTC Funding
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full neo-border bg-[#f7f7f7] text-black font-bold flex items-center justify-center hover:bg-gray-200 transition-transform active:translate-y-0.5"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#a8ff3e] neo-border text-2xl font-black">
              ✓
            </div>
            <h4 className="text-xl font-black text-black">Funding Executed Successfully!</h4>
            <p className="text-sm font-semibold text-gray-600">
              Receivable #{receivable.id} status updated to Funded (1) on Stacks Testnet.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Receivable Summary Box */}
            <div className="rounded-[20px] neo-border bg-[#f7f7f7] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Target Receivable
                </span>
                <span className="font-syne text-xs font-extrabold text-black bg-[#a8ff3e] px-2.5 py-0.5 rounded-full neo-border">
                  #{receivable.id} • {receivable.invoiceNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-syne">
                <div>
                  <span className="text-[11px] text-gray-500 font-sans font-bold block">
                    Capital Requested
                  </span>
                  <span className="text-lg font-black text-black">
                    {sbtcAmount} sBTC
                  </span>
                  <span className="text-[11px] text-gray-600 block">
                    (${receivable.amountUsd.toLocaleString()} USD)
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-sans font-bold block">
                    Est. Annualized APY
                  </span>
                  <span className="text-lg font-black text-[#6B46C1]">
                    9.8% APY
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold block">
                    +${estYieldUsd} Yield
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-black/10 text-xs font-syne">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Borrower Principal:</span>
                  <span className="text-black font-bold truncate max-w-[200px]">
                    {receivable.borrowerName}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Due Block Target:</span>
                  <span className="text-black font-bold">
                    Block #{receivable.dueBlock} ({receivable.dueDateEstimated})
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Status Banner */}
            {!wallet.isConnected ? (
              <div className="rounded-[18px] neo-border bg-[#fef08a] p-4 text-xs font-sans text-black space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="font-extrabold flex items-center gap-2">
                  <span>⚠️ Wallet Not Connected</span>
                </div>
                <p className="font-semibold text-gray-700">
                  Please connect your Leather or Xverse Stacks wallet to execute the smart contract transfer.
                </p>
                <button
                  type="button"
                  onClick={() => connect('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')}
                  className="w-full mt-1 py-2 rounded-full bg-black text-white font-extrabold text-xs neo-border shadow-[2px_2px_0px_0px_rgba(168,255,62,1)] hover:bg-[#6B46C1]"
                >
                  Quick Connect Mock Leather Wallet
                </button>
              </div>
            ) : (
              <div className="rounded-[18px] neo-border bg-[#c4b5fd] p-4 font-syne text-xs text-black flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <span className="text-[10px] uppercase text-black/70 font-sans font-extrabold block">
                    Connected Capital Provider
                  </span>
                  <span className="font-extrabold">
                    {wallet.address?.substring(0, 8)}...{wallet.address?.substring(wallet.address.length - 6)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-black/70 font-sans font-extrabold block">
                    Available Balance
                  </span>
                  <span className="font-black bg-white px-2 py-0.5 rounded neo-border">
                    {wallet.sbtcBalance} sBTC
                  </span>
                </div>
              </div>
            )}

            {/* Contract Fee & Terms Disclaimer */}
            <div className="text-[11px] text-gray-600 font-semibold leading-snug">
              By confirming, <strong>{sbtcAmount} sBTC</strong> will be locked into the Clarity settlement contract pool and transferred to the borrower upon verified execution.
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-1/3 py-3 rounded-full neo-border bg-[#f7f7f7] font-extrabold text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 transition-transform active:translate-y-0.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-2/3 py-3 rounded-full neo-border bg-[#a8ff3e] font-extrabold text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#96f028] transition-transform active:translate-y-0.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Broadcasting Tx...</span>
                  </>
                ) : (
                  <span>⚡ Confirm sBTC Funding</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
