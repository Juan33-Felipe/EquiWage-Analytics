import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, BarChart3, FileText, Settings, TrendingUp, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard/overview', icon: LayoutGrid, labelKey: 'sidebar.dashboard' },
  { to: '/employees', icon: Users, labelKey: 'sidebar.employees' },
  { to: '/bands', icon: BarChart3, labelKey: 'sidebar.bands' },
  { to: '/reports', icon: FileText, labelKey: 'sidebar.reports' },
  { to: '/settings', icon: Settings, labelKey: 'sidebar.settings' },
];

export function Sidebar({ collapsed = false, onToggle }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayInitials = user?.initials || 'EV';
  const displayName = user?.fullName || t('sidebar.hrAdmin');
  const displaySubtitle = user?.role || t('sidebar.localSession');

  return (
    <aside
      className={cn(
        'bg-surface border-r border-gray-100 flex flex-col py-6 h-screen sticky top-0 transition-all duration-300 z-30 shrink-0',
        collapsed ? 'w-20 items-center' : 'w-64 px-4'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 mb-8', collapsed ? 'justify-center' : 'px-2')}>
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-orange-50 flex items-center justify-center text-primary shadow-sm">
          <TrendingUp className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <p className="font-bold text-content-main tracking-tight truncate">EquiWage</p>
            <p className="text-xs text-content-muted truncate">Analytics</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className={cn('flex flex-col gap-2 flex-1 w-full', collapsed && 'items-center')}>
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? t(labelKey) : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl transition-all duration-200 group relative min-w-0',
                collapsed ? 'w-12 h-12 justify-center' : 'px-3 py-2.5',
                isActive
                  ? 'bg-orange-50 text-primary font-semibold'
                  : 'text-gray-500 hover:text-content-main hover:bg-gray-50 font-medium'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm truncate">{t(labelKey)}</span>}
                {isActive && (
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle + Profile + Sign Out */}
      <div className={cn('mt-auto flex flex-col gap-3 w-full', collapsed ? 'items-center' : '')}>
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-content-main transition-colors"
          title={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        <div
          className={cn(
            'flex items-center justify-between gap-2 min-w-0 rounded-2xl p-1.5',
            collapsed ? 'flex-col justify-center' : 'px-2'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full bg-orange-100 text-primary flex items-center justify-center font-bold text-xs shadow-sm">
              {displayInitials}
            </div>
            {!collapsed && (
              <div className="leading-tight min-w-0">
                <p className="text-sm font-semibold text-content-main truncate">{displayName}</p>
                <p className="text-xs text-content-muted truncate">{displaySubtitle}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label={t('sidebar.signOut')}
            title={t('sidebar.signOut')}
            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:text-danger hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
