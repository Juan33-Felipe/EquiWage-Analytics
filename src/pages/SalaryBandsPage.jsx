import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { BandMatrixTable } from '../components/organisms/BandMatrixTable';
import { FileDropzone } from '../components/molecules/FileDropzone';
import { parseBandsFile } from '../utils/payrollParser';
import { useCompensation } from '../context/CompensationContext';
import { ArrowRight, SlidersHorizontal, Upload, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/cn';

export function SalaryBandsPage() {
  const navigate = useNavigate();
  const { importBands, bands } = useCompensation();
  const [mode, setMode] = useState('manual');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    setStatus('loading');
    setError('');
    const result = await parseBandsFile(file);
    if (result.ok) {
      importBands(result.bands);
      setStatus('success');
      setMessage(`${file.name} • ${result.rowCount} level ranges imported`);
    } else {
      setStatus('error');
      setError(result.error || 'We could not find salary ranges in this file.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-main tracking-tight">Salary Bands</h2>
        <p className="text-sm text-content-muted mt-1">
          Configure market salary ranges by job level so every employee can be compared fairly.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-content-main">Salary Bands Configuration</h3>
            </div>
            <p className="text-xs text-content-muted mb-5">Choose how you want to maintain your market data</p>

            <div className="flex bg-gray-100 p-1 rounded-full mb-5">
              <button
                onClick={() => setMode('import')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all',
                  mode === 'import' ? 'bg-white text-content-main shadow-sm' : 'text-content-muted hover:text-content-main'
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                Import Market Bands
              </button>
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all',
                  mode === 'manual' ? 'bg-white text-content-main shadow-sm' : 'text-content-muted hover:text-content-main'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Manual Range Input
              </button>
            </div>

            {mode === 'import' ? (
              <FileDropzone
                onFile={handleFile}
                status={status}
                successMessage={message}
                errorMessage={error}
                hint="CSV or Excel • Level, P25, P50, P75"
              />
            ) : (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-content-main mb-1">Manual editing is ready</p>
                <p className="text-xs text-content-muted leading-relaxed">
                  Edit any minimum, median, or maximum value directly in the matrix. Changes update
                  the salary audit and budget simulator immediately.
                </p>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <p className="text-xs text-content-muted leading-relaxed">
                Market ranges are kept locally and are never uploaded or shared.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-content-main">Configured Job Levels</h3>
              <Badge variant="successOutline">{bands.length} levels</Badge>
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
              Validate & Run Audit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
