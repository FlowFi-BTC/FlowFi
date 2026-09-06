import { useState, useCallback } from 'react';
import type { WalletState } from '../types';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    network: 'testnet',
    sbtcBalance: 12.5,
    stxBalance: 1450.0,
  });

  const connect = useCallback((address = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG') => {
    setWallet({
      isConnected: true,
      address,
      network: 'testnet',
      sbtcBalance: 12.5,
      stxBalance: 1450.0,
    });
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      isConnected: false,
      address: null,
      network: 'testnet',
      sbtcBalance: 0,
      stxBalance: 0,
    });
  }, []);

  return {
    wallet,
    connect,
    disconnect,
  };
}
