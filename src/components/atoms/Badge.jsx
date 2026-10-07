import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ variant = 'success', children, className, ...props }) {
  const variants = {
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-yellow-100 text-yellow-700',
    neutral: 'bg-gray-100 text-gray-700',
    dangerOutline: 'bg-red-50 text-danger border border-red-100',
    successOutline: 'bg-green-50 text-success border border-green-100'
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
