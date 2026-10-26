import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { TopMetricsRow } from '../components/organisms/TopMetricsRow';
import { SalaryDistributionChart } from '../components/organisms/SalaryDistributionChart';
import { InequityAlertsWidget } from '../components/organisms/InequityAlertsWidget';
import { IndividualAdjustmentDrawer } from '../components/molecules/IndividualAdjustmentDrawer';
import { useCompensation, formatCurrency } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, ArrowRight, Sparkles } from 'lucide-react';

export function OverviewPage() {
  const navigate = useNavigate();
  const {
    employees,
    bands,
    metrics,
    simulationResult,
    legalCompliance,
    setManualAdjustment,
    removeManualAdjustment,
  } = useCompensation();
  const { t } = useLanguage();
  const [highlightId, setHighlightId] = useState(null);
  const [selectedDrawerEmployee, setSelectedDrawerEmployee] = useState(null);

  const statusCounts = employees.reduce(
    (acc, employee) => {
      acc[employee.status] = (acc[employee.status] || 0) + 1;
      return acc;
    },
    { aligned: 0, below: 0, above: 0 }
  );

  const pieData = [
    { name: t('overview.aligned'), value: statusCounts.aligned, color: '#10B981' },
    { name: t('overview.belowMin'), value: statusCounts.below, color: '#EF4444' },
    { name: t('overview.aboveMax'), value: statusCounts.above, color: '#F59E0B' },
  ].filter((entry) => entry.value > 0);

  const alignedPercent = metrics.headcount ? Math.round((statusCounts.aligned / metrics.headcount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-content-main tracking-tight">{t('overview.title')}</h2>
          <p className="text-sm text-content-muted mt-1">
            {t('overview.subtitle')}
          </p>
        </div>
      </div>

      <TopMetricsRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[480px]">
        <div className="lg:col-span-2 h-full min-h-0">
          <SalaryDistributionChart
            employees={employees}
            bands={bands}
            highlightedId={highlightId}
            onHoverPoint={(point) => setHighlightId(point?.id ?? null)}
            onClickPoint={(point) => setSelectedDrawerEmployee(point)}
          />
        </div>
        <div className="h-full min-h-0">
          <InequityAlertsWidget
            onHover={(employee) => setHighlightId(employee.id)}
            onSelect={(employee) => {
              setHighlightId(employee.id);
              setSelectedDrawerEmployee(employee);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-base font-bold text-content-main tracking-tight truncate">{t('overview.alignmentDistribution')}</h3>
          </div>
          <p className="text-xs text-content-muted mb-4">{t('overview.whereEmployees')}</p>
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-content-main)',
                    borderRadius: '12px',
                    border: '1px solid rgba(156, 163, 175, 0.2)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--color-content-main)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-content-main">{alignedPercent}%</span>
              <span className="text-xs text-content-muted">{t('overview.aligned')}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-content-muted whitespace-nowrap">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-gradient-to-br from-primary-hover to-primary-light text-white border-0 p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-lg font-bold tracking-tight mb-1">{t('overview.financialImpact')}</h3>
            <p className="text-xs text-white/85 mb-6">{t('overview.whatItWould')}</p>

            <div className="space-y-3">
              <div className="p-4 bg-white/15 rounded-xl border border-white/25 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm">{t('overview.costToBandMin')}</h4>
                  <p className="text-xs text-white/85 mt-0.5">
                    {t('overview.bringEmployees', { count: metrics.marketDisparities })}
                  </p>
                </div>
                <span className="text-xl font-bold shrink-0">
                  {formatCurrency(
                    employees
                      .filter((employee) => employee.status === 'below')
                      .reduce((acc, employee) => acc + (employee.band.min - employee.currentSalary), 0)
                  )}
                </span>
              </div>
              <div className="p-4 bg-black/10 rounded-xl border border-black/10 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm">{t('overview.costToMarketMedian')}</h4>
                  <p className="text-xs text-white/80 mt-0.5">{t('overview.fullCompetitiveness')}</p>
                </div>
                <span className="text-xl font-bold shrink-0">{formatCurrency(simulationResult.totalBudget)}</span>
              </div>
            </div>

            <div className="mt-auto pt-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
              <p className="text-xs text-white/85 flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{t('overview.adjustScenario')}</span>
              </p>
              <Button
                variant="dark"
                className="gap-2 shrink-0 whitespace-nowrap"
                onClick={() => navigate('/dashboard/simulator')}
              >
                {t('overview.openSimulator')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        </Card>
      </div>

      {/* Individual Manual Adjustment Drawer */}
      <IndividualAdjustmentDrawer
        isOpen={Boolean(selectedDrawerEmployee)}
        onClose={() => setSelectedDrawerEmployee(null)}
        employee={selectedDrawerEmployee}
        legalCompliance={legalCompliance}
        onSaveAdjustment={setManualAdjustment}
        onRemoveAdjustment={removeManualAdjustment}
      />
    </div>
  );
}
