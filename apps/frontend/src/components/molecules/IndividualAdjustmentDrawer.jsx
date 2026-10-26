import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Sliders, ShieldAlert, AlertTriangle, CheckCircle2, RotateCcw, Save } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Avatar } from '../atoms/Avatar';
import { formatCurrency, getInitials } from '../../context/CompensationContext';

export function IndividualAdjustmentDrawer({
  isOpen,
  onClose,
  employee,
  legalCompliance,
  onSaveAdjustment,
  onRemoveAdjustment,
}) {
  const [adjustmentType, setAdjustmentType] = useState('amount'); // 'amount' | 'percent'
  const [inputValue, setInputValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      if (employee.manualAdjustment) {
        setAdjustmentType(employee.manualAdjustment.type || 'amount');
        setInputValue(String(employee.manualAdjustment.value || 0));
        setNotes(employee.manualAdjustment.notes || '');
      } else {
        // Suggested adjustment if below band or min wage
        let suggested = 0;
        const minWage = (legalCompliance?.enabled && legalCompliance?.currentMinimumWage) || 0;
        const belowMinWage = minWage > 0 && employee.currentSalary < minWage;
        if (belowMinWage) {
          suggested = minWage - employee.currentSalary;
        } else if (employee.band && employee.currentSalary < employee.band.min) {
          suggested = employee.band.min - employee.currentSalary;
        }
        setAdjustmentType('amount');
        setInputValue(suggested > 0 ? String(suggested) : '');
        setNotes('');
      }
    }
  }, [employee, legalCompliance, isOpen]);

  const numValue = Number(inputValue) || 0;

  const simulationPreview = useMemo(() => {
    if (!employee) return null;
    const base = employee.currentSalary;
    let increaseAmount = 0;
    if (adjustmentType === 'percent') {
      increaseAmount = Math.round((base * numValue) / 100);
    } else {
      increaseAmount = Math.max(0, Math.round(numValue));
    }
    const newSalary = base + increaseAmount;
    const increasePercent = base > 0 ? (increaseAmount / base) * 100 : 0;

    // Band positioning preview
    const band = employee.band;
    let newStatus = 'unknown';
    let newGap = 0;
    let newCompaRatio = 0;
    if (band) {
      if (newSalary < band.min) newStatus = 'below';
      else if (newSalary > band.max) newStatus = 'above';
      else newStatus = 'aligned';
      newGap = band.median > 0 ? (newSalary - band.median) / band.median : 0;
      newCompaRatio = band.median > 0 ? (newSalary / band.median) * 100 : 100;
    }

    const minWage = (legalCompliance?.enabled && legalCompliance?.currentMinimumWage) || 0;
    const isNowAboveMinWage = minWage > 0 ? newSalary >= minWage : true;

    return {
      increaseAmount,
      increasePercent,
      newSalary,
      newStatus,
      newGap,
      newCompaRatio,
      isNowAboveMinWage,
    };
  }, [employee, adjustmentType, numValue, legalCompliance]);

  if (!isOpen || !employee) return null;

  const handleSave = async () => {
    if (!employee) return;
    setIsSubmitting(true);
    try {
      await onSaveAdjustment({
        employeeId: employee.id,
        type: adjustmentType,
        value: Math.max(0, Number(inputValue) || 0),
        notes: notes.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!employee) return;
    setIsSubmitting(true);
    try {
      await onRemoveAdjustment(employee.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        {/* Drawer container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-screen max-w-md bg-surface dark:bg-dark-surface shadow-2xl border-l border-slate-100 dark:border-dark-border flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-primary flex items-center justify-center shadow-sm">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-main dark:text-dark-text tracking-tight">
                    Micro-Simulación Individual
                  </h3>
                  <p className="text-xs text-content-muted dark:text-dark-muted">
                    Ajuste 1-a-1 de salario con impacto en tiempo real
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-content-muted hover:text-content-main hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Employee Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-border/40 border border-slate-200/60 dark:border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar initials={getInitials(employee.name)} className="w-11 h-11 text-xs shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-content-main dark:text-dark-text truncate">{employee.name}</p>
                    <p className="text-xs text-content-muted dark:text-dark-muted truncate">
                      {employee.role} • {employee.department}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono bg-orange-100 dark:bg-orange-950/60 text-primary px-1.5 py-0.5 rounded font-bold">
                        Nivel {employee.level}
                      </span>
                      <span className="text-[11px] text-content-muted dark:text-dark-muted font-mono">
                        {employee.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal minimum wage badge if applicable */}
              {employee.isBelowMinimumWage && (
                <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-primary dark:text-orange-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-orange-900 dark:text-orange-300">
                    <p className="font-bold">Violación de Salario Mínimo Legal</p>
                    <p className="mt-0.5">
                      El salario actual ({formatCurrency(employee.currentSalary)}) está por debajo del piso legal obligatorio{' '}
                      ({formatCurrency(legalCompliance.currentMinimumWage)}). Requiere un aumento mínimo de{' '}
                      <span className="font-bold text-orange-700 dark:text-orange-300">
                        {formatCurrency(employee.minimumWageDeficit)}
                      </span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Current Band Metrics */}
              {employee.band && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-content-main dark:text-dark-text">Banda Salarial Nivel {employee.level}</span>
                    <span className="text-content-muted dark:text-dark-muted">
                      {formatCurrency(employee.band.min)} – {formatCurrency(employee.band.max)}
                    </span>
                  </div>
                  {/* Visual band bar */}
                  <div className="relative h-3 rounded-full bg-slate-200 dark:bg-dark-border overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-100 dark:bg-emerald-950/60"
                      style={{
                        left: '0%',
                        width: '100%',
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-500/30"
                      style={{
                        left: '0%',
                        right: '0%',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-content-muted dark:text-dark-muted">
                    <span>Mín: {formatCurrency(employee.band.min)}</span>
                    <span className="font-medium text-primary">Mediana: {formatCurrency(employee.band.median)}</span>
                    <span>Máx: {formatCurrency(employee.band.max)}</span>
                  </div>
                </div>
              )}

              {/* Adjustment Inputs */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-content-main dark:text-dark-text uppercase tracking-wider">
                  Configurar Aumento Propuesto
                </label>

                {/* Type Selector (Amount / Percent) */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-dark-border/40">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('amount')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      adjustmentType === 'amount'
                        ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm'
                        : 'text-content-muted dark:text-dark-muted hover:text-content-main'
                    }`}
                  >
                    Monto Fijo (+$ USD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('percent')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      adjustmentType === 'percent'
                        ? 'bg-surface dark:bg-dark-surface text-primary shadow-sm'
                        : 'text-content-muted dark:text-dark-muted hover:text-content-main'
                    }`}
                  >
                    Porcentaje (+% Base)
                  </button>
                </div>

                {/* Input with prefix */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted dark:text-dark-muted font-bold text-sm">
                    {adjustmentType === 'amount' ? '+$' : '+%'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step={adjustmentType === 'amount' ? '500' : '0.5'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={adjustmentType === 'amount' ? '5000' : '10'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Optional justification notes */}
                <div>
                  <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1">
                    Justificación / Notas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Nivelación salarial por mérito o ajuste extraordinario."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>

              {/* Real-Time Impact Simulation Preview */}
              {simulationPreview && (
                <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold text-content-main dark:text-dark-text uppercase tracking-wider">
                      Vista Previa de Impacto en Tiempo Real
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-surface dark:bg-dark-surface border border-slate-100 dark:border-dark-border">
                      <p className="text-[11px] text-content-muted dark:text-dark-muted font-medium">Salario Actual</p>
                      <p className="text-sm font-bold text-content-main dark:text-dark-text mt-0.5">
                        {formatCurrency(employee.currentSalary)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface dark:bg-dark-surface border border-orange-200 dark:border-orange-900/60">
                      <p className="text-[11px] text-primary font-bold">Nuevo Salario Propuesto</p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {formatCurrency(simulationPreview.newSalary)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-orange-100 dark:border-orange-900/40">
                    <span className="text-content-muted dark:text-dark-muted">Incremento Calculado:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(simulationPreview.increaseAmount)} (+
                      {simulationPreview.increasePercent.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-muted dark:text-dark-muted">Posición en Banda:</span>
                    <Badge
                      variant={
                        simulationPreview.newStatus === 'aligned'
                          ? 'successOutline'
                          : simulationPreview.newStatus === 'above'
                            ? 'warning'
                            : 'dangerOutline'
                      }
                    >
                      {simulationPreview.newStatus === 'aligned'
                        ? 'Alineado a Mercado'
                        : simulationPreview.newStatus === 'above'
                          ? 'Sobre Banda'
                          : 'Bajo Banda (P25)'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with actions */}
            <div className="p-6 border-t border-slate-100 dark:border-dark-border flex items-center justify-between gap-3 bg-surface dark:bg-dark-surface">
              {employee.manualAdjustment ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isSubmitting}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Eliminar Ajuste
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={isSubmitting || numValue <= 0}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Guardando...' : 'Aplicar Micro-Ajuste'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
