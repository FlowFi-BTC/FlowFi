import type { Receivable, VerificationNote, StatusEvent, ProtocolInfo } from '../types';

// Pilot Receivable #1 matching sbtc-capital-rail-full-plan.md & v2 developer plan
export const MOCK_RECEIVABLE: Receivable = {
  id: 1,
  borrower: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  borrowerName: 'Verified Global Logistics Inc. (Counterparty #1)',
  provider: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  providerName: 'Apex Capital sBTC Reserve',
  amount: 250000000, // 2.50 sBTC micro-units
  amountUsd: 162500, // $162,500 at $65,000 / BTC
  dueBlock: 148920,
  dueDateEstimated: 'Oct 14, 2026',
  docHash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  status: 1, // Funded
  createdAt: '2026-09-01T10:00:00Z',
  invoiceNumber: 'INV-2026-8841',
  counterparty: 'Maersk Freight Lines Americas',
};

export const MOCK_VERIFICATION_NOTE: VerificationNote = {
  receivableId: 1,
  docHash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  reviewedBy: 'Independent Trade Verifier (Compliance Node #04)',
  reviewedAt: '2026-09-01T08:30:00Z',
  attestationText:
    'This confirms the invoice was reviewed by TradeVerify Node #04. Verification covers invoice validity, bill of lading confirmation, and counterparty credit rating check. It does not guarantee repayment.',
  disclaimer:
    'Settlement infrastructure connecting sBTC capital to verified real-world receivables. On-chain record created via Stacks testnet Clarity contract.',
  verified: true,
  documents: [
    {
      name: 'Invoice_INV-2026-8841.pdf',
      type: 'Commercial Invoice',
      hash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    },
    {
      name: 'BillOfLading_BL-99214.pdf',
      type: 'Shipping Document',
      hash: '0x3a41b59012389d41209b55f19023488219034812398410293841092384019238',
    },
  ],
};

export const MOCK_STATUS_EVENTS: StatusEvent[] = [
  {
    id: 'evt-01',
    receivableId: 1,
    status: 0,
    statusLabel: 'Registered',
    txHash: '0x4f128c4129b0a485918239019238410923841029384109238410923841092384',
    blockHeight: 147210,
    timestamp: '2026-09-01T10:15:22Z',
    actor: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM (Borrower)',
  },
  {
    id: 'evt-02',
    receivableId: 1,
    status: 1,
    statusLabel: 'Funded',
    txHash: '0x88a104f981239041289301298301928301928301928301928301928301928301',
    blockHeight: 147285,
    timestamp: '2026-09-01T14:40:10Z',
    actor: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG (Capital Provider)',
  },
];

export const TRACKED_PROTOCOLS: ProtocolInfo[] = [
  {
    name: 'Zest Protocol',
    type: 'Lending',
    color: 'text-emerald-400',
    tvl: '425.8 sBTC',
    apy: '6.4%',
    status: 'Healthy',
    riskScore: 'Low (0.12)',
    description: 'Bitcoin-backed lending market on Stacks using sBTC collateral rails.',
  },
  {
    name: 'SSE Engine',
    type: 'CDP Vault',
    color: 'text-blue-400',
    tvl: '180.2 sBTC',
    apy: '5.8%',
    status: 'Optimal',
    riskScore: 'Low (0.18)',
    description: 'Single-sided exposure engine for structured credit and collateralized positions.',
  },
  {
    name: 'Granite',
    type: 'Lending',
    color: 'text-amber-400',
    tvl: '95.4 sBTC',
    apy: '7.2%',
    status: 'Caution',
    riskScore: 'Medium (0.34)',
    description: 'Institutional credit facility with automated LTV monitoring.',
  },
  {
    name: 'Bitflow / ALEX',
    type: 'DEX AMM',
    color: 'text-purple-400',
    tvl: '612.0 sBTC',
    apy: '9.1%',
    status: 'Healthy',
    riskScore: 'Low (0.22)',
    description: 'DeFi automated market maker and liquidity pools for sBTC pairs.',
  },
];
