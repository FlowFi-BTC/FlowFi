import React from 'react';

/**
 * DB view vs chain source-of-truth badge (§2 database-vs-chain).
 * Shows the primary DB status, plus a "syncing…" hint when on-chain disagrees
 * (broadcast → confirmation lag). Never silently picks one.
 */
export const OnchainStatusBadge: React.FC<{
  dbStatus: string;
  onchainStatus?: string | null;
  registered?: boolean | null;
}> = ({ dbStatus, onchainStatus, registered }) => {
  const disagrees = !!onchainStatus && onchainStatus !== dbStatus;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="neo-border bg-[#a8ff3e] px-3 py-1 text-xs font-bold text-black">{dbStatus}</span>
      {registered === false && (
        <span className="neo-border bg-[#f7f7f7] px-2 py-0.5 text-[10px] font-bold text-gray-600">
          off-chain only
        </span>
      )}
      {disagrees && (
        <span
          className="neo-border bg-[#fef08a] px-2 py-0.5 text-[10px] font-bold text-black animate-pulse"
          title={`On-chain reports ${onchainStatus} — indexer is catching up`}
        >
          syncing… (chain: {onchainStatus})
        </span>
      )}
    </span>
  );
};
