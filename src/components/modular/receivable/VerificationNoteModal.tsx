import React from 'react';
import type { VerificationNote } from '../../../types';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';

interface VerificationNoteModalProps {
  note: VerificationNote;
  isOpen: boolean;
  onClose: () => void;
}

export const VerificationNoteModal: React.FC<VerificationNoteModalProps> = ({
  note,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-syne">
      <div className="w-full max-w-2xl rounded-[24px] neo-border-thick bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10  bg-[#a8ff3e] neo-border flex items-center justify-center font-syne font-black text-black text-lg">
              ✓
            </div>
            <div>
              <h3 className="font-extrabold text-black text-xl">Off-Chain Verification Record</h3>
              <p className="text-xs text-gray-600 font-syne font-bold">
                GET /receivable/{note.receivableId}/verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9  neo-border bg-[#f7f7f7] text-black font-extrabold text-lg flex items-center justify-center hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="mt-6 space-y-6">
          {/* Verification Status Banner */}
          <div className="flex items-center justify-between rounded-[18px] neo-border bg-[#a8ff3e] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3  bg-black animate-pulse" />
              <div>
                <div className="font-black text-black text-sm">
                  Document Reviewed & Verified
                </div>
                <div className="text-xs text-black font-syne font-bold">
                  Reviewed by {note.reviewedBy}
                </div>
              </div>
            </div>
            <Badge variant="emerald" size="md">
              VERIFIED
            </Badge>
          </div>

          {/* Attestation Text */}
          <Card className="bg-[#f7f7f7]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
              Plain-Text Attestation Note
            </span>
            <p className="mt-2 text-sm text-black font-semibold leading-relaxed font-syne">
              "{note.attestationText}"
            </p>
            <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between text-xs font-syne font-bold text-gray-700">
              <span>Timestamp: {new Date(note.reviewedAt).toLocaleString()}</span>
              <span className="bg-[#c4b5fd] text-black neo-border px-2 py-0.5 ">Node #04 Attestation</span>
            </div>
          </Card>

          {/* Document Hash Integrity */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
              On-Chain Document Hashes (doc-hash)
            </span>
            <div className="mt-2 space-y-2">
              {note.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[14px] neo-border bg-white p-3 font-syne text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div>
                    <span className="font-extrabold text-black">{doc.name}</span>
                    <span className="text-gray-500 ml-2 font-bold">({doc.type})</span>
                  </div>
                  <div className="text-[11px] font-bold text-black bg-[#22d3ee] px-2.5 py-1  neo-border truncate max-w-[280px]">
                    {doc.hash}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Disclaimer */}
          <div className="rounded-[18px] neo-border bg-[#fef08a] p-4 text-xs text-black font-semibold leading-relaxed shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-extrabold text-black block mb-1">Risk Disclosure & Transparency Note:</span>
            {note.disclaimer}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t-2 border-black flex justify-end">
          <button
            onClick={onClose}
            className=" neo-border bg-black px-5 py-2 text-xs font-extrabold text-white hover:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
