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

export function PayrollApprovalModal({
  isOpen,
  onClose,
  simulationResult,
  simulation,
  onConfirmApprove,
}) {
  const [commitToDatabase, setCommitToDatabase] = useState(false);
  const [approvedBy, setApprovedBy] = useState('HR Director');
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
      'Employee ID',
      'Full Name',
      'Department',
      'Job Level',
      'Previous Base Salary (USD)',
      'Approved Increase Amount (USD)',
      'Approved Increase Percentage (%)',
      'New Effective Salary (USD)',
      'Adjustment Reason',
      'Notes',
    ];

    const csvRows = plan.items.map((item) => [
      `"${item.employeeId}"`,
      `"${item.fullName.replace(/"/g, '""')}"`,
      `"${item.department}"`,
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
    link.download = `Payroll_Execution_Order_${new Date().toISOString().slice(0, 10)}.csv`;
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
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-surface dark:bg-dark-surface rounded-2xl shadow-soft border border-slate-100 dark:border-dark-border p-6 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-primary flex items-center justify-center shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-main dark:text-dark-text tracking-tight">
                  Aprobar Plan y Generar Orden de Nómina
                </h3>
                <p className="text-xs text-content-muted dark:text-dark-muted">
                  Flujo de aprobación ejecutiva y exportación formal para Finanzas / Nóminas
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

          {generatedPlan ? (
            /* Success State */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-content-main dark:text-dark-text">
                  ¡Orden de Nómina Aprobada y Generada!
                </h4>
                <p className="text-xs text-content-muted dark:text-dark-muted mt-1 max-w-md mx-auto">
                  La orden de ejecución formal (.CSV) se ha descargado a tu equipo con {generatedPlan.affectedCount}{' '}
                  ajustes salariales autorizados.
                </p>
              </div>

              {commitToDatabase && (
                <div className="p-3 max-w-md mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Los salarios fueron consolidados como actuales en la base de datos SQLite.</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => downloadPayrollOrderCSV(generatedPlan)}
                  className="gap-2 text-xs"
                >
                  <Download className="w-4 h-4" />
                  Descargar de Nuevo (.CSV)
                </Button>
                <Button variant="primary" onClick={onClose} className="text-xs">
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            /* Approval Confirmation Form */
            <div className="mt-5 space-y-5">
              {/* Executive Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-border/40 border border-slate-200/60 dark:border-dark-border">
                  <p className="text-[11px] text-content-muted dark:text-dark-muted font-medium">Presupuesto Aprobado</p>
                  <p className="text-base font-bold text-primary mt-0.5">{formatCurrency(totalCost)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-border/40 border border-slate-200/60 dark:border-dark-border">
                  <p className="text-[11px] text-content-muted dark:text-dark-muted font-medium">Colaboradores Beneficiados</p>
                  <p className="text-base font-bold text-content-main dark:text-dark-text mt-0.5">
                    {affectedCount} personas
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-border/40 border border-slate-200/60 dark:border-dark-border">
                  <p className="text-[11px] text-content-muted dark:text-dark-muted font-medium">Objetivo de Política</p>
                  <p className="text-base font-bold text-content-main dark:text-dark-text mt-0.5 capitalize">
                    {simulation.target === 'minimum' ? 'P25 Mínimo' : 'P50 Mediana'}
                  </p>
                </div>
              </div>

              {/* Commit Option Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/60 dark:bg-dark-border/20 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={commitToDatabase}
                    onChange={(e) => setCommitToDatabase(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="block text-xs font-bold text-content-main dark:text-dark-text">
                      Consolidar en Base de Datos SQLite (Actualizar Salarios Vigentes)
                    </span>
                    <span className="block text-[11px] text-content-muted dark:text-dark-muted mt-0.5 leading-relaxed">
                      Si se activa, el nuevo salario propuesto reemplazará el salario base actual en la tabla local{' '}
                      <code>employees</code>. Si se deja desmarcado, solo generará la orden exportable sin sobreescribir la nómina activa.
                    </span>
                  </div>
                </label>
              </div>

              {/* Approver Name */}
              <div>
                <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5">
                  Autorizado Por (Responsable RRHH / Finanzas)
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="Ej. Directora de Compensaciones & Beneficios"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>

              {/* Dataset Columns Preview Notice */}
              <div className="p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 text-xs text-content-main dark:text-dark-text flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  El archivo descargable incluye: <em>ID, Nombre Completo, Departamento, Nivel, Salario Anterior, Incremento (+USD y +%), Nuevo Salario y Motivo de Ajuste (Cumplimiento Legal / Mínimo P25 / Mediana P50 / Ajuste Manual)</em>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApprove}
                  disabled={isProcessing || affectedCount === 0}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isProcessing ? 'Procesando Plan...' : 'Aprobar y Descargar Orden de Nómina'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
