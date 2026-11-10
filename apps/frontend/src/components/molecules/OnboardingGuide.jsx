import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCompensation } from '../../context/CompensationContext';
import {
  Sparkles,
  Users,
  BarChart3,
  Sliders,
  ArrowRight,
  X,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  Database,
  Loader2,
} from 'lucide-react';

export function OnboardingGuide({ employeesCount = 0 }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { loadDemoData } = useCompensation();

  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const bannerKey = user?.id ? `equiwage_onboarding_banner_${user.id}` : 'equiwage_onboarding_banner_dismissed';
  const modalKey = user?.id ? `equiwage_onboarding_modal_${user.id}` : 'equiwage_onboarding_modal_dismissed';

  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem(bannerKey) === 'true';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Show modal automatically on first visit if no employees yet and modal hasn't been closed by this user
    const hasSeenModal = localStorage.getItem(modalKey) === 'true';
    if (!hasSeenModal && employeesCount === 0) {
      setIsModalOpen(true);
    }
  }, [employeesCount, modalKey]);

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem(bannerKey, 'true');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    localStorage.setItem(modalKey, 'true');
  };

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      if (loadDemoData) {
        await loadDemoData();
      }
      setIsModalOpen(false);
      localStorage.setItem(modalKey, 'true');
    } catch {
      // Ignored - context handles error display
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const steps = [
    {
      number: '1',
      title: t('onboarding.step1Title'),
      desc: t('onboarding.step1Desc'),
      icon: Users,
      route: '/employees',
      actionText: t('onboarding.step1Action'),
      primary: true,
      done: employeesCount > 0,
    },
    {
      number: '2',
      title: t('onboarding.step2Title'),
      desc: t('onboarding.step2Desc'),
      icon: BarChart3,
      route: '/bands',
      actionText: t('onboarding.step2Action'),
      primary: false,
      done: false,
    },
    {
      number: '3',
      title: t('onboarding.step3Title'),
      desc: t('onboarding.step3Desc'),
      icon: Sliders,
      route: '/dashboard/simulator',
      actionText: t('onboarding.step3Action'),
      primary: false,
      done: false,
    },
  ];

  const shouldShowBanner = (!isBannerDismissed || employeesCount === 0);

  return (
    <>
      {/* Onboarding Compact Bar in Dashboard */}
      <AnimatePresence>
        {shouldShowBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-surface dark:bg-[#181920]/80 border border-border dark:border-white/10 px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] dark:shadow-soft backdrop-blur-xl mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 dark:border-primary/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <h3 className="text-sm font-bold text-content-main tracking-tight">
                    {t('onboarding.bannerTitle')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-light border border-border text-content-muted">
                    {employeesCount === 0 ? t('onboarding.badgePending') : t('onboarding.badgeReady')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-border hover:bg-surface-light text-content-main font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-content-muted" />
                  <span>{t('onboarding.viewSteps')}</span>
                </button>

                {employeesCount === 0 && (
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    disabled={isLoadingDemo}
                    className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingDemo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    <span>{t('onboarding.tryDemo')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/employees')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{employeesCount === 0 ? t('onboarding.step1Action') : t('sidebar.employees')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {employeesCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDismissBanner}
                    className="p-1.5 rounded-xl text-content-muted hover:text-content-main hover:bg-surface-light transition-colors cursor-pointer"
                    title={t('common.close') || 'Cerrar'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome & First Steps Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl bg-surface dark:bg-[#181920] border border-border dark:border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-orange-500 text-white flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-content-main tracking-tight">
                      {user?.fullName
                        ? t('onboarding.welcomeUser', { name: user.fullName })
                        : t('onboarding.welcomeGeneric')}
                    </h2>
                    <p className="text-xs text-content-muted mt-0.5">
                      {t('onboarding.modalSubtitle')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-content-muted hover:text-content-main hover:bg-surface-light transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Steps list */}
              <div className="space-y-3 my-6 relative z-10">
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <div
                      key={step.number}
                      className={`p-3.5 rounded-xl border transition-all ${
                        step.primary
                          ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 shadow-soft'
                          : 'bg-surface-light/40 dark:bg-white/[0.02] border-border'
                      } flex items-start gap-3.5`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          step.primary
                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                            : 'bg-surface-light border border-border text-content-muted'
                        }`}
                      >
                        {step.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : step.number}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-content-main tracking-tight">
                            {step.title}
                          </h4>
                          {step.primary && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-wider">
                              {t('onboarding.recommendedStart')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-content-muted mt-1 leading-relaxed">
                          {step.desc}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            handleCloseModal();
                            navigate(step.route);
                          }}
                          className={`mt-2 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            step.primary
                              ? 'text-primary hover:text-primary-hover'
                              : 'text-content-muted hover:text-content-main'
                          }`}
                        >
                          <StepIcon className="w-3.5 h-3.5" />
                          <span>{step.actionText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom modal actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 relative z-10 border-t border-border">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-content-muted">
                    {t('onboarding.exploreFirst')}
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    disabled={isLoadingDemo}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5"
                  >
                    {isLoadingDemo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                    <span>{t('onboarding.tryDemo')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-border text-xs font-semibold text-content-muted hover:text-content-main hover:bg-surface-light transition-colors cursor-pointer"
                  >
                    {t('onboarding.dismiss')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      navigate('/employees');
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{t('onboarding.step1Action')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
