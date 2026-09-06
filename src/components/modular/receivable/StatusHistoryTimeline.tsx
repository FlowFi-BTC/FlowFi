import React from 'react';
import type { StatusEvent } from '../../../types';
import { StatusBadge } from '../../common/Badge';

interface StatusHistoryTimelineProps {
  events: StatusEvent[];
}

export const StatusHistoryTimeline: React.FC<StatusHistoryTimelineProps> = ({ events }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <h3 className="font-extrabold text-black text-lg">Status History & Transparency Log</h3>
        <span className="font-syne text-xs font-bold text-gray-600 bg-[#f7f7f7] neo-border px-2 py-0.5 rounded-full">
          GET /receivable/1/history
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[3px] before:bg-black">
        {events.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline dot */}
            <div className="absolute -left-6 top-1 h-4 w-4 rounded-full neo-border bg-[#a8ff3e] group-hover:scale-125 transition-transform" />

            <div className="rounded-[18px] neo-border bg-[#f7f7f7] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <StatusBadge status={event.status} />
                  <span className="font-syne text-xs font-extrabold text-black">
                    Block #{event.blockHeight}
                  </span>
                </div>
                <span className="font-syne text-xs font-bold text-gray-600">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="mt-2 text-xs text-black font-syne font-bold space-y-1">
                <div>
                  <span className="text-gray-600 font-extrabold">Actor:</span>{' '}
                  <span className="text-black">{event.actor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-extrabold">Stacks Tx:</span>
                  <a
                    href={`https://explorer.hiro.so/txid/${event.txHash}?chain=testnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#6B46C1] underline font-extrabold truncate max-w-[280px] sm:max-w-[400px]"
                  >
                    {event.txHash}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
