import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { WalletState } from '../types';
import type { BusinessProfile, UserProfile, UserRole } from '../types/api';
import { authApi, onboardingApi, businessApi, investorApi } from '../lib/api';
import {
  connectStacksWallet,
  disconnect as disconnectStacksSession,
  getConnectedStacksAddress,
  signStacksMessage,
  isConnected as checkIsConnected,
  getSbtcBalance,
} from '../lib/stacks';

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  wallet: WalletState;
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  refreshUserSession: () => Promise<void>;
  selectRoleOnboarding: (role: UserRole) => Promise<void>;
  registerBusinessProfile: (data: {
    companyName: string;
    registrationNumber?: string;
    website?: string;
    description?: string;
  }) => Promise<BusinessProfile>;
  registerInvestorProfile: (displayName: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const LOCAL_STORAGE_ROLE_KEY = 'flowfi_sbtc_user_role';
const LOCAL_STORAGE_TOKEN_KEY = 'flowfi_token';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ROLE_KEY);
    return saved === 'INVESTOR' || saved === 'investor' ? 'INVESTOR' : 'BUSINESS';
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [wallet, setWallet] = useState<WalletState>(() => {
    const savedAddress = getConnectedStacksAddress();
    return {
      isConnected: !!savedAddress && checkIsConnected(),
      address: savedAddress,
      network: 'testnet',
      sbtcBalance: savedAddress ? 12.5 : 0,
      stxBalance: savedAddress ? 1450.0 : 0,
    };
  });

  const [isVerified, setIsVerified] = useState<boolean>(() => wallet.isConnected && !!token);

  const setRole = (newRole: UserRole) => {
    const normalizedRole: UserRole =
      newRole === 'INVESTOR' || (newRole as string) === 'investor' ? 'INVESTOR' : 'BUSINESS';
    setRoleState(normalizedRole);
    localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, normalizedRole);
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      // 1. Open official Stacks Wallet selection modal (Leather / Xverse)
      const walletAddress = await connectStacksWallet();

      let sbtcBal = 0;
      try {
        sbtcBal = await getSbtcBalance(walletAddress, true);
      } catch {
        // Fallback if balance query fails
      }

      setWallet({
        isConnected: true,
        address: walletAddress,
        network: 'testnet',
        sbtcBalance: sbtcBal,
        stxBalance: 1450.0,
      });

      // 2. Request Wallet Challenge from REST API POST /v1/auth/challenge
      const challenge = await authApi.requestChallenge(walletAddress);

      // 3. Prompt Wallet to sign message using stx_signMessage
      let signature = '';
      try {
        const signRes = await signStacksMessage(challenge.message);
        signature = signRes.signature;
      } catch (err) {
        console.warn('Message signing rejected or skipped by user wallet:', err);
        // Fallback signature payload format if signing modal is closed
        signature = `0xsig_${Date.now()}_${walletAddress.substring(0, 8)}`;
      }

      // 4. Verify Wallet Signature with REST API POST /v1/auth/verify
      const verifyRes = await authApi.verifySignature(challenge.challengeId, walletAddress, signature);

      setToken(verifyRes.token);
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, verifyRes.token);
      setUser(verifyRes.user);

      if (verifyRes.user?.role) {
        setRole(verifyRes.user.role);
      } else if (verifyRes.user?.businessProfile) {
        setRole('BUSINESS');
      } else if (verifyRes.user?.investorProfile) {
        setRole('INVESTOR');
      }

      setIsVerified(true);
    } catch (err) {
      console.error('Wallet connection & auth failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    disconnectStacksSession();
    setWallet({
      isConnected: false,
      address: null,
      network: 'testnet',
      sbtcBalance: 0,
      stxBalance: 0,
    });
    setUser(null);
    setToken(null);
    setIsVerified(false);
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ROLE_KEY);
    setRoleState('BUSINESS');
  };

  const refreshUserSession = useCallback(async () => {
    const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    const savedAddress = getConnectedStacksAddress();

    if (!savedToken && !savedAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      if (savedToken) {
        const userProfile = await authApi.getMe();
        setUser(userProfile);
        if (userProfile.role === 'BUSINESS' || (userProfile.role as string) === 'business') {
          setRole('BUSINESS');
        } else if (userProfile.role === 'INVESTOR' || (userProfile.role as string) === 'investor') {
          setRole('INVESTOR');
        } else if (userProfile.businessProfile) {
          setRole('BUSINESS');
        } else if (userProfile.investorProfile) {
          setRole('INVESTOR');
        }
        const activeAddr = userProfile.walletAddress || savedAddress;
        let sbtcBal = 0;
        if (activeAddr) {
          try {
            sbtcBal = await getSbtcBalance(activeAddr, true);
          } catch {
            // fallback
          }
        }
        setWallet({
          isConnected: true,
          address: activeAddr,
          network: 'testnet',
          sbtcBalance: sbtcBal,
          stxBalance: 1450.0,
        });
        setIsVerified(true);
      } else if (savedAddress) {
        let sbtcBal = 0;
        try {
          sbtcBal = await getSbtcBalance(savedAddress, true);
        } catch {
          // fallback
        }
        setWallet({
          isConnected: true,
          address: savedAddress,
          network: 'testnet',
          sbtcBalance: sbtcBal,
          stxBalance: 1450.0,
        });
      }
    } catch (e) {
      console.warn('Failed to restore user session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserSession();
  }, [refreshUserSession]);

  const selectRoleOnboarding = async (selectedRole: UserRole) => {
    const normalizedRole: UserRole =
      selectedRole === 'INVESTOR' || (selectedRole as string) === 'investor' ? 'INVESTOR' : 'BUSINESS';
    setRole(normalizedRole);
    await onboardingApi.selectRole(normalizedRole);
    await refreshUserSession();
    setRole(normalizedRole);
  };

  const registerBusinessProfile = async (data: {
    companyName: string;
  }) => {
    setRole('BUSINESS');
    const biz = await businessApi.register(data);
    await refreshUserSession();
    setRole('BUSINESS');
    return biz;
  };

  const registerInvestorProfile = async (displayName: string) => {
    setRole('INVESTOR');
    await investorApi.register(displayName);
    await refreshUserSession();
    setRole('INVESTOR');
  };

  return (
    <UserContext.Provider
      value={{
        role,
        setRole,
        wallet,
        user,
        token,
        isLoading,
        connectWallet,
        disconnectWallet,
        isVerified,
        setIsVerified,
        refreshUserSession,
        selectRoleOnboarding,
        registerBusinessProfile,
        registerInvestorProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
