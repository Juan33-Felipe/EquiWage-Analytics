import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { BandMatrixTable } from '../components/organisms/BandMatrixTable';
import { FileDropzone } from '../components/molecules/FileDropzone';
import { parseBandsFile } from '../utils/payrollParser';
import { useCompensation } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, SlidersHorizontal, Upload, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/cn';

export function SalaryBandsPage() {
  const navigate = useNavigate();
  const { uploadBandsFile, importBands, bands } = useCompensation();
  const { t } = useLanguage();
  const [mode, setMode] = useState('manual');
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
      <div>
        <h2 className="text-xl font-bold text-content-main tracking-tight">{t('bands.title')}</h2>
        <p className="text-sm text-content-muted mt-1">
          {t('bands.subtitleText')}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
              <h3 className="text-base font-bold text-content-main">{t('bands.configuration')}</h3>
            </div>
            <p className="text-xs text-content-muted mb-5">{t('bands.chooseHow')}</p>

            <div className="flex bg-gray-100 p-1 rounded-full mb-5 gap-1">
              <button
                onClick={() => setMode('import')}
                className={cn(
                  'flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all',
                  mode === 'import' ? 'bg-white text-content-main shadow-sm' : 'text-content-muted hover:text-content-main'
                )}
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('bands.importMarketBands')}</span>
              </button>
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all',
                  mode === 'manual' ? 'bg-white text-content-main shadow-sm' : 'text-content-muted hover:text-content-main'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('bands.manualRangeInput')}</span>
              </button>
            </div>

            {mode === 'import' ? (
              <FileDropzone
                onFile={handleFile}
                status={status}
                successMessage={successMessage}
                errorMessage={errorMessage}
                missingColumns={missingColumns}
                hint={t('bands.importHint')}
              />
            ) : (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-content-main mb-1">{t('bands.manualReady')}</p>
                <p className="text-xs text-content-muted leading-relaxed">
                  {t('bands.manualHint')}
                </p>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <p className="text-xs text-content-muted leading-relaxed">
                {t('bands.keptLocally')}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-content-main min-w-0 truncate">{t('bands.configuredJobLevels')}</h3>
              <Badge variant="successOutline" className="shrink-0">{t('bands.levelsCount', { count: bands.length })}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {bands.map((band) => (
                <span key={band.level} className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-50 text-primary font-bold text-sm">
                  {band.level}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <BandMatrixTable />
          <div className="flex justify-end">
            <Button variant="primary" className="gap-2 px-6" onClick={() => navigate('/dashboard/overview')}>
              {t('bands.validateAndRun')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
