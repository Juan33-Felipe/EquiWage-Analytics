import React from 'react';
import { cn } from '../../utils/cn';

export function Button({ variant = 'primary', className, children, ...props }) {
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20',
    dark: 'bg-white/10 hover:bg-white/15 text-white backdrop-blur-sm',
    outline: 'border border-border hover:bg-surface-light text-content-main',
    ghost: 'hover:bg-surface-light text-content-main',
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 rounded-full font-medium transition-all text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
