import React from 'react';
import { Search } from 'lucide-react';

export function SearchInput() {
  return (
    <div className="relative group flex items-center">
      <div className="absolute left-3 text-gray-400 group-focus-within:text-primary transition-colors">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        placeholder="Search employees..."
        className="w-64 bg-surface border border-gray-200 rounded-full py-2 pl-9 pr-12 text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-gray-400 shadow-sm"
      />
      <div className="absolute right-3 flex items-center">
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-500 font-sans">
          <span className="text-xs">⌘</span> K
        </kbd>
      </div>
    </div>
  );
}
