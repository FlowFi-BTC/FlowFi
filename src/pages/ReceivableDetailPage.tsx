import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { receivablesApi, fundingApi, escrowApi } from '../lib/api';
import type { Receivable, OnchainReceivableState, Escrow } from '../types/api';
import { VerificationNoteModal } from '../components/modular/receivable/VerificationNoteModal';
import { FundingModal } from '../components/modular/receivable/FundingModal';
import { StatusHistoryTimeline } from '../components/modular/receivable/StatusHistoryTimeline';
import { OnchainStatusBadge } from '../components/modular/receivable/OnchainStatusBadge';
import { useOnchainAction, phaseLabel } from '../hooks/useOnchainAction';
import { friendlyErrorMessage, explorerTxUrl } from '../lib/errors';
import { ScaleLoader } from 'react-spinners';


const RailStar = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" className={className}>
    <path
      d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
      fill="#a8ff3e"
      stroke="black"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const ReceivableDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role, wallet, user } = useUser();
  const normalizedRole = ((role as string) || '').toUpperCase();
  const isBusiness = normalizedRole === 'BUSINESS';
  const isInvestor = normalizedRole === 'INVESTOR';
  const isConnected = wallet.isConnected && !!user;

  const [receivable, setReceivable] = useState<Receivable | null>(null);
  const [onchain, setOnchain] = useState<OnchainReceivableState | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const registerAction = useOnchainAction();
  const repayAction = useOnchainAction();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [recDetails, onchainState, recActivity] = await Promise.all([
        receivablesApi.getDetails(id).catch(() => null),
        receivablesApi.getOnchain(id).catch(() => null),
        receivablesApi.getActivity(id).catch(() => ({ items: [] })),
      ]);
      if (recDetails) {
        setReceivable(recDetails);
        // Escrow view for funded receivables (read-only for investor tracking #37)
        const fundingId = (recDetails.funding as any)?.id;
        if (fundingId) {
          escrowApi.getById(fundingId).then(setEscrow).catch(() => setEscrow(null));
        } else {
          setEscrow(null);
        }
      }
      if (onchainState) setOnchain(onchainState);
      setActivity(Array.isArray((recActivity as any)?.items) ? (recActivity as any).items : []);
    } catch (err) {
      console.error('Failed to load receivable details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner =
    isBusiness &&
    !!user?.businessProfile &&
    !!receivable?.business &&
    user.businessProfile.id === (receivable.business as any).id;

  const handleRegisterOnchain = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await registerAction.run({
        prepare: (key) => receivablesApi.prepareRegister(id, key),
        confirm: (prepared, txHash, key) =>
          receivablesApi.confirmRegister(
            id,
            { txHash, operationId: (prepared as any).operationId },
            key,
          ),
        onDone: () => load(),
      });
    } catch (err: any) {
      setActionError(friendlyErrorMessage(err));
    }
  };

  const handleRepay = async () => {
    const fundingId = (receivable?.funding as any)?.id;
    if (!fundingId) return;
    setActionError(null);
    try {
      await repayAction.run({
        prepare: (key) => fundingApi.prepareRepayment(fundingId, key),
        confirm: (prepared: any, txHash, key) => {
          if (prepared && prepared.readyToRepay === false) {
            throw { code: 'FUNDING_NOT_CONFIRMED', message: prepared.warning || 'Waiting on release' };
          }
          return fundingApi.confirmRepayment(fundingId, { txHash, operationId: prepared.operationId }, key);
        },
        onDone: () => load(),
      });
    } catch (err: any) {
      setActionError(friendlyErrorMessage(err));
    }
  };

  const handleDocRetry = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    setActionError(null);
    try {
      await receivablesApi.uploadDocument(id, file);
      await load();
    } catch (err: any) {
      setActionError(friendlyErrorMessage(err, 'Document upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const eventsForTimeline = activity.map((act) => ({
    id: act.id,
    receivableId: id || 'rec_1',
    status: act.type,
    statusLabel: act.type,
    txHash: act.txHash,
    blockHeight: act.blockHeight || 142100,
    timestamp: act.createdAt,
    actor: (act.metadata as any)?.actor || 'Verifier Node / Wallet Principal',
  }));

  if (loading || !receivable) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
        <div className="mx-auto neo-border-thick bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center text-xs font-bold text-gray-500 animate-pulse space-y-2">
                <div className="text-xl inline-block">

<ScaleLoader color="#000000" speedMultiplier={0.9} /></div>
          <div>Loading</div>
        </div>
      </div>
    );
  }

  const verificationDetails = (receivable as any).verification?.details || null;
  const docs = receivable.documents || [];
  const primaryHash = docs[0]?.sha256 || (receivable as any).docHash || '';
  const canRegister = isOwner && receivable.status === 'VERIFIED';
  const canFund = isInvestor && receivable.status === 'OPEN_FOR_FUNDING' && !isOwner;
  const canRepay = isOwner && receivable.status === 'FUNDED';
  const repayBlockedByRelease = canRepay && escrow && escrow.released === false;
  const registerBusyLabel = phaseLabel(registerAction.phase);
  const repayBusyLabel = phaseLabel(repayAction.phase);

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 sm:py-8 font-syne">
      <div className="mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <Link to="/dashboard" className="hover:text-black hover:underline">Overview</Link>
          <span>/</span>
          <Link to="/receivable" className="hover:text-black hover:underline">Receivables Explorer</Link>
          <span>/</span>
          <span className="text-[#6B46C1] font-bold">{receivable.title}</span>
        </div>

        {/* Title Banner */}
        <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <RailStar className="absolute top-5 right-6 h-6 w-6 rotate-12" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-syne text-[1.6rem] font-medium leading-tight text-black">
                {receivable.title}
              </h1>
              <OnchainStatusBadge
                dbStatus={receivable.status}
                onchainStatus={onchain?.registry?.status}
                registered={onchain?.registry?.registered}
              />
            </div>
            <p className="text-[13px] text-gray-600 mt-2">
              ID: <span className="font-mono text-black">{receivable.id}</span> • Invoice Ref:{' '}
              <span className="text-black font-bold">{receivable.invoiceNumber || '—'}</span> • Business:{' '}
              <span className="text-black font-bold">{receivable.businessName || receivable.business?.companyName || 'Business Owner'}</span>
            </p>
            {onchain?.registry?.registerTxHash && (
              <p className="text-[11px] text-gray-500 mt-1">
                On-chain:{' '}
                <a
                  className="text-[#6B46C1] underline font-mono"
                  href={explorerTxUrl(onchain.registry.registerTxHash) || '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  {onchain.registry.registerTxHash.substring(0, 18)}…
                </a>{' '}
                {typeof onchain.registry.onchainReceivableId === 'number' && (
                  <span>• uint #{onchain.registry.onchainReceivableId}</span>
                )}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsVerificationModalOpen(true)}
            className="relative z-10 shrink-0 neo-border bg-[#f7f7f7] hover:bg-white px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 self-start md:self-auto"
          >
            🔍 View Verification Note & Hash
          </button>
        </div>

        {actionError && (
          <div className="neo-border-thick bg-[#ffb6b9] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-bold text-black flex items-center justify-between gap-3">
            <span>⚠️ {actionError}</span>
            <button onClick={() => setActionError(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#a8ff3e' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black">
              ${typeof receivable.amountUsd === 'number' ? (receivable.amountUsd as number).toLocaleString() : receivable.amountUsd}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">Valuation Amount</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
              {escrow ? `${escrow.amountSbtc} sBTC escrowed` : 'sBTC target set at registration'}
            </div>
          </div>

          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#22d3ee' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black">
              {receivable.dueDate ? new Date(receivable.dueDate).toLocaleDateString() : 'N/A'}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">Due Date Target</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">Verification: {receivable.verificationStatus || 'VERIFIED'}</div>
          </div>

          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#fef08a' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black truncate">
              {receivable.business?.companyName || receivable.businessName || 'Business'}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">Borrower Principal</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
              Reg: {receivable.business?.registrationNumber || '—'}
            </div>
          </div>

          <div className="neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-9 w-9 items-center justify-center neo-border" style={{ backgroundColor: '#c4b5fd' }}>
              <RailStar className="h-4 w-4" />
            </div>
            <div className="font-syne text-2xl sm:text-3xl font-medium text-black">
              {receivable.funding ? `${receivable.funding.amountSbtc} sBTC` : 'Unfunded'}
            </div>
            <div className="mt-1 text-[13px] font-medium text-gray-600">sBTC Funding Status</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
              {receivable.funding
                ? `Tx: ${receivable.funding.fundTxHash.substring(0, 12)}...`
                : receivable.status === 'OPEN_FOR_FUNDING'
                ? 'Open for sBTC Funding'
                : receivable.documentStatus === 'NONE'
                ? 'Awaiting invoice upload'
                : receivable.status}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {receivable.description && (
              <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <h2 className="font-syne text-[1.1rem] font-medium text-black border-b-2 border-black pb-3">
                  Receivable Description
                </h2>
                <p className="text-black font-medium text-sm leading-relaxed pt-2">{receivable.description}</p>
                {receivable.debtor && (
                  <div className="pt-2 text-[12px] text-gray-600">
                    Debtor: <span className="text-black font-bold">{receivable.debtor.companyName}</span>
                    {receivable.debtor.country ? ` • ${receivable.debtor.country}` : ' • country missing — fix before registration'}
                  </div>
                )}
              </div>
            )}

            {/* Missing-evidence helper (DOCUMENT_REQUIRED inline fix) */}
            {receivable.documentStatus === 'NONE' && isOwner && (
              <div className="neo-border-thick bg-[#fef08a] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <div className="font-bold text-sm text-black">Invoice evidence missing — registration is blocked</div>
                <p className="text-xs text-black">Upload the invoice PDF/image. Only its SHA-256 goes on-chain.</p>
                <label className="inline-block cursor-pointer neo-border bg-white px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {uploading ? 'Uploading…' : 'Upload invoice file'}
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleDocRetry} disabled={uploading} />
                </label>
              </div>
            )}

            {/* Status History */}
            <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <StatusHistoryTimeline events={eventsForTimeline} />
            </div>
          </div>

          {/* Right Col: Contract Operations */}
          <div className="space-y-6">
            <div className="neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="border-b-2 border-black pb-3">
                <h2 className="font-syne text-[1.1rem] font-medium text-black">Contract Operations</h2>
                <p className="text-[13px] text-gray-600">API & Stacks Contract Call</p>
              </div>

              <div className="space-y-3 pt-2">
                {!isConnected && (
                  <Link
                    to="/get-started"
                    className="block text-center w-full neo-border bg-[#f7f7f7] py-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                  >
                    Connect Wallet to Continue
                  </Link>
                )}

                {isConnected && isOwner && (receivable.status === 'DRAFT' || (receivable.status as string) === 'PENDING_VERIFICATION') && (
                  <Link
                    to="/dashboard/receivables"
                    className="block text-center w-full neo-border bg-white py-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                  >
                    Continue in Dashboard
                  </Link>
                )}

                {canRegister && (
                  <button
                    type="button"
                    disabled={registerAction.isBusy}
                    onClick={handleRegisterOnchain}
                    className="w-full neo-border bg-[#22d3ee] py-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-50"
                  >
                    {registerBusyLabel || '⛓ Register On-Chain'}
                  </button>
                )}

                {canFund && (
                  <button
                    type="button"
                    onClick={() => setIsFundingModalOpen(true)}
                    className="w-full neo-border bg-[#a8ff3e] py-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1"
                  >
                    ⚡ Fund with sBTC
                  </button>
                )}

                {isConnected && isOwner && receivable.status === 'OPEN_FOR_FUNDING' && (
                  <Link
                    to="/dashboard/receivables"
                    className="block text-center w-full neo-border bg-white py-2.5 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                  >
                    View in Dashboard
                  </Link>
                )}

                {canRepay && (
                  <>
                    <button
                      type="button"
                      disabled={repayAction.isBusy || !!repayBlockedByRelease}
                      onClick={handleRepay}
                      title={repayBlockedByRelease ? 'Waiting on admin release (escrow → business) before repayment' : undefined}
                      className="w-full neo-border bg-[#a8ff3e] py-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-50"
                    >
                      {repayBusyLabel || (repayBlockedByRelease ? '⏳ Waiting on release…' : '✓ Repay sBTC Receivable')}
                    </button>
                    {repayBlockedByRelease && (
                      <p className="text-[11px] text-gray-600">
                        Repayment unlocks after the admin release confirms (repay-receivable reverts u208 otherwise).
                      </p>
                    )}
                    {escrow?.repaymentTxHash == null && escrow?.released && (
                      <p className="text-[11px] text-gray-600">Released ✓ — ready to repay the flat funding amount.</p>
                    )}
                  </>
                )}

                {/* Release + default are admin-surface actions — never rendered as business buttons */}
                {(receivable.status === 'FUNDED' || receivable.status === 'DEFAULTED') && (
                  <p className="text-[11px] text-gray-500 border-t border-black/10 pt-3">
                    Release & default are admin operations — see the <Link to="/admin" className="text-[#6B46C1] underline">admin surface</Link>.
                  </p>
                )}

                {receivable.status === 'REPAID' && (
                  <div className="neo-border bg-[#a8ff3e] p-4 text-center font-bold text-xs text-black">
                    RECEIVABLE FULLY REPAID & SETTLED
                  </div>
                )}
                {receivable.status === 'DEFAULTED' && (
                  <div className="neo-border bg-[#ffb6b9] p-4 text-center font-bold text-xs text-black">
                    RECEIVABLE DEFAULTED — recorded off-chain (pending on-chain wiring)
                  </div>
                )}
              </div>
            </div>

            {escrow && (
              <div className="neo-border-thick bg-[#f7f7f7] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-2 text-[12px]">
                <div className="font-bold text-black border-b border-black/10 pb-2">Escrow snapshot</div>
                <div className="flex justify-between"><span className="text-gray-500">Released</span><span className="font-bold text-black">{escrow.released ? '✓ yes' : '— not yet'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Funder</span><span className="font-mono text-black truncate max-w-[160px]">{escrow.funder}</span></div>
                <Link to={`/investor/fundings/${escrow.fundingId}`} className="text-[#6B46C1] underline font-bold">
                  View funding status →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Verification Note Modal — real business verification + doc hashes */}
        <VerificationNoteModal
          note={{
            receivableId: receivable.id,
            docHash: primaryHash || 'pending-upload',
            reviewedBy: verificationDetails ? `Verifier (${verificationDetails.method})` : (receivable.business?.companyName || 'Business verification'),
            reviewedAt: verificationDetails?.verifiedAt || receivable.createdAt,
            attestationText: verificationDetails?.notes || 'Business-level verification. Verified Business + Invoice Evidence + On-chain Registration = fundable.',
            disclaimer: 'Business-level, one-time verification. This modal shows the business verification, not a per-receivable check.',
            verified: receivable.verificationStatus === 'VERIFIED',
            documents: docs.length
              ? docs.map((d) => ({ name: d.filename, type: d.mimeType, hash: d.sha256 }))
              : [{ name: `Invoice_${receivable.invoiceNumber || receivable.id}.pdf`, type: 'pending', hash: primaryHash || 'upload-required' }],
          }}
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
        />

        {/* Funding Modal */}
        <FundingModal
          receivable={receivable}
          isOpen={isFundingModalOpen}
          onClose={() => setIsFundingModalOpen(false)}
          onConfirmFund={load}
        />
      </div>
    </div>
  );
};
