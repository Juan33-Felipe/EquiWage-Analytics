import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ variant = 'success', children, className, ...props }) {
  const variants = {
    success: 'badge-glass-success',
    successOutline: 'badge-glass-success',
    danger: 'badge-glass-danger',
    dangerOutline: 'badge-glass-danger',
    warning: 'badge-glass-warning',
    primary: 'badge-glass-primary',
    info: 'badge-glass-info',
    infoOutline: 'badge-glass-info',
    legal: 'badge-glass-legal',
    legalOutline: 'badge-glass-legal',
    neutral: 'badge-glass-neutral',
    default: 'badge-glass-neutral',
  };

  const selectedVariant = variants[variant] || variants.neutral;

  return (
    <span
      className={cn(
        "badge-glass-base inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none",
        selectedVariant,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
