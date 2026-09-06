import { useState, useCallback } from 'react';
import type { Receivable, StatusEvent, ReceivableStatus } from '../types';
import { MOCK_RECEIVABLE, MOCK_STATUS_EVENTS } from '../data/mockData';

export function useReceivable(initialId = 1) {
  const [receivable, setReceivable] = useState<Receivable>(MOCK_RECEIVABLE);
  const [events, setEvents] = useState<StatusEvent[]>(MOCK_STATUS_EVENTS);
  const [isProcessing, setIsProcessing] = useState(false);

  const fundReceivable = useCallback((providerAddress: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setReceivable((prev) => ({
        ...prev,
        status: 1,
        provider: providerAddress,
        providerName: 'Apex Capital sBTC Reserve',
      }));

      const newEvent: StatusEvent = {
        id: `evt-${Date.now()}`,
        receivableId: initialId,
        status: 1,
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
        status: 2,
      }));

      const newEvent: StatusEvent = {
        id: `evt-${Date.now()}`,
        receivableId: initialId,
        status: 2,
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
        status: 3,
      }));

      const newEvent: StatusEvent = {
        id: `evt-${Date.now()}`,
        receivableId: initialId,
        status: 3,
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

  const resetStatus = useCallback((status: ReceivableStatus = 0) => {
    setReceivable((prev) => ({
      ...prev,
      status,
      provider: status === 0 ? null : prev.provider,
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
