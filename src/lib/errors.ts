// Friendly mapping for backend error codes (§1) + contract revert codes (map doc §8).
// Never show raw codes like u205 to end users.

const CODE_MESSAGES: Record<string, string> = {
  // request / lifecycle
  INVALID_CHALLENGE: 'This login challenge expired. Reconnect your wallet to get a fresh one.',
  INVALID_STATUS: 'This item is not in the right state for that action. Refresh to see its current status.',
  INVALID_OPERATION: 'This transaction intent expired. Start the action again to get a fresh operation.',
  ALREADY_REGISTERED: 'Already registered on-chain. Refresh the on-chain status badge.',
  BUSINESS_NOT_ONCHAIN: 'Register the business on-chain first, then register this receivable.',
  RECEIVABLE_NOT_REGISTERED: 'Register this receivable on-chain first.',
  RECEIVABLE_NOT_OPEN: 'Only receivables marked Open for Funding can be funded right now.',
  DEBTOR_REQUIRED: 'Add the debtor company name first (Edit receivable), then retry.',
  DEBTOR_COUNTRY_REQUIRED: 'Add the debtor country as a 2-letter code (e.g. NG), then retry.',
  INVOICE_NUMBER_REQUIRED: 'Add the invoice number first (Edit receivable), then retry.',
  DOCUMENT_REQUIRED: 'Upload the invoice document first — its SHA-256 goes on-chain.',
  DUE_DATE_NOT_FUTURE: 'The due date must be in the future. Fix it via Edit receivable.',
  COUNTRY_REQUIRED: 'Add your 2-letter business country in Settings, then retry.',
  INVALID_ASCII: 'Names and invoice numbers accept printable ASCII only (no accents/emoji).',
  FUNDING_AMOUNT_MISMATCH: 'That amount differs from the registered funding target — the prepared amount shown is the truth.',
  FUNDING_NOT_CONFIRMED: 'Funds are not escrowed yet. Wait for confirmation, then retry.',
  UNAUTHORIZED: 'Your session expired. Reconnect your wallet to continue.',
  FORBIDDEN: 'Your wallet is not allowed to do that with its current role.',
  BUSINESS_NOT_VERIFIED: 'Complete business verification first, then retry.',
  BUSINESS_PROFILE_REQUIRED: 'Create your business profile first.',
  VERIFIER_FORBIDDEN: 'That step needs a verifier/admin wallet session — a business wallet cannot do it.',
  VERIFIER_NOT_CONFIGURED: 'On-chain attestation is disabled (no verifier wallets configured).',
  NOT_FOUND: 'That item was not found. It may have been removed.',
  DUPLICATE_ENTRY: 'Already exists — loading the existing record instead.',
  PROFILE_EXISTS: 'Profile already exists — updating it instead of creating a duplicate.',
  ALREADY_FUNDED: 'Already funded. Refresh to see the current escrow state.',
  FILE_TOO_LARGE: 'That file exceeds the 10 MB upload limit.',
  VALIDATION_ERROR: 'Some fields need attention — check the highlighted inputs.',
  IDEMPOTENCY_KEY_REUSE: 'Retried with a changed payload. A fresh attempt was started automatically.',
  UNSUPPORTED_FILE_TYPE: 'Upload a PDF, JPEG, PNG or WebP invoice file.',
  INTERNAL_SERVER_ERROR: 'Something went wrong preparing this transaction — no funds were moved. Try again.',
  NETWORK_ERROR: 'Unable to reach the FlowFi API server. Check it is running on :4000.',
  // contract reverts (defense-in-depth — prepare usually pre-empts these)
  u100: 'Only a verifier wallet can attest a business — the business cannot verify itself.',
  u102: 'This wallet already registered a business on-chain.',
  u105: 'Only the owning business wallet can register this receivable.',
  u106: 'The business must be verified before registering receivables.',
  u200: 'Only the escrow admin wallet can release funds.',
  u202: 'Wrong sBTC token contract for this network.',
  u203: 'Receivable is not open for funding on-chain.',
  u204: 'Receivable already funded on-chain.',
  u205: "You can't fund your own receivable — use a different investor wallet.",
  u206: 'Receivable is not funded on-chain yet.',
  u207: 'Funds were already released for this escrow.',
  u208: 'Funds must be released to the business before repayment.',
  u209: 'Only the business wallet that owns this receivable can repay it.',
};

export function friendlyErrorMessage(err: any, fallback = 'Something went wrong. No funds were moved. Try again.'): string {
  if (!err) return fallback;
  if (typeof err === 'string') {
    for (const [code, msg] of Object.entries(CODE_MESSAGES)) {
      if (err.includes(code)) return msg;
    }
    return err;
  }
  const code = err?.code as string | undefined;
  const message = (err?.message as string | undefined) || '';
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  for (const [c, msg] of Object.entries(CODE_MESSAGES)) {
    if (message.includes(c)) return msg;
  }
  return message || fallback;
}

export function isOffchainPlaceholderTx(txHash: string | null | undefined): boolean {
  // #15 default txHash (def_tx_…) is an off-chain placeholder — never link to explorer.
  if (!txHash) return true;
  return txHash.startsWith('def_tx_');
}

export function explorerTxUrl(txHash: string | null | undefined, network: 'mainnet' | 'testnet' = 'testnet'): string | null {
  if (!txHash || isOffchainPlaceholderTx(txHash)) return null;
  return `https://explorer.hiro.so/txid/${txHash}?chain=${network}`;
}
