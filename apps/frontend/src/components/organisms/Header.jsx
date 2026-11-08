import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPill } from '../molecules/TabPill';
import { SearchInput } from '../molecules/SearchInput';
import { Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

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
    <header className="flex items-center justify-between gap-4 py-5 px-8 bg-background sticky top-0 z-20 border-b border-border">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-content-main tracking-tight mb-0.5 truncate">{titleText}</h1>
        <p className="text-xs text-content-muted flex items-center gap-2 font-medium truncate">
          {subtitleText.includes('•') ? (
            subtitleText.split('•').map((part, index) => (
              <React.Fragment key={part.trim()}>
                {index > 0 && <span className="w-1 h-1 rounded-full bg-border shrink-0" />}
                <span className="truncate">{part.trim()}</span>
              </React.Fragment>
            ))
          ) : (
            <span className="truncate">{subtitleText}</span>
          )}
        </p>
      </div>

      {isDashboard && (
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
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

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden lg:block">
          <SearchInput />
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
          title={isDark ? t('header.lightMode') : t('header.darkMode')}
          className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-content-muted hover:text-content-main hover:bg-surface-light transition-colors"
        >
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>
        <button
          type="button"
          aria-label={t('header.notifications')}
          title={t('header.notifications')}
          className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-content-muted hover:text-content-main hover:bg-surface-light transition-colors relative"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          aria-label={t('header.signOut')}
          title={t('header.signOut')}
          className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-content-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
