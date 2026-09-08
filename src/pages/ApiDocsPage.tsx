import React from 'react';
import { Card } from '../components/common/Card';

export const ApiDocsPage: React.FC = () => {
  return (
    <div className="space-y-6 font-syne">
      <div className="neo-border-thick bg-white rounded-[28px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-syne text-xs font-bold text-[#6B46C1]">
          <span>05 / DEVELOPER</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mt-1">
          Developer API & Clarity Contract Spec
        </h1>
        <p className="text-gray-600 text-sm font-semibold mt-1">
          Complete endpoint documentation and Stacks testnet Clarity smart contract ABI reference.
        </p>
      </div>

      {/* Contract Functions Section */}
      <Card className="space-y-4">
        <h3 className="font-extrabold text-black text-lg border-b-2 border-black pb-3">
          Clarity Smart Contract Public Functions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-syne text-xs neo-border rounded-[18px] overflow-hidden bg-[#f7f7f7]">
            <thead className="border-b-2 border-black bg-white text-black font-extrabold text-xs">
              <tr>
                <th className="p-3.5">Function Name</th>
                <th className="p-3.5">Signature</th>
                <th className="p-3.5">Caller</th>
                <th className="p-3.5">On-Chain Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black font-bold">
              <tr>
                <td className="p-3.5 font-extrabold text-[#6B46C1]">`register-receivable`</td>
                <td className="p-3.5 text-gray-700">`(amount uint) (due-block uint) (doc-hash (buff 32))`</td>
                <td className="p-3.5 text-black">Borrower</td>
                <td className="p-3.5 text-gray-700">Creates entry (status 0), increments `next-id`</td>
              </tr>
              <tr>
                <td className="p-3.5 font-extrabold text-[#6B46C1]">`fund-receivable`</td>
                <td className="p-3.5 text-gray-700">`(receivable-id uint)`</td>
                <td className="p-3.5 text-black">Capital Provider</td>
                <td className="p-3.5 text-gray-700">Transfers sBTC, sets provider, status 0 → 1</td>
              </tr>
              <tr>
                <td className="p-3.5 font-extrabold text-emerald-700">`mark-repaid`</td>
                <td className="p-3.5 text-gray-700">`(receivable-id uint)`</td>
                <td className="p-3.5 text-black">Provider or Borrower</td>
                <td className="p-3.5 text-gray-700">Sets status → 2 (Repaid), releases escrow</td>
              </tr>
              <tr>
                <td className="p-3.5 font-extrabold text-rose-700">`mark-defaulted`</td>
                <td className="p-3.5 text-gray-700">`(receivable-id uint)`</td>
                <td className="p-3.5 text-black">Provider (after due-block)</td>
                <td className="p-3.5 text-gray-700">Sets status → 3 (Defaulted)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-extrabold text-blue-700">`get-receivable`</td>
                <td className="p-3.5 text-gray-700">`(receivable-id uint)`</td>
                <td className="p-3.5 text-black">Anyone (read-only)</td>
                <td className="p-3.5 text-gray-700">Returns full receivable record tuple</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* REST API Endpoints Section */}
      <Card className="space-y-4">
        <h3 className="font-extrabold text-black text-lg border-b-2 border-black pb-3">REST API Read Endpoints</h3>

        <div className="space-y-4 font-syne text-xs">
          <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1  neo-border bg-[#22d3ee] text-black font-extrabold text-xs">GET</span>
              <span className="text-black font-extrabold text-sm">/receivable/:id</span>
            </div>
            <p className="text-gray-700 font-syne text-xs font-semibold">
              Returns full receivable record pulled directly from contract read-only function `get-receivable`.
            </p>
          </div>

          <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1  neo-border bg-[#22d3ee] text-black font-extrabold text-xs">GET</span>
              <span className="text-black font-extrabold text-sm">/receivables</span>
            </div>
            <p className="text-gray-700 font-syne text-xs font-semibold">
              Returns list of all registered receivables on Stacks testnet.
            </p>
          </div>

          <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1  neo-border bg-[#22d3ee] text-black font-extrabold text-xs">GET</span>
              <span className="text-black font-extrabold text-sm">/receivable/:id/history</span>
            </div>
            <p className="text-gray-700 font-syne text-xs font-semibold">
              Chronological list of status-change events and Stacks transaction IDs.
            </p>
          </div>

          <div className="rounded-[18px] neo-border bg-[#a8ff3e] p-4 space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1  neo-border bg-black text-white font-extrabold text-xs">GET</span>
              <span className="text-black font-extrabold text-sm">/receivable/:id/verification</span>
            </div>
            <p className="text-black font-syne text-xs font-bold">
              Returns off-chain verification note attestation, reviewer node, and document SHA-256 hashes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
