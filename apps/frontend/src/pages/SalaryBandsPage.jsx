import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { BandMatrixTable } from '../components/organisms/BandMatrixTable';
import { LegalComplianceCard } from '../components/organisms/LegalComplianceCard';
import { FileDropzone } from '../components/molecules/FileDropzone';
import { parseBandsFile } from '../utils/payrollParser';
import { useCompensation } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowRight,
  SlidersHorizontal,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Layers,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function SalaryBandsPage() {
  const navigate = useNavigate();
  const {
    uploadBandsFile,
    importBands,
    bands,
    legalCompliance,
    referenceCountries,
    metrics,
    updateLegalCompliance,
  } = useCompensation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('bands'); // 'bands' | 'compliance'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [uploadMeta, setUploadMeta] = useState(null);
  const [errorKey, setErrorKey] = useState('');
  const [missingColumns, setMissingColumns] = useState([]);

  const handleFile = async (file) => {
    setStatus('loading');
    setErrorKey('');
    setMissingColumns([]);

    const backendResult = await uploadBandsFile(file);
    if (backendResult.ok) {
      setStatus('success');
      setUploadMeta({ name: file.name, count: backendResult.rowCount });
      return;
    }

    if (backendResult.missing?.length || backendResult.errorKey) {
      setStatus('error');
      setUploadMeta(null);
      setErrorKey(backendResult.errorKey || 'bands.couldNotFind');
      setMissingColumns(backendResult.missing || []);
      return;
    }

    const result = await parseBandsFile(file);
    if (result.ok) {
      await importBands(result.bands);
      setStatus('success');
      setUploadMeta({ name: file.name, count: result.rowCount });
    } else {
      setStatus('error');
      setUploadMeta(null);
      setErrorKey(result.errorKey || 'bands.couldNotFind');
    }
  };

  const successMessage = uploadMeta
    ? t('bands.rangesImported', { name: uploadMeta.name, count: uploadMeta.count })
    : '';
  const errorMessage = errorKey ? t(errorKey) : '';

  return (
    <div className="space-y-6">
      {/* Top Header with Tab Switcher & Navigation Flow */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">{t('bands.title')}</h2>
          <p className="text-sm text-content-muted mt-1">
            {t('bands.subtitleText')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="gap-2 text-xs font-semibold"
          >
            <Upload className="w-4 h-4 text-primary" />
            Cargar Bandas (CSV / Excel)
          </Button>

          <Button
            variant="dark"
            onClick={() => navigate('/dashboard/distribution')}
            className="gap-2 text-xs"
          >
            Auditar Curva Salarial
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Visual Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface-light border border-border rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('bands')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
            activeTab === 'bands'
              ? 'bg-surface text-content-main shadow-soft border border-border/80'
              : 'text-content-muted hover:text-content-main'
          )}
        >
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>{t('bands.matrixTab')}</span>
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            {bands.length} {t('bands.levelsSuffix')}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
            activeTab === 'compliance'
              ? 'bg-surface text-content-main shadow-soft border border-border/80'
              : 'text-content-muted hover:text-content-main'
          )}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-primary" />
          <span>{t('bands.legalTab')}</span>
          {metrics.legalViolationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {metrics.legalViolationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Full-Width Salary Bands Matrix Table */}
      {activeTab === 'bands' && (
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden w-full">
            <BandMatrixTable />

            {/* Guided Footer Banner */}
            <div className="p-4 sm:p-5 bg-surface-light border-t border-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-content-muted">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>{t('bands.footerNotice')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="text-xs" onClick={() => setActiveTab('compliance')}>
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  {t('bands.checkLegal')}
                </Button>
                <Button variant="primary" className="gap-2 text-xs" onClick={() => navigate('/dashboard/distribution')}>
                  <span>{t('bands.auditCurve')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Legal Minimum Wage Compliance */}
      {activeTab === 'compliance' && (
        <div className="space-y-6 max-w-4xl">
          <LegalComplianceCard
            legalCompliance={legalCompliance}
            referenceCountries={referenceCountries}
            legalViolatorsCount={metrics.legalViolationsCount}
            legalComplianceCost={metrics.legalComplianceCost}
            onUpdateCompliance={updateLegalCompliance}
          />
        </div>
      )}

      {/* Focus Modal: Bands File Upload */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl border border-border max-w-xl w-full p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-content-main tracking-tight">{t('bands.modalTitle')}</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-content-muted hover:text-content-main hover:bg-surface-light transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-content-muted">
              {t('bands.modalSubtitle')}
            </p>

            <FileDropzone
              onFile={handleFile}
              status={status}
              successMessage={successMessage}
              errorMessage={errorMessage}
              missingColumns={missingColumns}
              hint={t('bands.dropHint')}
            />

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-content-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Almacenamiento Local Seguro • 100% Privado
              </span>
              <Button
                variant="primary"
                onClick={() => setIsImportModalOpen(false)}
                className="text-xs"
              >
                {t('common.done')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
