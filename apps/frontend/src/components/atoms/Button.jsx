import React from 'react';
import { cn } from '../../utils/cn';

export function Button({ variant = 'primary', className, children, ...props }) {
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm',
    dark: 'bg-[#1C1C1C] hover:bg-black text-white',
    outline: 'border border-gray-200 hover:bg-gray-50 text-content-main',
    ghost: 'hover:bg-gray-100 text-content-main',
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 rounded-full font-medium transition-colors text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
