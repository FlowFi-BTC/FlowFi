import React from 'react';

interface StatBoxProps {
  label: string;
  value: string | React.ReactNode;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

export const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  subValue,
  change,
  isPositive = true,
  icon,
}) => {
  return (
    <div className="rounded-[20px] neo-border-thick bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] font-syne">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-extrabold tracking-wider uppercase text-gray-600">
          {label}
        </span>
        {icon && <span className="text-black">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-black tracking-tight text-black">{value}</div>
        {change && (
          <span
            className={`neo-border  px-2 py-0.5 text-[10px] font-extrabold ${
              isPositive ? 'bg-[#a8ff3e] text-black' : 'bg-[#ffb6b9] text-black'
            }`}
          >
            {isPositive ? '+' : ''}
            {change}
          </span>
        )}
      </div>

      {subValue && (
        <div className="mt-1.5 font-syne text-[11px] font-bold text-gray-500">{subValue}</div>
      )}
    </div>
  );
};
