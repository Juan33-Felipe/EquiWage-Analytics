import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Route guard that protects sensitive compensation and payroll screens.
 * Redirects unauthenticated visitors to the local Login view.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-surface rounded-xl shadow-soft border border-gray-100 px-8 py-7 flex flex-col items-center gap-3 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-primary">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-content-main">
            {t('auth.portalSubtitle')}
          </p>
          <p className="text-xs text-content-muted flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>{t('auth.verifyingSession')}</span>
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
