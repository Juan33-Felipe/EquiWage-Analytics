import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  TrendingUp,
  User,
} from 'lucide-react';
import { FormInput } from '../components/atoms/FormInput';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

export function LoginPage() {
  const { isAuthenticated, isAuthenticating, authError, login, clearAuthError } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localValidationError, setLocalValidationError] = useState(null);

  const destination = location.state?.from?.pathname || '/dashboard/overview';

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleIdentifierChange = (event) => {
    setIdentifier(event.target.value);
    if (localValidationError) setLocalValidationError(null);
    if (authError) clearAuthError();
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    if (localValidationError) setLocalValidationError(null);
    if (authError) clearAuthError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setLocalValidationError(t('auth.missingCredentials'));
      return;
    }

    const result = await login({
      identifier: identifier.trim(),
      password,
      rememberMe,
    });

    if (result.ok) {
      navigate(destination, { replace: true });
    }
  };

  const activeErrorMessage =
    localValidationError ||
    (authError
      ? authError.errorKey === 'auth.missingCredentials'
        ? t('auth.missingCredentials')
        : t('auth.invalidCredentials')
      : null);

  return (
    <div className="min-h-screen bg-background text-content-main flex flex-col justify-between p-4 sm:p-8 transition-colors duration-200">
      {/* Top Bar: Brand Identity + Language & Theme Controls */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-primary shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-content-main tracking-tight leading-none">
              EquiWage Analytics
            </p>
            <p className="text-xs text-content-muted mt-1">
              {t('auth.portalSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="h-10 px-3.5 rounded-full bg-surface border border-gray-200 flex items-center gap-2 text-xs font-semibold text-content-main hover:bg-gray-50 transition-colors shadow-sm"
            title={t('settings.language')}
          >
            <Globe className="w-4 h-4 text-primary" />
            <span>{language === 'en' ? 'ES' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
            title={isDark ? t('header.lightMode') : t('header.darkMode')}
            className="w-10 h-10 rounded-full bg-surface border border-gray-200 flex items-center justify-center text-gray-500 hover:text-content-main hover:bg-gray-50 transition-colors shadow-sm"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Centered Login Card (Warm Enterprise / Soft UI — Solid Surface, 24px Radius, Soft Shadow) */}
      <main className="flex-1 flex items-center justify-center my-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="w-full max-w-5xl bg-surface rounded-[24px] shadow-soft border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Left Decorative Corporate Gradient Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#EA580C] via-[#F97316] to-[#FED7AA] p-8 sm:p-10 text-white flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#9A3412] text-orange-50 text-xs font-semibold tracking-wide mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('auth.secureLocalBadge')}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug mb-3 text-white">
                {t('auth.heroTitle')}
              </h2>
              <p className="text-sm text-orange-50 leading-relaxed">
                {t('auth.heroSubtitle')}
              </p>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-surface">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>{t('auth.portalSubtitle')}</span>
              </span>
              <h1 className="text-2xl font-bold text-content-main tracking-tight">
                {t('auth.welcomeTitle')}
              </h1>
              <p className="text-sm text-content-muted mt-1">
                {t('auth.welcomeSubtitle')}
              </p>
            </div>

            {location.state?.successMessage && !activeErrorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                className="mb-5 rounded-2xl bg-green-50 border border-green-100 px-4 py-3.5 flex items-start gap-3"
              >
                <CheckCircle2
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: '#10B981' }}
                />
                <p
                  className="text-xs font-semibold leading-relaxed"
                  style={{ color: '#065F46' }}
                >
                  {location.state.successMessage}
                </p>
              </motion.div>
            )}

            {activeErrorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3.5 flex items-start gap-3"
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: '#EF4444' }}
                />
                <p
                  className="text-xs font-semibold leading-relaxed"
                  style={{ color: '#EF4444' }}
                >
                  {activeErrorMessage}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormInput
                id="login-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                label={t('auth.identifierLabel')}
                placeholder={t('auth.identifierPlaceholder')}
                icon={User}
                value={identifier}
                onChange={handleIdentifierChange}
                hasError={Boolean(activeErrorMessage)}
              />

              <FormInput
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                label={t('auth.passwordLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                icon={Lock}
                value={password}
                onChange={handlePasswordChange}
                hasError={Boolean(activeErrorMessage)}
                trailingAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="p-1.5 rounded-full text-content-muted hover:text-content-main transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-[#F97316]"
                  />
                  <span className="text-xs font-medium text-content-muted">
                    {t('auth.rememberSession')}
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isAuthenticating}
                  className={cn(
                    'w-full rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm py-3.5 px-6 shadow-sm transition-colors flex items-center justify-center gap-2',
                    isAuthenticating && 'opacity-75 cursor-not-allowed'
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isAuthenticating ? t('auth.signingIn') : t('auth.signInButton')}
                  </span>
                </motion.button>
              </div>

              {/* Navigation to Registration view */}
              <div className="text-center pt-2">
                <p className="text-xs text-content-muted">
                  {t('auth.noAccount')}{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-primary hover:text-primary-hover underline underline-offset-4 transition-colors"
                  >
                    {t('auth.signUp')}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center py-2">
        <p className="text-xs text-content-muted">
          {t('auth.portalSubtitle')} • {t('auth.secureLocalBadge')}
        </p>
      </footer>
    </div>
  );
}
