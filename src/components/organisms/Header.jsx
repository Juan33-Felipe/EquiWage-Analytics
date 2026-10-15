import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPill } from '../molecules/TabPill';
import { SearchInput } from '../molecules/SearchInput';
import { Bell } from 'lucide-react';

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview', to: '/dashboard/overview' },
  { id: 'simulator', label: 'Simulator', to: '/dashboard/simulator' },
  { id: 'distribution', label: 'Distribution', to: '/dashboard/distribution' },
];

const PAGE_META = {
  '/employees': { title: 'Employees & Import', subtitle: 'Payroll datasets • Column validation' },
  '/bands': { title: 'Salary Bands', subtitle: 'Market ranges • Levels 1 to 8' },
  '/reports': { title: 'Reports', subtitle: 'Executive exports • PDF & Excel' },
  '/settings': { title: 'Settings', subtitle: 'Local project session • 100% offline' },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/dashboard');

  const meta = isDashboard
    ? { title: 'Dashboard', subtitle: 'EquiWage Analytics • Compensation Audit' }
    : PAGE_META[location.pathname] || { title: 'EquiWage Analytics', subtitle: 'Compensation Audit' };

  const activeTab = DASHBOARD_TABS.find((tab) => tab.to === location.pathname)?.id || 'overview';

  return (
    <header className="flex items-center justify-between gap-4 py-6 px-8 bg-background sticky top-0 z-20">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-content-main tracking-tight mb-1 truncate">{meta.title}</h1>
        <p className="text-xs text-content-muted flex items-center gap-2 font-medium truncate">
          {meta.subtitle.includes('•') ? (
            meta.subtitle.split('•').map((part, index) => (
              <React.Fragment key={part}>
                {index > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />}
                <span className="truncate">{part.trim()}</span>
              </React.Fragment>
            ))
          ) : (
            <span className="truncate">{meta.subtitle}</span>
          )}
        </p>
      </div>

      {isDashboard && (
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <TabPill
            tabs={DASHBOARD_TABS}
            activeTab={activeTab}
            onChange={(id) => {
              const tab = DASHBOARD_TABS.find((t) => t.id === id);
              if (tab) navigate(tab.to);
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden lg:block">
          <SearchInput />
        </div>
        <button className="w-10 h-10 rounded-full bg-surface border border-gray-200 flex items-center justify-center text-gray-500 hover:text-content-main hover:bg-gray-50 transition-colors relative shadow-sm">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
        </button>
      </div>
    </header>
  );
}
