import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { WalletState } from '../types';
import type { BusinessProfile, InvestorProfile, UserProfile, UserRole } from '../types/api';
import { authApi, onboardingApi, businessApi, investorApi, TOKEN_KEY } from '../lib/api';
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
    country?: string;
  }) => Promise<BusinessProfile>;
  registerInvestorProfile: (displayName: string) => Promise<void>;
  updateBusinessProfile: (data: Partial<BusinessProfile>) => Promise<BusinessProfile>;
  updateInvestorProfile: (displayName: string) => Promise<InvestorProfile>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const LOCAL_STORAGE_ROLE_KEY = 'flowfi_sbtc_user_role';
export const LOCAL_STORAGE_TOKEN_KEY = TOKEN_KEY;

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

      // 3. Prompt Wallet to sign message using stx_signMessage.
      // A rejection returns to pre-click state silently — never fake a signature.
      const signRes = await signStacksMessage(challenge.message);
      const signature = signRes.signature;
      if (!signature) throw new Error('Wallet did not return a signature');

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
        if (userProfile.role === 'BUSINESS' || userProfile.role === 'business') {
          setRole('BUSINESS');
        } else if (userProfile.role === 'INVESTOR' || userProfile.role === 'investor') {
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
    registrationNumber?: string;
    website?: string;
    description?: string;
    country?: string;
  }) => {
    setRole('BUSINESS');
    try {
      const biz = await businessApi.register(data);
      await refreshUserSession();
      setRole('BUSINESS');
      return biz;
    } catch (err: any) {
      // PROFILE_EXISTS / DUPLICATE_ENTRY -> fall back to update so Settings save never dead-ends
      const code = err?.code || err?.error?.code;
      if (code === 'PROFILE_EXISTS' || code === 'DUPLICATE_ENTRY' || err?.status === 409) {
        const updated = await businessApi.updateMe(data);
        await refreshUserSession();
        setRole('BUSINESS');
        return updated;
      }
      throw err;
    }
  };

  const registerInvestorProfile = async (displayName: string) => {
    setRole('INVESTOR');
    try {
      await investorApi.register(displayName);
    } catch (err: any) {
      const code = err?.code || err?.error?.code;
      if (code === 'PROFILE_EXISTS' || code === 'DUPLICATE_ENTRY' || err?.status === 409) {
        await investorApi.updateMe({ displayName });
      } else {
        throw err;
      }
    }
    await refreshUserSession();
    setRole('INVESTOR');
  };

  const updateBusinessProfile = async (data: Partial<BusinessProfile>) => {
    try {
      const updated = await businessApi.updateMe({
        companyName: data.companyName ?? undefined,
        registrationNumber: data.registrationNumber ?? undefined,
        website: data.website ?? undefined,
        description: data.description ?? undefined,
        country: (data as any).country ?? undefined,
      });
      await refreshUserSession();
      setRole('BUSINESS');
      return updated;
    } catch (err: any) {
      // If no profile exists yet (404), create it instead
      if (err?.code === 'NOT_FOUND' || err?.status === 404) {
        return registerBusinessProfile({
          companyName: data.companyName || 'Unnamed Business',
          registrationNumber: data.registrationNumber || undefined,
          website: data.website || undefined,
          description: data.description || undefined,
          country: (data as any).country || undefined,
        });
      }
      throw err;
    }
  };

  const updateInvestorProfile = async (displayName: string) => {
    try {
      const updated = await investorApi.updateMe({ displayName });
      await refreshUserSession();
      setRole('INVESTOR');
      return updated;
    } catch (err: any) {
      if (err?.code === 'NOT_FOUND' || err?.status === 404) {
        await registerInvestorProfile(displayName);
        // Re-fetch fresh profile after registration
        const fresh = await investorApi.getMe().catch(() => null);
        if (fresh) return fresh;
        throw err;
      }
      throw err;
    }
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
        updateBusinessProfile,
        updateInvestorProfile,
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
