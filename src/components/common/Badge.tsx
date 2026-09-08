import React from 'react';
import type { ReceivableStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'zinc';
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  dot = true,
  size = 'sm',
}) => {
  const styles = {
    blue: 'bg-[#22d3ee] text-black',
    emerald: 'bg-[#a8ff3e] text-black',
    amber: 'bg-[#fef08a] text-black',
    purple: 'bg-[#c4b5fd] text-black',
    rose: 'bg-[#ffb6b9] text-black',
    zinc: 'bg-[#e4e4e7] text-black',
  };

  const dotColors = {
    blue: 'bg-black',
    emerald: 'bg-black',
    amber: 'bg-black',
    purple: 'bg-black',
    rose: 'bg-black',
    zinc: 'bg-black',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-[11.5px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5  neo-border font-syne font-bold transition-colors select-none ${styles[variant]} ${sizeStyles[size]}`}
    >
      {dot && <span className={`h-1.5 w-1.5  ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReceivableStatus }> = ({ status }) => {
  switch (status) {
    case 0:
      return <Badge variant="amber">REGISTERED</Badge>;
    case 1:
      return <Badge variant="blue">FUNDED</Badge>;
    case 2:
      return <Badge variant="emerald">REPAID</Badge>;
    case 3:
      return <Badge variant="rose">DEFAULTED</Badge>;
    default:
      return <Badge variant="zinc">UNKNOWN</Badge>;
  }
};
