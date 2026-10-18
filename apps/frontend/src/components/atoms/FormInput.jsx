import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Atomic FormInput component following Warm Enterprise / Soft UI design tokens
 * with full Dark Mode (#1F2937 / #111827) and validation state support.
 */
export function FormInput({
  id,
  label,
  icon: Icon,
  trailingAction,
  hasError = false,
  className,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-content-main mb-2 tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div
            className={cn(
              'absolute left-4 pointer-events-none transition-colors',
              hasError ? 'text-danger' : 'text-content-muted'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          className={cn(
            'w-full rounded-2xl bg-gray-50 border px-4 py-3 text-sm text-content-main placeholder:text-content-muted transition-all duration-200 focus:outline-none',
            Icon && 'pl-11',
            trailingAction && 'pr-11',
            hasError
              ? 'border-danger focus:border-danger'
              : 'border-gray-200 focus:border-primary focus:bg-surface',
            className
          )}
          {...props}
        />
        {trailingAction && (
          <div className="absolute right-3 flex items-center">
            {trailingAction}
          </div>
        )}
      </div>
    </div>
  );
}
