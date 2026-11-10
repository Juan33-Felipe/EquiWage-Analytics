import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Avatar } from '../components/atoms/Avatar';
import { Badge } from '../components/atoms/Badge';
import { SimulatorHeroCard } from '../components/organisms/SimulatorHeroCard';
import { SimulatorControlsCard } from '../components/organisms/SimulatorControlsCard';
import { DepartmentImpactChart } from '../components/organisms/DepartmentImpactChart';
import { formatCurrency, getInitials, useCompensation } from '../context/CompensationContext';
import { IndividualAdjustmentDrawer } from '../components/molecules/IndividualAdjustmentDrawer';
import { PayrollApprovalModal } from '../components/molecules/PayrollApprovalModal';
import {
  ArrowRight,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const SEVERITY = {
  legal_violation: { labelKey: 'compliance.legalViolationLabel', variant: 'legal' },
  critical: { labelKey: 'alerts.critical', variant: 'dangerOutline' },
  moderate: { labelKey: 'alerts.moderate', variant: 'warning' },
  none: { labelKey: 'employees.table.aligned', variant: 'success' },
};

export function SimulatorPage() {
  const navigate = useNavigate();
  const {
    employees,
    simulationResult,
    simulation,
    exportSession,
    applySimulationScenario,
    approvePayrollPlan,
    legalCompliance,
    setManualAdjustment,
    removeManualAdjustment,
  } = useCompensation();
  const { t, language } = useLanguage();
  const [appliedNotice, setAppliedNotice] = React.useState(false);
  const [selectedDrawerEmployee, setSelectedDrawerEmployee] = React.useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = React.useState(false);
  const [isTableExpanded, setIsTableExpanded] = React.useState(true);
  const rows = simulationResult.rows;

  const handleApplyScenario = async () => {
    const res = await applySimulationScenario();
    if (res?.ok) {
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 3500);
    }
  };

  const getSeverityLabel = (severity) => {
    const severityKey = SEVERITY[severity]?.labelKey || 'employees.table.aligned';
    return t(severityKey);
  };

  const rolloutCaption =
    simulation.rolloutQuarters === 1
      ? t('simulator.quarterRolloutSingular', { count: simulation.rolloutQuarters })
      : t('simulator.quarterRolloutPlural', { count: simulation.rolloutQuarters });

  return (
    <div className="space-y-6">
      {/* Top Header with Scenario Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">{t('simulator.budgetSimulatorTitle')}</h2>
          <p className="text-sm text-content-muted mt-1">
            {t('simulator.modelDescription')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button variant="outline" className="gap-2 text-xs" onClick={exportSession}>
            <Download className="w-4 h-4" />
            {t('simulator.saveSession')}
          </Button>

          <Button
            variant="primary"
            className="gap-2 text-xs"
            onClick={() => setIsApprovalModalOpen(true)}
            disabled={rows.length === 0}
          >
            <CheckCircle2 className="w-4 h-4" />
            {language === 'es' ? 'Aprobar Plan de Nómina' : 'Approve Payroll Plan'}
          </Button>

          <Button
            variant="dark"
            className="gap-2 text-xs"
            onClick={() => navigate('/reports')}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'es' ? 'Informes Ejecutivos' : 'Executive Reports'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {employees?.length === 0 && (
        <Card className="p-5 border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-content-main">
                {language === 'es' ? 'No hay empleados en tu nómina para simular ajustes' : 'No employees in payroll to simulate adjustments'}
              </p>
              <p className="text-[11px] text-content-muted mt-0.5">
                {language === 'es' ? 'Carga tu nómina para proyectar presupuestos, costos de inflación y nivelación salarial.' : 'Upload your payroll to forecast budgets, inflation impact, and salary leveling.'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            className="text-xs shrink-0"
            onClick={() => navigate('/employees')}
          >
            {language === 'es' ? 'Ir a Cargar Nómina' : 'Go to Upload Payroll'}
          </Button>
        </Card>
      )}

      {/* Hero Metric Banner */}
      <SimulatorHeroCard />

      {/* Simulator Controls & Dept Impact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SimulatorControlsCard />
        </div>
        <div className="lg:col-span-2">
          <DepartmentImpactChart />
        </div>
      </div>

      {/* Simulated Adjustments Breakdown Table (Collapsible for Progressive Disclosure) */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap justify-between items-center gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">
              {t('simulator.simulatedAdjustments')}
            </h3>
            <p className="text-xs text-content-muted">
              {simulation.target === 'minimum' ? t('simulator.targetBandMin') : t('simulator.targetMarketMedian')} •{' '}
              {rolloutCaption}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant="primary" className="bg-primary/15 text-primary shrink-0">
              {t('simulator.employeesBadge', {
                count: rows.length,
                budget: formatCurrency(simulationResult.totalBudget),
              })}
            </Badge>

            <button
              onClick={() => setIsTableExpanded(!isTableExpanded)}
              className="p-1.5 rounded-lg border border-border text-content-muted hover:text-content-main hover:bg-surface-light transition-colors flex items-center gap-1 text-xs font-semibold"
              title={isTableExpanded ? t('common.hide') : t('common.viewList')}
            >
              <span>{isTableExpanded ? t('common.hide') : t('common.viewList')}</span>
              {isTableExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isTableExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-h-[460px] overflow-auto"
            >
              {rows.length === 0 ? (
                <div className="p-12 text-center text-sm text-content-muted">
                  {t('simulator.noAdjustment')}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-light sticky top-0 text-xs font-semibold text-content-muted uppercase tracking-wider z-10">
                    <tr>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">{t('simulator.employee')}</th>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">{t('simulator.currentSalary')}</th>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">{t('simulator.proposedSalary')}</th>
                      <th className="px-6 py-4 font-medium text-right whitespace-nowrap">{t('simulator.netIncrease')}</th>
                      <th className="px-6 py-4 font-medium text-right whitespace-nowrap">{t('simulator.gapSeverity')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-border/50">
                    {rows.map((row, index) => {
                      const severity = SEVERITY[row.severity] || SEVERITY.none;
                      return (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                          onClick={() => setSelectedDrawerEmployee(row)}
                          className="hover:bg-surface-light transition-colors group cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar initials={getInitials(row.name)} className="w-9 h-9 text-xs shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-content-main truncate">{row.name}</p>
                                <p className="text-xs text-content-muted mt-0.5 truncate">
                                  {row.role} • L{row.level}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-content-muted">
                            {formatCurrency(row.currentSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-content-main">
                            {formatCurrency(row.proposedSalary)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(row.increase)}
                            </span>
                            <span className="text-xs text-content-muted ml-1.5 font-normal">
                              (+{row.increasePercent}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Badge variant={severity.variant} className="whitespace-nowrap">
                              {getSeverityLabel(row.severity)}
                            </Badge>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guided Step Footer Banner */}
        <div className="p-4 sm:p-5 bg-surface-light border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-content-muted">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Escenario simulado en memoria local • Genera la orden formal o exporta el reporte.</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => setIsApprovalModalOpen(true)}
              disabled={rows.length === 0}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
              {language === 'es' ? 'Aprobar Nómina (.CSV)' : 'Approve Payroll (.CSV)'}
            </Button>
            <Button
              variant="primary"
              className="gap-2 text-xs"
              onClick={() => navigate('/reports')}
            >
              <span>{language === 'es' ? 'Generar Informe Ejecutivo para Dirección' : 'Generate Executive Report for Leadership'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Individual Adjustment Drawer */}
      <IndividualAdjustmentDrawer
        isOpen={Boolean(selectedDrawerEmployee)}
        onClose={() => setSelectedDrawerEmployee(null)}
        employee={selectedDrawerEmployee}
        legalCompliance={legalCompliance}
        onSaveAdjustment={setManualAdjustment}
        onRemoveAdjustment={removeManualAdjustment}
      />

      {/* Payroll Approval & Execution Order Modal */}
      <PayrollApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        simulationResult={simulationResult}
        simulation={simulation}
        onConfirmApprove={approvePayrollPlan}
      />
    </div>
  );
}
