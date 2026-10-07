import React from 'react';
import { cn } from '../../utils/cn';

export function Avatar({ initials, colorClass, className }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm",
        colorClass || "bg-gray-100 text-gray-700",
        className
      )}
    >
      {initials}
    </div>
  );
}
