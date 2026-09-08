import { useUser } from '../context/UserContext';

export function useWallet() {
  const {
    wallet,
    user,
    token,
    role,
    setRole,
    isLoading,
    connectWallet,
    disconnectWallet,
    refreshUserSession,
    selectRoleOnboarding,
    registerBusinessProfile,
    registerInvestorProfile,
  } = useUser();

  return {
    wallet,
    user,
    token,
    role,
    setRole,
    isLoading,
    connect: connectWallet,
    disconnect: disconnectWallet,
    refreshUserSession,
    selectRoleOnboarding,
    registerBusinessProfile,
    registerInvestorProfile,
  };
}
