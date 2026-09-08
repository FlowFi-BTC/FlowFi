import React from 'react';
import type { ProtocolInfo } from '../../../types';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';

interface ProtocolGridProps {
  protocols: ProtocolInfo[];
}

export const ProtocolGrid: React.FC<ProtocolGridProps> = ({ protocols }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-syne">
      {protocols.map((protocol) => (
        <Card key={protocol.name} hoverable className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9  bg-[#f7f7f7] neo-border flex items-center justify-center font-syne text-xs font-black text-black">
                  {protocol.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-black text-lg">{protocol.name}</h4>
                  <span className="font-syne text-xs font-bold text-[#6B46C1]">
                    {protocol.type}
                  </span>
                </div>
              </div>
              <Badge
                variant={
                  protocol.status === 'Healthy'
                    ? 'emerald'
                    : protocol.status === 'Optimal'
                    ? 'blue'
                    : 'amber'
                }
              >
                {protocol.status.toUpperCase()}
              </Badge>
            </div>

            <p className="mt-3 text-xs text-gray-700 font-semibold leading-relaxed">
              {protocol.description}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t-2 border-black/10 font-syne text-xs">
              <div>
                <span className="text-[10px] text-gray-600 uppercase font-syne font-extrabold block">
                  TVL Depth
                </span>
                <span className="font-black text-black text-sm">{protocol.tvl}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-600 uppercase font-syne font-extrabold block">
                  Yield APY
                </span>
                <span className="font-black text-[#6B46C1] text-sm">{protocol.apy}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-600 uppercase font-syne font-extrabold block">
                  Risk Score
                </span>
                <span className="font-black text-black text-sm">{protocol.riskScore}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
