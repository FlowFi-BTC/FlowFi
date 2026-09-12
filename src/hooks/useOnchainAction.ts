import { useState, useCallback } from 'react';
import { newIdempotencyKey, transactionsApi } from '../lib/api';
import { signAndBroadcastPrepare } from '../lib/stacks';
import { friendlyErrorMessage } from '../lib/errors';
import type { StacksTransactionPayload } from '../types/api';

interface OnchainActionState {
  phase: 'idle' | 'preparing' | 'signing' | 'confirming' | 'polling' | 'done' | 'error';
  txHash: string | null;
  error: string | null;
}

/**
 * Universal money-moving pattern (§2 + BUTTON_TO_CONTRACT_MAP):
 *   prepare (Idempotency-Key) → wallet signs → confirm {txHash, operationId}
 *   → CONFIRMING → poll GET /transactions/:txHash until CONFIRMED.
 * Wallet cancel returns to idle silently with NO confirm call.
 */
export function useOnchainAction() {
  const [state, setState] = useState<OnchainActionState>({ phase: 'idle', txHash: null, error: null });

  const reset = useCallback(() => setState({ phase: 'idle', txHash: null, error: null }), []);

  const run = useCallback(
    async <P, C>(opts: {
      prepare: (key: string) => Promise<P & { operationId?: string; transaction: StacksTransactionPayload }>;
      confirm: (prepared: P, txHash: string, key: string) => Promise<C>;
      onDone?: (confirmed: C, txHash: string) => void | Promise<void>;
    }): Promise<C | null> => {
      const key = newIdempotencyKey();
      setState({ phase: 'preparing', txHash: null, error: null });
      try {
        const prepared = await opts.prepare(key);
        setState({ phase: 'signing', txHash: null, error: null });
        let txHash: string;
        try {
          txHash = await signAndBroadcastPrepare(prepared.transaction);
        } catch (signErr) {
          // user cancelled signing — silent return, no /confirm call made
          setState({ phase: 'idle', txHash: null, error: null });
          return null;
        }
        setState({ phase: 'confirming', txHash, error: null });
        const confirmed = await opts.confirm(prepared, txHash, key);
        setState({ phase: 'polling', txHash, error: null });
        try {
          await transactionsApi.pollTransaction(txHash);
        } catch (pollErr) {
          // polling timeout/failure surfaces but confirm already recorded the broadcast
          console.warn('Confirmation polling note:', pollErr);
        }
        setState({ phase: 'done', txHash, error: null });
        if (opts.onDone) await opts.onDone(confirmed, txHash);
        return confirmed;
      } catch (err: any) {
        // 422 IDEMPOTENCY_KEY_REUSE → fresh key retry is handled by generating per-intent keys;
        // surface a friendly message and stay recoverable.
        setState({ phase: 'idle', txHash: null, error: friendlyErrorMessage(err) });
        throw err;
      }
    },
    [],
  );

  return { ...state, run, reset, isBusy: state.phase !== 'idle' && state.phase !== 'done' && state.phase !== 'error' };
}

export function phaseLabel(phase: OnchainActionState['phase']): string | null {
  switch (phase) {
    case 'preparing':
      return 'Preparing transaction…';
    case 'signing':
      return 'Waiting for wallet signature…';
    case 'confirming':
      return 'Recording broadcast…';
    case 'polling':
      return 'Confirming on-chain…';
    default:
      return null;
  }
}
