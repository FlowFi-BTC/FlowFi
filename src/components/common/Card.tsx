import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false }) => {
  return (
    <div
      className={`rounded-[24px] neo-border-thick bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black font-syne transition-transform ${
        hoverable ? 'hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
