import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '../atoms/Card';
import { formatCurrency, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';
import { Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';

export function ReportPreviewCard({ sections = [] }) {
  const { employees, bands, metrics, simulationResult } = useCompensation();
  const { t, language } = useLanguage();

  const bandData = bands.map((band) => ({ level: band.level, p50: band.median }));
  const points = employees.map((employee, index) => ({
    level: employee.level + ((index % 3) - 1) * 0.15,
    salary: employee.currentSalary,
    status: employee.status,
  }));

  const today = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-content-main tracking-tight truncate">{t('report.livePreview')}</h3>
          <p className="text-xs text-content-muted truncate">{t('report.a4')}</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
          {t('report.preview')}
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {/* A4 canvas */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-soft p-6 sm:p-8 min-h-[540px] flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-orange-50 flex items-center justify-center text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-content-main leading-tight truncate">EquiWage Analytics</p>
                <p className="text-[10px] text-content-muted truncate">{t('report.compensationEquityReport')}</p>
              </div>
            </div>
            <p className="text-[10px] text-content-muted shrink-0">{today}</p>
          </div>

          {sections.includes('Executive Cost Summary') && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mb-2">
                {t('report.executiveCostSummary')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-orange-50 p-3 min-w-0">
                  <p className="text-[10px] text-content-muted mb-1 truncate" title={t('report.adjustmentBudget')}>
                    {t('report.adjustmentBudget')}
                  </p>
                  <p className="text-base font-bold text-primary truncate">{formatCurrency(metrics.minToMedianBudget)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 min-w-0">
                  <p className="text-[10px] text-content-muted mb-1 truncate" title={t('report.employeesAnalyzed')}>
                    {t('report.employeesAnalyzed')}
                  </p>
                  <p className="text-base font-bold text-content-main truncate">{metrics.headcount}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 min-w-0">
                  <p className="text-[10px] text-content-muted mb-1 truncate" title={t('report.belowBand')}>
                    {t('report.belowBand')}
                  </p>
                  <p className="text-base font-bold text-danger truncate">{metrics.marketDisparities}</p>
                </div>
              </div>
            </div>
          )}

          {sections.includes('Statistical Disparity Analysis') && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mb-2">
                {t('report.statisticalDisparity')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between gap-2 border-b border-gray-50 pb-1">
                  <span className="text-content-muted truncate">{t('report.averageSalaryGap')}</span>
                  <span className="font-semibold text-danger shrink-0">{(metrics.averageGap * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-50 pb-1">
                  <span className="text-content-muted truncate">{t('report.internalInequities')}</span>
                  <span className="font-semibold text-content-main shrink-0">{metrics.inequityCount}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-50 pb-1">
                  <span className="text-content-muted truncate">{t('report.alignmentRate')}</span>
                  <span className="font-semibold text-success shrink-0">{Math.round(metrics.alignedRate * 100)}%</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-50 pb-1">
                  <span className="text-content-muted truncate">{t('report.simulatedAdjustments')}</span>
                  <span className="font-semibold text-content-main shrink-0">{simulationResult.affectedCount}</span>
                </div>
              </div>
            </div>
          )}

          {sections.includes('Band Compression Metrics') && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mb-2">
                {t('report.salaryDistribution')}
              </p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <XAxis dataKey="level" type="number" domain={[1, 8]} tick={{ fontSize: 8, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                    <Line data={bandData} type="monotone" dataKey="p50" stroke="#F97316" strokeWidth={2} dot={false} />
                    <Scatter data={points.filter((p) => p.status !== 'below')} dataKey="salary" fill="#10B981" />
                    <Scatter data={points.filter((p) => p.status === 'below')} dataKey="salary" fill="#EF4444" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {sections.includes('Identified Outlier List') && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mb-2">
                {t('report.identifiedOutliers')}
              </p>
              <div className="space-y-1">
                {employees
                  .filter((employee) => employee.status === 'below')
                  .slice(0, 4)
                  .map((employee) => (
                    <div key={employee.id} className="flex justify-between gap-2 text-xs border-b border-gray-50 pb-1">
                      <span className="text-content-main truncate">
                        {employee.name} <span className="text-content-muted">• L{employee.level}</span>
                      </span>
                      <span className="font-semibold text-danger shrink-0">
                        {(employee.gap * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                {metrics.marketDisparities === 0 && (
                  <p className="text-xs text-content-muted">{t('report.noOutliers')}</p>
                )}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-auto pt-6">
            <div className="min-w-0">
              <div className="h-px bg-gray-300 mb-1.5" />
              <p className="text-[10px] font-semibold text-content-main truncate">{t('report.hrApproval')}</p>
              <p className="text-[10px] text-content-muted truncate">{t('report.compensationBenefits')}</p>
            </div>
            <div className="min-w-0">
              <div className="h-px bg-gray-300 mb-1.5" />
              <p className="text-[10px] font-semibold text-content-main truncate">{t('report.financeApproval')}</p>
              <p className="text-[10px] text-content-muted truncate">{t('report.budgetController')}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
