import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import {
  ShieldAlert,
  ShieldCheck,
  Globe,
  Info,
  DollarSign,
  AlertTriangle,
  Check,
  Edit2,
} from 'lucide-react';
import { formatCurrency } from '../../context/CompensationContext';

export function LegalComplianceCard({
  legalCompliance,
  referenceCountries = [],
  legalViolatorsCount = 0,
  legalComplianceCost = 0,
  onUpdateCompliance,
  className = '',
}) {
  const isEnabled = Boolean(legalCompliance?.enabled);
  const currentMinimumWage = Number(legalCompliance?.minimumWage ?? legalCompliance?.currentMinimumWage ?? 42000);
  const currentCountryCode = legalCompliance?.countryCode || 'US';

  const [isEditingWage, setIsEditingWage] = useState(false);
  const [tempWage, setTempWage] = useState(String(currentMinimumWage));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditingWage) {
      setTempWage(String(currentMinimumWage));
    }
  }, [currentMinimumWage, isEditingWage]);

  const handleToggle = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onUpdateCompliance({ enabled: !isEnabled });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountryChange = async (e) => {
    const selectedCode = e.target.value;
    const country = referenceCountries.find((c) => c.code === selectedCode);
    if (!country) return;

    const wage = Number(country.defaultMinimumWage);
    setTempWage(String(wage));
    setIsEditingWage(false);
    setIsSaving(true);
    try {
      await onUpdateCompliance({
        countryCode: country.code,
        countryName: country.name,
        minimumWage: wage,
        currency: country.currency || 'USD',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWage = async () => {
    const parsed = Number(tempWage);
    if (isNaN(parsed) || parsed < 0) return;

    setIsSaving(true);
    try {
      await onUpdateCompliance({ minimumWage: parsed });
      setIsEditingWage(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={`p-6 border border-slate-200/80 dark:border-dark-border shadow-soft ${className}`}>
      {/* Top Header with Icon, Title, and Enable/Disable Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
              isEnabled
                ? 'bg-orange-100 dark:bg-orange-950/60 text-primary dark:text-orange-400'
                : 'bg-slate-100 dark:bg-dark-border/40 text-slate-400'
            }`}
          >
            {isEnabled ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-content-main dark:text-dark-text tracking-tight">
                Cumplimiento de Salario Mínimo Legal
              </h3>
              <Badge variant={isEnabled ? 'legal' : 'default'} className="text-[10px] font-bold">
                {isEnabled ? 'Activo (Prioridad 1)' : 'Desactivado'}
              </Badge>
            </div>
            <p className="text-xs text-content-muted dark:text-dark-muted mt-0.5">
              Valida el piso salarial estatutario según regulación por país
            </p>
          </div>
        </div>

        {/* Accessible & Reliable Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={handleToggle}
          disabled={isSaving}
          className="group inline-flex items-center gap-2.5 cursor-pointer focus:outline-none select-none disabled:opacity-50"
          title={isEnabled ? 'Desactivar cumplimiento legal' : 'Activar cumplimiento legal'}
        >
          <div
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
              isEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-dark-border'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out mt-0.5 ${
                isEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-xs font-semibold text-content-main dark:text-dark-text">
            {isEnabled ? 'Habilitado' : 'Deshabilitado'}
          </span>
        </button>
      </div>

      {/* Main Controls Grid */}
      <div className={`mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {/* Country Selector Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-content-muted dark:text-dark-muted" />
            País de Referencia Regulatoria
          </label>
          <select
            value={currentCountryCode}
            onChange={handleCountryChange}
            disabled={!isEnabled || isSaving}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          >
            {referenceCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code}) — Mínimo Ref: {formatCurrency(c.defaultMinimumWage)}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-content-muted dark:text-dark-muted mt-1">
            Pre-cargado con marcos de LATAM, Norteamérica y Europa.
          </p>
        </div>

        {/* 100% Editable Numeric Input for Statutory Minimum Wage */}
        <div>
          <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-content-muted dark:text-dark-muted" />
              Salario Mínimo Legal Vigente (Anualizado)
            </span>
            <span className="text-[11px] text-primary dark:text-orange-400 font-bold">100% Editable</span>
          </label>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-content-muted dark:text-dark-muted font-bold text-sm">
              $
            </span>
            <input
              type="number"
              min="0"
              step="500"
              disabled={!isEnabled || isSaving}
              value={isEditingWage ? tempWage : currentMinimumWage}
              onFocus={() => {
                setIsEditingWage(true);
                setTempWage(String(currentMinimumWage));
              }}
              onChange={(e) => setTempWage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveWage();
                } else if (e.key === 'Escape') {
                  setIsEditingWage(false);
                  setTempWage(String(currentMinimumWage));
                }
              }}
              onBlur={() => {
                const parsed = Number(tempWage);
                if (!isNaN(parsed) && parsed >= 0 && parsed !== currentMinimumWage) {
                  handleSaveWage();
                } else {
                  setIsEditingWage(false);
                }
              }}
              className="w-full pl-8 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-mono"
            />
            {isEditingWage && (
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSaveWage}
                  disabled={isSaving}
                  className="px-2.5 py-1 rounded bg-primary text-white text-xs font-semibold flex items-center gap-1 hover:bg-primary-hover transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-content-muted dark:text-dark-muted mt-1">
            Permite ajustar el valor legal exacto según decretos gubernamentales recientes.
          </p>
        </div>
      </div>

      {/* Informative Tooltip Banner */}
      <div className="mt-4 p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-800/40 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary dark:text-orange-400 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-950 dark:text-orange-200 leading-relaxed">
          <span className="font-bold">Regla de Cumplimiento Legal:</span> La validación legal evalúa estrictamente el{' '}
          <span className="font-bold underline decoration-primary">Salario Base Fijo</span> (excluyendo bonos variables, comisiones o beneficios no remunerativos). Todo caso detectado se clasifica como Prioridad 1 y se nivela antes de calcular brechas de mercado P25/P50.
        </p>
      </div>

      {/* Live Impact Counters if violations exist */}
      {isEnabled && legalViolatorsCount > 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-orange-100/70 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-700 dark:text-orange-400" />
            <span className="text-xs font-bold text-orange-950 dark:text-orange-200">
              {legalViolatorsCount} {legalViolatorsCount === 1 ? 'empleado incumple' : 'empleados incumplen'} el salario mínimo legal
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-orange-900 dark:text-orange-300">
            Fondo de Cumplimiento: {formatCurrency(legalComplianceCost)}
          </span>
        </div>
      )}
    </Card>
  );
}
