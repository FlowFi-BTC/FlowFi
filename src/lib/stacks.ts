import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';
import type { StacksTransactionPayload } from '../types/api';

export { connect, disconnect, isConnected, getLocalStorage, request };

/**
 * Prompt Stacks Wallet Connection Modal (Leather, Xverse, etc.)
 * Returns connected STX wallet address string or throws error if cancelled/failed.
 */
export async function connectStacksWallet(): Promise<string> {
  const res = await connect({ forceWalletSelect: true });

  if (res && (res as any).addresses?.stx?.[0]?.address) {
    return (res as any).addresses.stx[0].address;
  }

  const localData = getLocalStorage();
  if (localData?.addresses?.stx?.[0]?.address) {
    return localData.addresses.stx[0].address;
  }

  try {
    const addressRes: any = await request('stx_getAddresses');
    if (addressRes?.addresses?.[0]?.address) {
      return addressRes.addresses[0].address;
    }
  } catch (err) {
    console.warn('stx_getAddresses fallback error:', err);
  }

  throw new Error('No Stacks address returned from wallet modal');
}

/**
 * Get current connected Stacks wallet address from local storage session
 */
export function getConnectedStacksAddress(): string | null {
  if (!isConnected()) return null;
  const localData = getLocalStorage();
  return localData?.addresses?.stx?.[0]?.address || null;
}

/**
 * Prompt Stacks wallet message signature (auth challenge — §3).
 * Throws when the user rejects; callers must NOT fall back to a fake signature.
 */
export async function signStacksMessage(messageToSign: string): Promise<{ signature: string; publicKey?: string }> {
  const res: any = await request('stx_signMessage', {
    message: messageToSign,
  });
  return {
    signature: res.signature,
    publicKey: res.publicKey,
  };
}

/**
 * Execute a contract call from a backend prepare payload (prepare endpoint).
 * functionArgs are already Clarity-value-encoded strings ("uint:1", "buff:0x…")
 * — pass them straight through, never re-encode.
 */
export async function executeContractCall(params: {
  contract: string;
  functionName: string;
  functionArgs: any[];
  network?: 'mainnet' | 'testnet';
  postConditionMode?: 'deny' | 'allow';
}): Promise<{ txid: string }> {
  const res: any = await (request as any)('stx_callContract', {
    contract: params.contract,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    network: params.network || 'testnet',
    postConditionMode: params.postConditionMode || 'deny',
  });
  return { txid: res.txid };
}

/**
 * Sign + broadcast a backend prepare payload, resolving with the txHash.
 * Rejects on user cancel — callers must return to pre-click state silently
 * and must NOT call the matching confirm endpoint in that case.
 */
export async function signAndBroadcastPrepare(tx: StacksTransactionPayload): Promise<string> {
  const fullContract = `${tx.contractAddress}.${tx.contractName}`;
  const args = tx.functionArgs ?? (tx as any).arguments ?? [];
  const { txid } = await executeContractCall({
    contract: fullContract,
    functionName: tx.functionName,
    functionArgs: args,
    network: tx.network || 'testnet',
    postConditionMode: tx.postConditionMode || 'deny',
  });
  if (!txid) throw new Error('Wallet did not return a transaction id');
  return txid;
}

/**
 * Wrapper for contract call compatible with FundingModal payload.
 * onCancel fires WITHOUT a txHash — do not confirm in that branch.
 */
export async function triggerContractCall(payload: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  network?: 'mainnet' | 'testnet';
  postConditionMode?: 'deny' | 'allow';
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}) {
  try {
    const fullContract = `${payload.contractAddress}.${payload.contractName}`;
    const res = await executeContractCall({
      contract: fullContract,
      functionName: payload.functionName,
      functionArgs: payload.functionArgs,
      network: payload.network || 'testnet',
      postConditionMode: payload.postConditionMode || 'deny',
    });
    payload.onFinish?.({ txId: res.txid });
  } catch (err) {
    payload.onCancel?.();
    throw err;
  }
}

/**
 * Fetch sBTC balance for a given Stacks address from Hiro API
 */
export async function getSbtcBalance(stxAddress: string, isTestnet: boolean = false): Promise<number> {
  const baseUrl = isTestnet
    ? 'https://api.testnet.hiro.so'
    : 'https://api.hiro.so';

  const sbtcContractKey = isTestnet
    ? 'ST1WNVWY7WCJESTHM050RAMRRE44KJTKZKJCSRFCQ.mock-sbtc-token::mock-sbtc'
    : 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token';

  const response = await fetch(`${baseUrl}/extended/v1/address/${stxAddress}/balances`);
  const data = await response.json();

  const rawBalance = data.fungible_tokens?.[sbtcContractKey]?.balance || '0';

  // sBTC uses 8 decimals (1 sBTC = 100,000,000 satoshis)
  return Number(rawBalance) / 100_000_000;
}
