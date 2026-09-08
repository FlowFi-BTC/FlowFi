import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';

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
 * Prompt Stacks wallet message signature
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
 * Execute contract call via Stacks Connect SDK
 */
export async function executeContractCall(params: {
  contract: string;
  functionName: string;
  functionArgs: any[];
  network?: 'mainnet' | 'testnet';
}): Promise<{ txid: string }> {
  const res: any = await (request as any)('stx_callContract', {
    contract: params.contract,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    network: params.network || 'testnet',
  });
  return { txid: res.txid };
}

/**
 * Wrapper for contract call compatible with FundingModal payload
 */
export async function triggerContractCall(payload: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}) {
  try {
    const fullContract = `${payload.contractAddress}.${payload.contractName}`;
    const res = await executeContractCall({
      contract: fullContract,
      functionName: payload.functionName,
      functionArgs: payload.functionArgs,
    });
    payload.onFinish?.({ txId: res.txid });
  } catch (err) {
    payload.onCancel?.();
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
    ? 'SN3VMHXEN64ZZF71JQ5VESXDWTR301XTTXGF4J8F1.sbtc-token::sbtc-token'
    : 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token';

  const response = await fetch(`${baseUrl}/extended/v1/address/${stxAddress}/balances`);
  const data = await response.json();

  const rawBalance = data.fungible_tokens?.[sbtcContractKey]?.balance || '0';
  
  // sBTC uses 8 decimals (1 sBTC = 100,000,000 satoshis)
  return Number(rawBalance) / 100_000_000;
}

