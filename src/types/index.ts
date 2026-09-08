export * from './api';

export type Page = 'Overview' | 'Protocols' | 'Cascade Risk' | 'Liquidity' | 'API Docs';

export type LegacyReceivableStatus = 0 | 1 | 2 | 3;
// 0: Registered, 1: Funded, 2: Repaid, 3: Defaulted

export interface VerificationNote {
  receivableId: number | string;
  docHash: string;
  reviewedBy: string;
  reviewedAt: string;
  attestationText: string;
  disclaimer: string;
  verified: boolean;
  documents: {
    name: string;
    type: string;
    hash: string;
  }[];
}

export interface StatusEvent {
  id: string;
  receivableId: number | string;
  status: any;
  statusLabel: string;
  txHash: string;
  blockHeight: number;
  timestamp: string;
  actor: string;
}

export interface ProtocolInfo {
  name: string;
  type: string;
  color: string;
  tvl: string;
  apy: string;
  status: 'Healthy' | 'Caution' | 'Optimal';
  riskScore: string;
  description: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: 'testnet' | 'mainnet';
  sbtcBalance: number;
  stxBalance: number;
}
