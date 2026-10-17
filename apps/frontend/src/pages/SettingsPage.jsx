import React, { useRef, useState } from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { SelectPill } from '../components/atoms/SelectPill';
import { useCompensation } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Download, Upload, ShieldCheck, RotateCcw, FolderOpen, WifiOff, Clock, Check } from 'lucide-react';

export function SettingsPage() {
  const { exportSession, importSession, resetSession, employees, bands, payrollSource } = useCompensation();
  const { t, tSource, language: currentLanguage, setLanguage } = useLanguage();
  const { theme: currentTheme, setTheme } = useTheme();
  const inputRef = useRef(null);
  const [status, setStatus] = useState(null);

  const [langDraft, setLangDraft] = useState(null);
  const [themeDraft, setThemeDraft] = useState(null);

  const selectedLanguage = langDraft?.base === currentLanguage ? langDraft.value : currentLanguage;
  const selectedTheme = themeDraft?.base === currentTheme ? themeDraft.value : currentTheme;

  const hasPendingChanges = selectedLanguage !== currentLanguage || selectedTheme !== currentTheme;

  const handleExport = async () => {
    await exportSession();
    setStatus({ type: 'success', key: 'settings.sessionSaved' });
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      await importSession(JSON.parse(text));
      setStatus({ type: 'success', key: 'settings.sessionLoaded', params: { name: file.name } });
    } catch {
      setStatus({ type: 'error', key: 'settings.invalidSession' });
    }
  };

  const handleReset = async () => {
    await resetSession();
    setStatus({ type: 'success', key: 'settings.sessionReset' });
  };

  const handleLanguageChange = (value) => {
    setLangDraft({ base: currentLanguage, value });
  };

  const handleThemeChange = (value) => {
    setThemeDraft({ base: currentTheme, value });
  };

  const handleApplySettings = () => {
    const languageChanged = selectedLanguage !== currentLanguage;
    const themeChanged = selectedTheme !== currentTheme;

    if (languageChanged) {
      setLanguage(selectedLanguage);
    }
    if (themeChanged) {
      setTheme(selectedTheme);
    }

    setLangDraft(null);
    setThemeDraft(null);

    if (languageChanged && themeChanged) {
      setStatus({ type: 'success', key: 'settings.settingsApplied' });
    } else if (themeChanged) {
      setStatus({ type: 'success', key: 'settings.themeApplied' });
    } else {
      setStatus({ type: 'success', key: 'settings.languageApplied' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-main tracking-tight">{t('settings.title')}</h2>
        <p className="text-sm text-content-muted mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-lg font-bold text-content-main tracking-tight">{t('settings.localProjectSession')}</h3>
          </div>
          <p className="text-xs text-content-muted mb-6">
            {t('settings.everything')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 min-w-0">
              <p className="text-xs text-content-muted mb-1 truncate">{t('settings.employeesInSession')}</p>
              <p className="text-2xl font-bold text-content-main">{employees.length.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 min-w-0">
              <p className="text-xs text-content-muted mb-1 truncate">{t('settings.jobLevelsConfigured')}</p>
              <p className="text-2xl font-bold text-content-main">{bands.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4 shrink-0" />
              {t('settings.saveSessionFile')}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => inputRef.current?.click()}>
              <Upload className="w-4 h-4 shrink-0" />
              {t('settings.loadSessionFile')}
            </Button>
            <Button variant="ghost" className="gap-2" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 shrink-0" />
              {t('settings.resetToSample')}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(event) => handleImport(event.target.files?.[0])}
            />
          </div>

          {status && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                status.type === 'error'
                  ? 'bg-red-50 border border-red-100 text-danger'
                  : 'bg-green-50 border border-green-100 text-success'
              }`}
            >
              {status.key ? t(status.key, status.params) : status.message}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-sm font-medium text-content-main mb-2">{t('settings.language')}</p>
              <SelectPill
                ariaLabel={t('settings.selectLanguage')}
                value={selectedLanguage}
                options={[
                  { value: 'es', label: t('settings.spanish') },
                  { value: 'en', label: t('settings.english') },
                ]}
                onChange={handleLanguageChange}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-content-main mb-2">{t('settings.theme')}</p>
              <SelectPill
                ariaLabel={t('settings.selectTheme')}
                value={selectedTheme}
                options={[
                  { value: 'light', label: t('settings.lightMode') },
                  { value: 'dark', label: t('settings.darkMode') },
                ]}
                onChange={handleThemeChange}
              />
            </div>

            {hasPendingChanges && (
              <Button
                variant="primary"
                className="gap-2"
                onClick={handleApplySettings}
              >
                <Check className="w-4 h-4" />
                {t('common.apply')}
              </Button>
            )}
          </div>

          <p className="text-xs text-content-muted mt-5 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{t('settings.currentSource')}</span>
            <span className="font-semibold text-content-main truncate">{tSource(payrollSource)}</span>
          </p>
        </Card>

        <Card className="p-6">
          <div className="w-12 h-12 rounded-full bg-green-50 text-success flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-content-main mb-2">{t('settings.privacyByDesign')}</h3>
          <p className="text-xs text-content-muted leading-relaxed mb-4">
            {t('settings.salaryDataSensitive')}
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-success shrink-0" />
              <span className="text-xs text-content-main">{t('settings.noCloudUploads')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span className="text-xs text-content-main">{t('settings.storedOnlyMachine')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-success shrink-0" />
              <span className="text-xs text-content-main">{t('settings.youOwnProject')}</span>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Badge variant="successOutline" className="gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              {t('settings.secureLocalSession')}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
