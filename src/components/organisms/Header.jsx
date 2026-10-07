import React from 'react';
import { TabPill } from '../molecules/TabPill';
import { SearchInput } from '../molecules/SearchInput';
import { Bell } from 'lucide-react';

export function Header({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'simulator', label: 'Simulator' },
    { id: 'distribution', label: 'Distribution' },
  ];

  return (
    <header className="flex items-center justify-between py-6 px-8 bg-background sticky top-0 z-20">
      <div>
        <h1 className="text-2xl font-bold text-content-main tracking-tight mb-1">Dashboard</h1>
        <p className="text-xs text-content-muted flex items-center gap-2 font-medium">
          EquiWage Analytics
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          Compensation Audit
        </p>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <TabPill tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
      </div>

      <div className="flex items-center gap-4">
        <SearchInput />
        <button className="w-10 h-10 rounded-full bg-surface border border-gray-200 flex items-center justify-center text-gray-500 hover:text-content-main hover:bg-gray-50 transition-colors relative shadow-sm">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
        </button>
      </div>
    </header>
  );
}
