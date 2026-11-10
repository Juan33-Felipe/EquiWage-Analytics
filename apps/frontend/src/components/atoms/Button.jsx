import React from 'react';
import { cn } from '../../utils/cn';

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variants = {
    // Glassmorphism Primary (Orange frosted glass with specular top glow)
    primary:
      'bg-primary/90 hover:bg-primary text-white backdrop-blur-md border border-white/35 dark:border-white/20 shadow-[0_4px_16px_rgba(249,115,22,0.30)] hover:shadow-[0_6px_22px_rgba(249,115,22,0.45)] relative overflow-hidden active:scale-[0.98] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/25 before:to-transparent before:rounded-t-full',

    // Glassmorphism Dark / Smoked Glass
    dark:
      'bg-black/35 hover:bg-black/50 dark:bg-white/10 dark:hover:bg-white/18 text-white backdrop-blur-md border border-white/25 dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.15)] relative overflow-hidden active:scale-[0.98] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:rounded-t-full',

    // Glassmorphism Outline / Frosted Neutral Glass
    outline:
      'bg-white/60 hover:bg-white/80 dark:bg-surface/50 dark:hover:bg-surface/75 text-content-main backdrop-blur-md border border-white/80 dark:border-white/15 hover:border-primary/40 shadow-[0_4px_14px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.25)] relative overflow-hidden active:scale-[0.98]',

    // Glassmorphism Soft Accent
    secondary:
      'bg-primary/15 hover:bg-primary/25 text-primary backdrop-blur-md border border-primary/30 shadow-sm active:scale-[0.98]',

    // Glassmorphism Ghost
    ghost:
      'backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/10 text-content-main border border-transparent hover:border-white/30 active:scale-[0.98]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        sizes[size] || sizes.md,
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-1.5 justify-center">
        {children}
      </span>
    </button>
  );
}
