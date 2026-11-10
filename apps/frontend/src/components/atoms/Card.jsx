import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white/65 dark:bg-[#151210]/75 backdrop-blur-2xl rounded-2xl border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-soft transition-all flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
