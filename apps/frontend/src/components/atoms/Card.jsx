import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-surface dark:bg-[#181920]/75 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 shadow-[0_4px_20px_rgba(15,23,42,0.04)] dark:shadow-soft transition-all flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
