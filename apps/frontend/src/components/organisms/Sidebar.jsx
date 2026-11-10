import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  BarChart3,
  FileText,
  Settings,
  User,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  X,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCompensation } from '../../context/CompensationContext';

const NAV_SECTIONS = [
  {
    titleKey: 'sidebar.sectionGeneral',
    items: [
      { to: '/dashboard/overview', icon: LayoutGrid, labelKey: 'sidebar.dashboard' },
    ],
  },
  {
    titleKey: 'sidebar.sectionAnalytics',
    items: [
      { to: '/employees', icon: Users, labelKey: 'sidebar.employees' },
      { to: '/bands', icon: BarChart3, labelKey: 'sidebar.bands' },
      { to: '/reports', icon: FileText, labelKey: 'sidebar.reports' },
    ],
  },
  {
    titleKey: 'sidebar.sectionPreferences',
    items: [
      { to: '/profile', icon: User, labelKey: 'sidebar.profile' },
      { to: '/settings', icon: Settings, labelKey: 'sidebar.settings' },
    ],
  },
];

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onCloseMobile }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { employees } = useCompensation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const displayInitials = user?.initials || 'EV';
  const displayName = user?.fullName || t('sidebar.hrAdmin');
  const displaySubtitle = user?.role || t('sidebar.localSession');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'bg-sidebar/80 dark:bg-[#0B0D13]/60 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.03)] dark:shadow-md flex flex-col py-6 h-screen sticky top-0 transition-all duration-300 shrink-0 z-30',
          collapsed ? 'lg:w-20 lg:items-center' : 'lg:w-64 lg:px-4',
          // Mobile Drawer Behavior vs Desktop Sticky
          'fixed inset-y-0 left-0 z-50 w-72 px-4 lg:sticky lg:top-0 lg:z-30 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Identity / Logo & Mobile Close Button */}
        <div className={cn('flex items-center justify-between gap-3 mb-6 lg:mb-8', collapsed ? 'lg:justify-center' : 'px-2')}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-primary to-orange-500 text-white flex items-center justify-center shadow-lg shadow-primary/25 border border-white/20 backdrop-blur-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="leading-tight min-w-0">
                <p className="font-bold text-content-main tracking-tight text-base truncate">EquiWage</p>
                <p className="text-[11px] text-content-muted font-medium truncate">Analytics</p>
              </div>
            )}
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden w-8 h-8 rounded-full border border-border flex items-center justify-center text-content-muted hover:text-content-main hover:bg-surface-light transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Items Grouped with Section Headings (CoinSphere style) */}
        <nav className={cn('flex flex-col gap-4 flex-1 min-h-0 w-full overflow-y-auto pr-1 -mr-1', collapsed && 'lg:items-center')}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.titleKey} className="w-full flex flex-col gap-1">
              {(!collapsed || mobileOpen) && (
                <span className="px-3 text-[10px] font-bold tracking-widest uppercase text-content-muted/70 mb-1 select-none">
                  {t(section.titleKey)}
                </span>
              )}
              {section.items.map(({ to, icon: Icon, labelKey }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={handleNavClick}
                  title={collapsed ? t(labelKey) : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl transition-all duration-200 group relative min-w-0',
                      collapsed ? 'lg:w-12 lg:h-12 lg:justify-center px-3.5 py-2.5' : 'px-3.5 py-2.5',
                      isActive
                        ? 'bg-white/80 dark:bg-white/[0.08] backdrop-blur-md text-content-main font-semibold border border-white/60 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
                        : 'text-content-muted hover:text-content-main hover:bg-white/40 dark:hover:bg-white/[0.04] hover:backdrop-blur-sm font-medium'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary" : "group-hover:text-content-main")} />
                      {(!collapsed || mobileOpen) && (
    <div className="flex items-center justify-between flex-1 min-w-0 pr-1">
      <span className="text-sm truncate">{t(labelKey)}</span>
      {to === '/employees' && (!employees || employees.length === 0) && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500 text-white shadow-sm shrink-0 animate-pulse">
          {t('sidebar.step1Badge')}
        </span>
      )}
    </div>
  )}
                      {isActive && (
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-sm shadow-primary/50" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* CoinSphere Signature Help Center Card */}
        {(!collapsed || mobileOpen) ? (
          <div className="w-full my-4 p-4 rounded-2xl bg-white/70 dark:bg-[#181920]/80 backdrop-blur-xl border border-border dark:border-white/10 shadow-md dark:shadow-md text-center relative overflow-hidden shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white flex items-center justify-center mx-auto mb-2 border border-primary/20 dark:border-white/10">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-content-main tracking-tight">{t('sidebar.helpCenter')}</h4>
            <p className="text-[11px] text-content-muted mt-0.5 mb-3 leading-snug">
              {t('sidebar.helpCenterDesc')}
            </p>
            <button
              type="button"
              onClick={() => alert(`Soporte EquiWage Analytics: contacto@equiwage.com`)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/30 active:scale-95 transition-all"
            >
              {t('sidebar.contactUs')}
            </button>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/15 blur-xl pointer-events-none" />
          </div>
        ) : (
          <div className="my-3 hidden lg:flex justify-center shrink-0">
            <button
              type="button"
              onClick={() => alert(`Soporte EquiWage Analytics: contacto@equiwage.com`)}
              className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-[#181920]/80 border border-border dark:border-white/10 flex items-center justify-center text-primary hover:bg-primary/10 transition-all cursor-pointer"
              title={t('sidebar.helpCenter')}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Toggle + Profile + Sign Out with Glass Finish */}
        <div className={cn('mt-auto flex flex-col gap-3 w-full pt-3 border-t border-border/40 dark:border-white/10', collapsed ? 'lg:items-center' : '')}>
          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggle}
            className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center text-content-muted hover:bg-white/60 dark:hover:bg-white/10 hover:text-content-main backdrop-blur-sm transition-all"
            title={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <div
            className={cn(
              'flex items-center justify-between gap-2 min-w-0 rounded-2xl p-2.5 transition-all',
              collapsed
                ? 'lg:flex-col lg:justify-center'
                : 'bg-white/50 dark:bg-[#181920]/80 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-xs'
            )}
          >
            <NavLink
              to="/profile"
              onClick={handleNavClick}
              title={t('sidebar.profile')}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-all group text-left cursor-pointer rounded-xl',
                  isActive ? 'text-primary font-bold' : ''
                )
              }
            >
              <div className="w-9 h-9 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30 group-hover:border-primary/60 transition-colors">
                {displayInitials}
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-semibold text-content-main group-hover:text-primary transition-colors truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-content-muted truncate">{displaySubtitle}</p>
                </div>
              )}
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              aria-label={t('sidebar.signOut')}
              title={t('sidebar.signOut')}
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-content-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
