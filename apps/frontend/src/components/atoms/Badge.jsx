import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ variant = 'success', children, className, ...props }) {
  const variants = {
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-yellow-100 text-yellow-700',
    neutral: 'bg-gray-100 text-gray-700',
    dangerOutline: 'bg-red-50 text-danger border border-red-100',
    successOutline: 'bg-green-50 text-success border border-green-100',
    primary: 'bg-orange-50 text-primary border border-orange-100',
    legal: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60',
    legalOutline: 'bg-orange-50 text-orange-800 border border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-semibold',
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
