import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  Building,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { formatCurrency } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';

export function PayrollApprovalModal({
  isOpen,
  onClose,
  simulationResult,
  simulation,
  onConfirmApprove,
}) {
  const { t, tDept, language } = useLanguage();
  const [commitToDatabase, setCommitToDatabase] = useState(false);
  const [approvedBy, setApprovedBy] = useState(() => (language === 'es' ? 'Directora de Compensaciones' : 'HR Director'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  if (!isOpen) return null;

  const totalCost = simulationResult?.totalBudget || 0;
  const affectedCount = simulationResult?.affectedCount || 0;
  const rows = simulationResult?.rows || [];

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const result = await onConfirmApprove({
        commitToDatabase,
        approvedBy: approvedBy.trim() || 'HR Director',
        target: simulation.target,
        inflationPercent: simulation.inflationPercent || 0,
        departments: simulation.departments,
      });

      if (result?.ok && result.plan) {
        setGeneratedPlan(result.plan);
        // Automatically trigger CSV download of the Payroll Execution Order
        downloadPayrollOrderCSV(result.plan);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPayrollOrderCSV = (plan) => {
    if (!plan || !plan.items) return;

    const headers = [
      t('payrollOrder.col.employeeId'),
      t('payrollOrder.col.fullName'),
      t('payrollOrder.col.department'),
      t('payrollOrder.col.jobLevel'),
      t('payrollOrder.col.previousSalary'),
      t('payrollOrder.col.increaseAmount'),
      t('payrollOrder.col.increasePercent'),
      t('payrollOrder.col.newSalary'),
      t('payrollOrder.col.reason'),
      t('payrollOrder.col.notes'),
    ];

    const csvRows = plan.items.map((item) => [
      `"${item.employeeId}"`,
      `"${item.fullName.replace(/"/g, '""')}"`,
      `"${tDept(item.department)}"`,
      item.level,
      item.previousSalary,
      item.increaseAmount,
      `${item.increasePercent.toFixed(2)}%`,
      item.newSalary,
      `"${item.reason}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filePrefix = language === 'es' ? 'Orden_Ejecucion_Nomina' : 'Payroll_Execution_Order';
    link.download = `${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-surface rounded-2xl border border-border p-6 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-main tracking-tight">
                  {t('payrollOrder.modalTitle')}
                </h3>
                <p className="text-xs text-content-muted">
                  {t('payrollOrder.modalSubtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-content-muted hover:text-content-main hover:bg-surface-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {generatedPlan ? (
            /* Success State */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-emerald-500/15 text-green-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-content-main">
                  {t('payrollOrder.successTitle')}
                </h4>
                <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
                  {t('payrollOrder.successSubtitle', { count: generatedPlan.affectedCount })}
                </p>
              </div>

              {commitToDatabase && (
                <div className="p-3 max-w-md mx-auto rounded-xl bg-green-50 dark:bg-emerald-500/15 border border-green-200 dark:border-emerald-500/20 text-xs text-green-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>{t('payrollOrder.successCommitted')}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => downloadPayrollOrderCSV(generatedPlan)}
                  className="gap-2 text-xs"
                >
                  <Download className="w-4 h-4" />
                  {t('payrollOrder.downloadAgain')}
                </Button>
                <Button variant="primary" onClick={onClose} className="text-xs">
                  {t('common.close')}
                </Button>
              </div>
            </div>
          ) : (
            /* Approval Confirmation Form */
            <div className="mt-5 space-y-5">
              {/* Executive Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface-light border border-border">
                  <p className="text-[11px] text-content-muted font-medium">{t('payrollOrder.approvedBudget')}</p>
                  <p className="text-base font-bold text-primary mt-0.5">{formatCurrency(totalCost)}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-light border border-border">
                  <p className="text-[11px] text-content-muted font-medium">{t('payrollOrder.benefitedEmployees')}</p>
                  <p className="text-base font-bold text-content-main mt-0.5">
                    {affectedCount} {t('payrollOrder.people')}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-surface-light border border-border">
                  <p className="text-[11px] text-content-muted font-medium">{t('payrollOrder.policyTarget')}</p>
                  <p className="text-base font-bold text-content-main mt-0.5 capitalize">
                    {simulation.target === 'minimum' ? (language === 'es' ? 'P25 Mínimo' : 'P25 Minimum') : (language === 'es' ? 'P50 Mediana' : 'P50 Median')}
                  </p>
                </div>
              </div>

              {/* Commit Option Toggle */}
              <div className="p-4 rounded-xl border border-border bg-surface-light space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={commitToDatabase}
                    onChange={(e) => setCommitToDatabase(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="block text-xs font-bold text-content-main">
                      {t('payrollOrder.commitToggleTitle')}
                    </span>
                    <span className="block text-[11px] text-content-muted mt-0.5 leading-relaxed">
                      {t('payrollOrder.commitToggleDesc')}
                    </span>
                  </div>
                </label>
              </div>

              {/* Approver Name */}
              <div>
                <label className="block text-xs font-semibold text-content-main mb-1.5">
                  {t('payrollOrder.authorizedByLabel')}
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder={t('payrollOrder.authorizedByPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>

              {/* Dataset Columns Preview Notice */}
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-content-main flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t('payrollOrder.datasetNotice')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApprove}
                  disabled={isProcessing || affectedCount === 0}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isProcessing
                    ? (language === 'es' ? 'Procesando Plan...' : 'Processing Plan...')
                    : (language === 'es' ? 'Aprobar y Descargar Orden de Nómina' : 'Approve & Download Payroll Order')}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
