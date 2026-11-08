import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ variant = 'success', children, className, ...props }) {
  const variants = {
    success: 'bg-green-50 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400 border border-green-200 dark:border-emerald-500/20',
    danger: 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20',
    warning: 'bg-yellow-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-yellow-200 dark:border-amber-500/20',
    neutral: 'bg-gray-100 dark:bg-white/10 text-content-muted border border-border',
    dangerOutline: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25',
    successOutline: 'bg-green-50 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400 border border-green-200 dark:border-emerald-500/25',
    primary: 'bg-primary/15 text-primary border border-primary/25',
    legal: 'bg-primary/15 text-primary-light border border-primary/30',
    legalOutline: 'bg-primary/10 text-primary-light border border-primary/30 font-semibold',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
