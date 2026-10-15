import React, { useRef, useState } from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { useCompensation } from '../context/CompensationContext';
import { Download, Upload, ShieldCheck, RotateCcw, FolderOpen, WifiOff, Clock } from 'lucide-react';

export function SettingsPage() {
  const { exportSession, importSession, resetSession, employees, bands, payrollSource } = useCompensation();
  const inputRef = useRef(null);
  const [status, setStatus] = useState(null);

  const handleExport = () => {
    exportSession();
    setStatus({ type: 'success', message: 'Your project session has been saved to a local file.' });
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      importSession(JSON.parse(text));
      setStatus({ type: 'success', message: `Session “${file.name}” loaded successfully.` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'We could not read this session file.' });
    }
  };

  const handleReset = () => {
    resetSession();
    setStatus({ type: 'success', message: 'Session reset to the sample dataset.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-main tracking-tight">Settings & Local Session</h2>
        <p className="text-sm text-content-muted mt-1">
          Save and reopen your work as a local project file — always offline, always private.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-bold text-content-main tracking-tight">Local Project Session</h3>
          </div>
          <p className="text-xs text-content-muted mb-6">
            Everything in your analysis — payroll, salary bands, and simulation settings — is stored
            in a single local file you control.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-xs text-content-muted mb-1">Employees in session</p>
              <p className="text-2xl font-bold text-content-main">{employees.length.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-xs text-content-muted mb-1">Job levels configured</p>
              <p className="text-2xl font-bold text-content-main">{bands.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Save Session File
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => inputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Load Session File
            </Button>
            <Button variant="ghost" className="gap-2" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              Reset to Sample
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
              {status.message}
            </div>
          )}

          <p className="text-xs text-content-muted mt-5 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Current source: <span className="font-semibold text-content-main">{payrollSource}</span>
          </p>
        </Card>

        <Card className="p-6">
          <div className="w-12 h-12 rounded-full bg-green-50 text-success flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-content-main mb-2">Privacy by Design</h3>
          <p className="text-xs text-content-muted leading-relaxed mb-4">
            Salary data is sensitive. EquiWage Analytics runs entirely on your computer with no
            internet connection — no payroll information ever leaves this device.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-success shrink-0" />
              <span className="text-xs text-content-main">No cloud uploads</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span className="text-xs text-content-main">Stored only on this machine</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-success shrink-0" />
              <span className="text-xs text-content-main">You own the project file</span>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Badge variant="successOutline" className="gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Secure Local Session
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
