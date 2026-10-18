import React, { useRef, useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Moon,
  RefreshCw,
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

export function RegisterPage() {
  const { isAuthenticated, isAuthenticating, authError, register, verifyCode, resendCode, clearAuthError } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Registration step: 'form' | 'verification'
  const [step, setStep] = useState('form');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [devCodeHint, setDevCodeHint] = useState(null);

  // 4-digit code states
  const [digits, setDigits] = useState(['', '', '', '']);
  const digitInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [countdown, setCountdown] = useState(0);
  const [resendNotification, setResendNotification] = useState(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      return t('auth.nameRequired');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return t('auth.invalidEmail');
    }
    if (!password || password.length < 6) {
      return t('auth.passwordTooShort');
    }
    if (password !== confirmPassword) {
      return t('auth.passwordMismatch');
    }
    return null;
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    clearAuthError();
    setLocalError(null);

    const validationMsg = validateForm();
    if (validationMsg) {
      setLocalError(validationMsg);
      return;
    }

    const result = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    });

    if (result.ok) {
      setStep('verification');
      setCountdown(45);
      if (result.data?.devCode) {
        setDevCodeHint(result.data.devCode);
      }
      setTimeout(() => {
        digitInputRefs[0]?.current?.focus();
      }, 150);
    }
  };

  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (cleaned.length > 1) {
      // Handle paste
      const pasted = cleaned.slice(0, 4).split('');
      for (let i = 0; i < 4; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 3);
      digitInputRefs[nextFocus]?.current?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setDigits(newDigits);

    // Auto advance focus
    if (cleaned && index < 3) {
      digitInputRefs[index + 1]?.current?.focus();
    }
  };

  const handleDigitKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      digitInputRefs[index - 1]?.current?.focus();
    }
  };

  const handlePasteDigits = (event) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);
    const nextFocus = Math.min(pastedData.length, 3);
    digitInputRefs[nextFocus]?.current?.focus();
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    clearAuthError();
    setLocalError(null);

    const code = digits.join('');
    if (code.length !== 4) {
      setLocalError(t('auth.enterDigits'));
      return;
    }

    const result = await verifyCode({
      email: email.trim().toLowerCase(),
      code,
    });

    if (result.ok) {
      navigate('/dashboard/overview', {
        replace: true,
        state: { successMessage: t('auth.accountCreatedSuccess') },
      });
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResendNotification(null);
    clearAuthError();
    setLocalError(null);

    const result = await resendCode(email.trim().toLowerCase());
    if (result.ok) {
      setCountdown(45);
      setResendNotification(t('auth.codeResent'));
      if (result.data?.devCode) {
        setDevCodeHint(result.data.devCode);
      }
      setDigits(['', '', '', '']);
      digitInputRefs[0]?.current?.focus();
    }
  };

  const activeErrorMessage = localError || authError?.message;

  return (
    <div className="min-h-screen bg-background text-content-main flex flex-col justify-between p-4 sm:p-8 transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link to="/login" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform">
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
        </Link>

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

      {/* Main Container Card (Solid Surface, 24px Radius, Soft Shadow) */}
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

            <div className="mt-8 pt-6 border-t border-orange-300">
              <p className="text-xs text-orange-100 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Local Verification & Account Security</span>
              </p>
            </div>
          </div>

          {/* Right Form / Verification Container */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-surface">
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                /* Step 1: Registration Form */
                <motion.div
                  key="registration-form"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('auth.portalSubtitle')}</span>
                    </span>
                    <h1 className="text-2xl font-bold text-content-main tracking-tight">
                      {t('auth.registerTitle')}
                    </h1>
                    <p className="text-sm text-content-muted mt-1">
                      {t('auth.registerSubtitle')}
                    </p>
                  </div>

                  {activeErrorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3.5 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
                      <p className="text-xs font-semibold leading-relaxed text-danger">
                        {activeErrorMessage}
                      </p>
                    </motion.div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
                    {/* First & Last Name row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <FormInput
                        id="reg-first-name"
                        name="firstName"
                        type="text"
                        label={t('auth.firstNameLabel')}
                        placeholder={t('auth.firstNamePlaceholder')}
                        icon={User}
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (localError) setLocalError(null);
                        }}
                        hasError={Boolean(activeErrorMessage && !firstName.trim())}
                      />
                      <FormInput
                        id="reg-last-name"
                        name="lastName"
                        type="text"
                        label={t('auth.lastNameLabel')}
                        placeholder={t('auth.lastNamePlaceholder')}
                        icon={User}
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (localError) setLocalError(null);
                        }}
                        hasError={Boolean(activeErrorMessage && !lastName.trim())}
                      />
                    </div>

                    {/* Email */}
                    <FormInput
                      id="reg-email"
                      name="email"
                      type="email"
                      label={t('auth.emailLabel')}
                      placeholder={t('auth.emailPlaceholder')}
                      icon={Mail}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (localError) setLocalError(null);
                      }}
                      hasError={Boolean(activeErrorMessage && activeErrorMessage.includes('email'))}
                    />

                    {/* Password */}
                    <FormInput
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      label={t('auth.passwordLabel')}
                      placeholder={t('auth.passwordPlaceholder')}
                      icon={Lock}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (localError) setLocalError(null);
                      }}
                      hasError={Boolean(activeErrorMessage && activeErrorMessage.includes('Password'))}
                      trailingAction={
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                          className="p-1.5 rounded-full text-content-muted hover:text-content-main transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    {/* Confirm Password */}
                    <FormInput
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      label={t('auth.confirmPasswordLabel')}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      icon={Lock}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (localError) setLocalError(null);
                      }}
                      hasError={Boolean(
                        (confirmPassword && password !== confirmPassword) ||
                          (activeErrorMessage && activeErrorMessage.includes('match'))
                      )}
                      trailingAction={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                          className="p-1.5 rounded-full text-content-muted hover:text-content-main transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    {/* Submit CTA */}
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
                          {isAuthenticating ? t('auth.creatingAccount') : t('auth.createAccountButton')}
                        </span>
                      </motion.button>
                    </div>

                    {/* Return to Login link */}
                    <div className="text-center pt-2">
                      <p className="text-xs text-content-muted">
                        {t('auth.haveAccount')}{' '}
                        <Link
                          to="/login"
                          className="font-semibold text-primary hover:text-primary-hover underline underline-offset-4 transition-colors"
                        >
                          {t('auth.signIn')}
                        </Link>
                      </p>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* Step 2: 4-Digit Email Verification */
                <motion.div
                  key="verification-step"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-muted hover:text-primary transition-colors mb-4"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{t('auth.changeEmail')}</span>
                    </button>

                    <h1 className="text-2xl font-bold text-content-main tracking-tight">
                      {t('auth.verificationTitle')}
                    </h1>
                    <p className="text-sm text-content-muted mt-1 leading-relaxed">
                      {t('auth.verificationSubtitle').replace('{email}', email)}
                    </p>
                  </div>

                  {resendNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-2 text-xs font-semibold text-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{resendNotification}</span>
                    </motion.div>
                  )}

                  {activeErrorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3.5 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
                      <p className="text-xs font-semibold leading-relaxed text-danger">
                        {activeErrorMessage}
                      </p>
                    </motion.div>
                  )}

                  {/* Dev Code Hint Banner if in local test environment */}
                  {devCodeHint && (
                    <div className="mb-5 rounded-2xl bg-orange-50 border border-orange-200 p-4">
                      <p className="text-xs font-bold text-content-main flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Development 4-Digit Code Simulated</span>
                      </p>
                      <p className="text-xs text-content-muted mt-1">
                        Use this code or check your backend terminal:
                      </p>
                      <p className="text-lg font-mono font-bold tracking-widest text-primary mt-1">
                        {devCodeHint}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleVerifySubmit} className="space-y-6">
                    {/* 4 Digit Inputs with auto-focus and paste handling */}
                    <div className="flex justify-center items-center gap-3.5 my-4" onPaste={handlePasteDigits}>
                      {digits.map((digit, index) => (
                        <input
                          key={index}
                          ref={digitInputRefs[index]}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(index, e)}
                          className={cn(
                            'w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-bold font-mono rounded-2xl bg-gray-50 border border-gray-200 text-content-main transition-all duration-150 focus:outline-none focus:border-primary focus:bg-surface focus:ring-2 focus:ring-orange-100',
                            activeErrorMessage && 'border-danger focus:border-danger'
                          )}
                        />
                      ))}
                    </div>

                    {/* Resend Action */}
                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <span className="text-content-muted">
                        {countdown > 0
                          ? t('auth.resendIn').replace('{seconds}', String(countdown))
                          : 'Did not receive the code?'}
                      </span>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={countdown > 0}
                        className={cn(
                          'font-semibold inline-flex items-center gap-1.5 transition-colors',
                          countdown > 0
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-primary hover:text-primary-hover underline underline-offset-4'
                        )}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t('auth.resendCode')}</span>
                      </button>
                    </div>

                    {/* Verify CTA */}
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isAuthenticating || digits.join('').length !== 4}
                        className={cn(
                          'w-full rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm py-3.5 px-6 shadow-sm transition-colors flex items-center justify-center gap-2',
                          (isAuthenticating || digits.join('').length !== 4) && 'opacity-65 cursor-not-allowed'
                        )}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isAuthenticating ? t('auth.verifyingCode') : t('auth.verifyButton')}
                        </span>
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
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
