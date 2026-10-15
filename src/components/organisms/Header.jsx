import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPill } from '../molecules/TabPill';
import { SearchInput } from '../molecules/SearchInput';
import { Bell, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const DASHBOARD_TABS = [
  { id: 'overview', label: 'overview', to: '/dashboard/overview' },
  { id: 'simulator', label: 'simulator', to: '/dashboard/simulator' },
  { id: 'distribution', label: 'distribution', to: '/dashboard/distribution' },
];

const PAGE_META = {
  '/employees': { titleKey: 'header.employees', subtitleKey: 'header.payrollDatasets' },
  '/bands': { titleKey: 'header.salaryBands', subtitleKey: 'header.marketRanges' },
  '/reports': { titleKey: 'header.reports', subtitleKey: 'header.executiveExports' },
  '/settings': { titleKey: 'header.settings', subtitleKey: 'header.localSession' },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const pageMeta = PAGE_META[location.pathname];
  const titleText = isDashboard
    ? t('header.dashboard')
    : pageMeta
      ? t(pageMeta.titleKey)
      : t('header.equiWageAnalytics');
  const subtitleText = isDashboard
    ? t('header.dashboardSubtitle')
    : pageMeta
      ? t(pageMeta.subtitleKey)
      : t('header.compensationAudit');

  const activeTab = DASHBOARD_TABS.find((tab) => tab.to === location.pathname)?.id || 'overview';

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-6 px-8 bg-background sticky top-0 z-20 transition-colors duration-200">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-content-main tracking-tight mb-1 truncate">{titleText}</h1>
        <p className="text-xs text-content-muted flex items-center gap-2 font-medium truncate">
          {subtitleText.includes('•') ? (
            subtitleText.split('•').map((part, index) => (
              <React.Fragment key={part.trim()}>
                {index > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />}
                <span className="truncate">{part.trim()}</span>
              </React.Fragment>
            ))
          ) : (
            <span className="truncate">{subtitleText}</span>
          )}
        </p>
      </div>

      {isDashboard && (
        <div className="hidden md:flex shrink-0 justify-center">
          <TabPill
            tabs={DASHBOARD_TABS}
            activeTab={activeTab}
            onChange={(id) => {
              const tab = DASHBOARD_TABS.find((item) => item.id === id);
              if (tab) navigate(tab.to);
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-3 flex-1 shrink-0">
        <div className="hidden lg:block">
          <SearchInput />
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
          title={isDark ? t('header.lightMode') : t('header.darkMode')}
          className="w-10 h-10 shrink-0 rounded-full bg-surface border border-gray-200 flex items-center justify-center text-gray-500 hover:text-content-main hover:bg-gray-50 transition-colors shadow-sm"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          type="button"
          aria-label={t('header.notifications')}
          title={t('header.notifications')}
          className="w-10 h-10 shrink-0 rounded-full bg-surface border border-gray-200 flex items-center justify-center text-gray-500 hover:text-content-main hover:bg-gray-50 transition-colors relative shadow-sm"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
        </button>
      </div>
    </header>
  );
}
