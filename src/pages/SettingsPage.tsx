import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { useWallet } from '../hooks/useWallet';
import { businessApi, investorApi } from '../lib/api';

const RailStar = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" className={className}>
    <path
      d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
      fill="#a8ff3e"
      stroke="black"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const SettingsPage: React.FC = () => {
  const { wallet, connect, disconnect, role, user, refreshUserSession } = useWallet();
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [rpcEndpoint, setRpcEndpoint] = useState('https://api.testnet.hiro.so');

  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isBusiness = role === 'BUSINESS' || role === 'business';

  useEffect(() => {
    if (user?.businessProfile) {
      setCompanyName(user.businessProfile.companyName || '');
      setWebsite(user.businessProfile.website || '');
      setDescription(user.businessProfile.description || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      if (isBusiness) {
        await businessApi.updateMe({
          companyName,
          website,
          description,
        });
      } else {
        await investorApi.register(companyName || 'Prudence Capital Vault');
      }
      await refreshUserSession();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 font-syne">
      {/* Header Banner */}
      <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
        <h1 className="font-syne text-[1.6rem] font-medium leading-tight text-black">
          Profile & Settlement <span className="text-[#6B46C1]">Rail Preferences</span>
        </h1>
        <p className="mt-1 text-[13px] text-gray-600 max-w-[420px]">
          Update your profile and configure the Stacks node your account settles through.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-syne font-medium text-black text-[1.1rem] border-b-2 border-black/10 pb-3">
              {isBusiness ? 'Business Profile Settings' : 'Investor Profile Settings'}
            </h3>

            {saveSuccess && (
              <div className="neo-border bg-[#a8ff3e] px-4 py-2.5 text-[13px] font-syne font-medium text-black">
                Profile saved and updated.
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 font-syne text-[13px]">
              <div>
                <label className="text-gray-600 font-medium block mb-1.5">
                  {isBusiness ? 'Company Name' : 'Display Name / Vault Label'}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                />
              </div>

              {isBusiness && (
                <>
                  <div>
                    <label className="text-gray-600 font-medium block mb-1.5">Company Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-600 font-medium block mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full neo-border bg-[#f7f7f7] p-3 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="neo-border bg-[#a8ff3e] px-5 py-2.5 text-[13px] font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-60"
              >
                {isUpdating ? 'Saving Profile...' : 'Save Profile Changes →'}
              </button>
            </form>
          </Card>

          {/* Stacks Node Config */}
          <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-syne font-medium text-black text-[1.1rem] border-b-2 border-black/10 pb-3">
              Stacks Blockchain Node & RPC Configuration
            </h3>

            <div className="space-y-4 font-syne text-[13px]">
              <div className="space-y-2">
                <label className="text-gray-600 font-medium block">
                  Target Stacks Network Environment
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNetwork('testnet')}
                    className={`flex-1 py-2.5 px-4 neo-border font-medium text-center transition-transform hover:-translate-y-0.5 ${
                      network === 'testnet'
                        ? 'bg-[#a8ff3e] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-600'
                    }`}
                  >
                    ● Stacks Testnet (sBTC Enabled)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNetwork('mainnet')}
                    className={`flex-1 py-2.5 px-4 neo-border font-medium text-center transition-transform hover:-translate-y-0.5 ${
                      network === 'mainnet'
                        ? 'bg-[#c4b5fd] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-600'
                    }`}
                  >
                    Mainnet (Preview Mode)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-gray-600 font-medium block">Hiro API RPC Endpoint URL</label>
                <input
                  type="text"
                  value={rpcEndpoint}
                  onChange={(e) => setRpcEndpoint(e.target.value)}
                  className="w-full neo-border bg-[#f7f7f7] px-4 py-2.5 font-syne text-[13px] text-black font-medium focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="font-syne font-medium text-black text-[1.1rem] border-b-2 border-black/10 pb-3">
              Connected Stacks Wallet
            </h3>

            {wallet.isConnected ? (
              <div className="space-y-4 font-syne text-[13px]">
                <div className="neo-border bg-[#c4b5fd] p-4 space-y-2">
                  <span className="text-[11px] font-medium text-black/70 block">
                    Active Account Address
                  </span>
                  <div className="font-medium text-black truncate">{wallet.address}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/20 text-[13px] font-medium">
                    <span>sBTC Balance:</span>
                    <span className="neo-border bg-white px-2.5 py-0.5 text-[11px] font-medium">
                      {wallet.sbtcBalance} sBTC
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={disconnect}
                  className="w-full py-2.5 neo-border bg-[#ffb6b9] font-medium text-[13px] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-3 font-syne text-[13px]">
                <p className="font-medium text-gray-600">No wallet connected.</p>
                <button
                  type="button"
                  onClick={() => connect()}
                  className="w-full py-2.5 neo-border bg-[#a8ff3e] font-medium text-[13px] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
                >
                  Connect Stacks Wallet
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};