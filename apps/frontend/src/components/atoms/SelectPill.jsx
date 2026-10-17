import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SelectPill({ value, onChange, options, className, icon: Icon, ariaLabel }) {
  return (
    <div className={cn('relative inline-flex items-center max-w-full', className)}>
      {Icon && <Icon className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none shrink-0" />}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'appearance-none bg-surface border border-gray-200 rounded-full py-2 pr-9 text-sm font-medium text-content-main cursor-pointer max-w-full truncate',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm hover:border-gray-300',
          Icon ? 'pl-9' : 'pl-4'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none shrink-0" />
    </div>
  );
}
