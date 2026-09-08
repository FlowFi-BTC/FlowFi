import { useState, useCallback } from 'react';
import type { Receivable, StatusEvent, ReceivableStatus } from '../types';

const INITIAL_RECEIVABLE: Receivable = {
  id: 'rec_112233',
  title: 'Invoice INV-2041 - Global Freight Services',
  description: 'Logistics services provided for cross-border freight from Lagos to Rotterdam',
  borrower: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  borrowerName: 'Apex Supply Chain Ltd',
  provider: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  providerName: 'Prudence Capital Vault',
  amount: 45000000,
  amountUsd: '45000',
  dueBlock: 148920,
  dueDateEstimated: 'Oct 20, 2026',
  dueDate: '2026-10-20T00:00:00.000Z',
  docHash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  status: 'OPEN_FOR_FUNDING',
  verificationStatus: 'VERIFIED',
  createdAt: '2026-09-01T10:00:00Z',
  invoiceNumber: 'INV-2041',
  counterparty: 'Global Freight Lines',
};

const INITIAL_STATUS_EVENTS: StatusEvent[] = [
  {
    id: 'evt-01',
    receivableId: 'rec_112233',
    status: 'PENDING_VERIFICATION',
    statusLabel: 'Registered',
    txHash: '0x4f128c4129b0a485918239019238410923841029384109238410923841092384',
    blockHeight: 147210,
    timestamp: '2026-09-01T10:15:22Z',
    actor: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM (Borrower)',
  },
  {
    id: 'evt-02',
    receivableId: 'rec_112233',
    status: 'VERIFIED',
    statusLabel: 'Verified',
    txHash: '0x88a104f981239041289301298301928301928301928301928301928301928301',
    blockHeight: 147285,
    timestamp: '2026-09-01T14:40:10Z',
    actor: 'Verifier Node SP3FBR...',
  },
];

export function useReceivable(initialId = 'rec_112233') {
  const [receivable, setReceivable] = useState<Receivable>({
    ...INITIAL_RECEIVABLE,
    id: String(initialId),
  });
  const [events, setEvents] = useState<StatusEvent[]>(INITIAL_STATUS_EVENTS);
  const [isProcessing, setIsProcessing] = useState(false);

  const fundReceivable = useCallback((providerAddress: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setReceivable((prev) => ({
        ...prev,
        status: 'FUNDED',
        provider: providerAddress,
        providerName: 'Prudence Capital Vault',
      }));

      const newEvent: StatusEvent = {
        id: `evt-${Date.now()}`,
        receivableId: initialId,
        status: 'FUNDED',
        statusLabel: 'Funded',
        txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
        blockHeight: 147285,
        timestamp: new Date().toISOString(),
        actor: providerAddress,
      };

      setEvents((prev) => [newEvent, ...prev]);
      setIsProcessing(false);
    }, 800);
  }, [initialId]);

  const markRepaid = useCallback((actorAddress: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setReceivable((prev) => ({
        ...prev,
        status: 'REPAID',
      }));

      const newEvent: StatusEvent = {
        id: `evt-${Date.now()}`,
        receivableId: initialId,
        status: 'REPAID',
        statusLabel: 'Repaid',
        txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
        blockHeight: 147510,
        timestamp: new Date().toISOString(),
        actor: actorAddress,
      };

      setEvents((prev) => [newEvent, ...prev]);
      setIsProcessing(false);
    }, 800);
  }, [initialId]);

  const markDefaulted = useCallback((actorAddress: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setReceivable((prev) => ({
        ...prev,
        status: 'DEFAULTED',
      }));

      const newEvent: StatusEvent = {
        id: `evt-${Date.now()}`,
        receivableId: initialId,
        status: 'DEFAULTED',
        statusLabel: 'Defaulted',
        txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
        blockHeight: 148950,
        timestamp: new Date().toISOString(),
        actor: actorAddress,
      };

      setEvents((prev) => [newEvent, ...prev]);
      setIsProcessing(false);
    }, 800);
  }, [initialId]);

  const resetStatus = useCallback((status: ReceivableStatus = 'OPEN_FOR_FUNDING') => {
    setReceivable((prev) => ({
      ...prev,
      status,
      provider: status === 'OPEN_FOR_FUNDING' ? null : prev.provider,
    }));
  }, []);

  return {
    receivable,
    events,
    isProcessing,
    fundReceivable,
    markRepaid,
    markDefaulted,
    resetStatus,
  };
}
