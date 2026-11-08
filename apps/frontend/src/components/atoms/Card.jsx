import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border p-6 flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
