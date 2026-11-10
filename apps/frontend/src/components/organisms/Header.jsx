import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPill } from '../molecules/TabPill';
import { SearchInput } from '../molecules/SearchInput';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCompensation, formatCurrency } from '../../context/CompensationContext';
import { AnimatePresence, motion } from 'framer-motion';

const DASHBOARD_TABS = [
  { id: 'overview', label: 'overview', to: '/dashboard/overview' },
  { id: 'simulator', label: 'simulator', to: '/dashboard/simulator' },
  { id: 'distribution', label: 'distribution', to: '/dashboard/distribution' },
];

const PAGE_META = {
  '/profile': { titleKey: 'header.profile', subtitleKey: 'header.profileSubtitle' },
  '/employees': { titleKey: 'header.employees', subtitleKey: 'header.payrollDatasets' },
  '/bands': { titleKey: 'header.salaryBands', subtitleKey: 'header.marketRanges' },
  '/reports': { titleKey: 'header.reports', subtitleKey: 'header.executiveExports' },
  '/settings': { titleKey: 'header.settings', subtitleKey: 'header.localSession' },
};

export function Header({ onOpenMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const { t, language } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { employees, inequities, marketGaps, legalViolators } = useCompensation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Aggregate detected alerts from Compensation Context
  const alertItems = useMemo(() => {
    const list = [];

    // Legal minimum wage violators
    if (legalViolators && legalViolators.length > 0) {
      legalViolators.forEach((emp) => {
        list.push({
          id: `legal-${emp.id}`,
          employee: emp,
          type: 'legal',
          severity: 'high',
          title: t('header.criticalLegalAlert'),
          description: `${emp.fullName || emp.name} (${emp.jobTitle}) - ${formatCurrency(emp.salary)}`,
        });
      });
    }

    // Inequities
    if (inequities && inequities.length > 0) {
      inequities.forEach((emp) => {
        list.push({
          id: `inequity-${emp.id}`,
          employee: emp,
          type: 'inequity',
          severity: 'medium',
          title: t('header.inequityAlert'),
          description: `${emp.fullName || emp.name} - ${emp.jobTitle} (${emp.department})`,
        });
      });
    }

    // Market gaps
    if (marketGaps && marketGaps.length > 0) {
      marketGaps.forEach((emp) => {
        if (!list.some((item) => item.employee.id === emp.id)) {
          list.push({
            id: `market-${emp.id}`,
            employee: emp,
            type: 'market',
            severity: 'low',
            title: t('header.marketGapAlert'),
            description: `${emp.fullName || emp.name} - Gap: ${formatCurrency(Math.abs(emp.gap || 0))}`,
          });
        }
      });
    }

    return list;
  }, [legalViolators, inequities, marketGaps, t]);

  const totalAlertCount = alertItems.length;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayInitials = user?.initials || 'EV';
  const displayName = user?.fullName || 'Dinesh Kartik';
  const displayRole = user?.role || t('header.proAccount');

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
    <header className="sticky top-0 z-20 shrink-0 bg-background/80 dark:bg-[#0B0D13]/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-md transition-all">
      <div className="flex items-center justify-between gap-4 py-4 sm:py-5 px-6 sm:px-8 lg:px-10 min-w-0">
        {/* Left: Mobile Menu Trigger + Page Identity (Enlarged) */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label={language === 'es' ? 'Abrir menú' : 'Open menu'}
            className="lg:hidden w-11 h-11 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-border flex items-center justify-center text-content-muted hover:text-content-main shrink-0 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-content-main tracking-tight leading-tight truncate">
              {titleText}
            </h1>
            <p className="text-xs sm:text-sm text-content-muted hidden sm:flex items-center gap-2 font-medium truncate mt-1">
              {subtitleText.includes('•') ? (
                subtitleText.split('•').map((part, index) => (
                  <React.Fragment key={part.trim()}>
                    {index > 0 && <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />}
                    <span className="truncate">{part.trim()}</span>
                  </React.Fragment>
                ))
              ) : (
                <span className="truncate">{subtitleText}</span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Enlarged In-flow TabPill for Wide Screens (xl and above) */}
        {isDashboard && (
          <div className="hidden xl:flex items-center justify-center flex-1 min-w-0 px-4">
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

        {/* Right: CoinSphere-styled Search + Pill Theme Toggle + Bell + User Profile Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:block">
            <SearchInput />
          </div>

          {/* CoinSphere Signature Pill Theme Toggle (Moon & Sun) */}
          <div
            role="button"
            tabIndex={0}
            onClick={toggleTheme}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
              }
            }}
            aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
            title={isDark ? t('header.lightMode') : t('header.darkMode')}
            className="flex items-center p-1 rounded-full bg-white/60 dark:bg-[#181920]/80 border border-border dark:border-white/10 shadow-xs cursor-pointer select-none transition-all hover:border-primary/50"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                isDark
                  ? 'bg-white text-gray-950 shadow-md scale-100 font-bold'
                  : 'text-content-muted hover:text-content-main scale-90'
              }`}
            >
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            </div>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                !isDark
                  ? 'bg-amber-400 text-white shadow-md scale-100 font-bold'
                  : 'text-content-muted hover:text-content-main scale-90'
              }`}
            >
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          {/* Notifications Button with Dropdown Alert Center */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-label={t('header.notifications')}
              title={t('header.notifications')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/60 dark:bg-[#181920]/80 border border-border dark:border-white/10 flex items-center justify-center text-content-muted hover:text-content-main hover:bg-white/80 dark:hover:bg-white/10 active:scale-95 transition-all relative shrink-0 cursor-pointer"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {totalAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-pulse">
                  {totalAlertCount > 9 ? '9+' : totalAlertCount}
                </span>
              )}
            </button>

            {/* Notifications Modal / Popover Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-surface border border-border dark:border-white/10 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
                >
                  {/* Dropdown Header */}
                  <div className="p-4 border-b border-border/80 dark:border-white/10 flex items-center justify-between bg-surface-light/40">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-content-main leading-none">
                          {t('header.notifications')}
                        </h4>
                        <p className="text-[10px] text-content-muted mt-1 leading-none">
                          {totalAlertCount > 0
                            ? t('header.alertCount').replace('{count}', String(totalAlertCount))
                            : t('header.notificationsEmpty')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-content-muted hover:text-content-main hover:bg-surface-light transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Alerts List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-border/50 dark:divide-white/5">
                    {alertItems.length === 0 ? (
                      <div className="p-6 text-center">
                        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-bold text-content-main">
                          {t('header.notificationsEmpty')}
                        </p>
                        <p className="text-[11px] text-content-muted mt-1">
                          {t('header.notificationsEmptyDesc')}
                        </p>
                      </div>
                    ) : (
                      alertItems.slice(0, 6).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate('/employees');
                          }}
                          className="p-3.5 hover:bg-surface-light/60 transition-colors cursor-pointer flex items-start gap-3 group"
                        >
                          <div className="mt-0.5 shrink-0">
                            {item.severity === 'high' ? (
                              <div className="w-7 h-7 rounded-full bg-danger/15 text-danger flex items-center justify-center">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                            ) : item.severity === 'medium' ? (
                              <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-content-main group-hover:text-primary transition-colors leading-snug">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-content-muted truncate mt-0.5 font-medium">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  {alertItems.length > 0 && (
                    <div className="p-2.5 border-t border-border/80 dark:border-white/10 bg-surface-light/30">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/dashboard/overview');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>{t('header.viewAllAlerts')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Avatar Button -> Redirects to Profile Settings */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label={t('sidebar.profile')}
            title={`${displayName} - ${t('sidebar.profile')}`}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs border border-white/20 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            {displayInitials}
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t('header.signOut')}
            title={t('header.signOut')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/60 dark:bg-[#181920]/80 border border-border dark:border-white/10 flex items-center justify-center text-content-muted hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responsive Second Row for TabPill on Viewports < xl */}
      {isDashboard && (
        <div className="xl:hidden pb-3.5 px-4 flex justify-center w-full overflow-x-auto min-w-0">
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
    </header>
  );
}
