import React, { useMemo, useState } from 'react';
import { FilterBar } from '../components/molecules/FilterBar';
import { SalaryDistributionChart } from '../components/organisms/SalaryDistributionChart';
import { Card } from '../components/atoms/Card';
import { AlertRow } from '../components/molecules/AlertRow';
import { Badge } from '../components/atoms/Badge';
import { getInitials, useCompensation } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import { DEPARTMENTS } from '../data/mockCompensationData';

const AVATAR_TONES = [
  'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-pink-50 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
];

export function DistributionPage() {
  const { employees, bands } = useCompensation();
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ department: 'all', level: 'all', range: 'all' });
  const [highlightId, setHighlightId] = useState(null);

  const levels = useMemo(() => [...new Set(bands.map((band) => band.level))].sort((a, b) => a - b), [bands]);

  const filtered = useMemo(() => {
    return employees.filter((employee) => {
      if (filters.department !== 'all' && employee.department !== filters.department) return false;
      if (filters.level !== 'all' && String(employee.level) !== filters.level) return false;
      if (filters.range !== 'all' && employee.band) {
        const { currentSalary, band } = employee;
        if (filters.range === 'below' && currentSalary >= band.min) return false;
        if (filters.range === 'above' && currentSalary <= band.max) return false;
        if (filters.range === 'P25-P50' && !(currentSalary >= band.min && currentSalary <= band.median)) return false;
        if (filters.range === 'P50-P75' && !(currentSalary > band.median && currentSalary <= band.max)) return false;
      }
      return true;
    });
  }, [employees, filters]);

  const outliers = useMemo(
    () =>
      [...filtered]
        .filter((employee) => employee.status === 'below')
        .sort((a, b) => a.gap - b.gap)
        .slice(0, 8),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-content-main tracking-tight">{t('distribution.salaryCurve')}</h2>
            <Badge variant="successOutline" className="gap-1.5 px-2 py-0.5 bg-green-50/50 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              {t('distribution.secureLocalSession')}
            </Badge>
          </div>
          <p className="text-sm text-content-muted">
            {t('distribution.compareEvery')}
          </p>
        </div>
        <div className="text-xs font-medium text-content-muted bg-surface border border-gray-200 rounded-full px-3 py-1.5 shadow-sm shrink-0">
          {t('distribution.showingEmployees', { count: filtered.length, total: employees.length })}
        </div>
      </div>

      <FilterBar
        departments={DEPARTMENTS}
        levels={levels}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({ department: 'all', level: 'all', range: 'all' })}
      />

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 h-auto xl:h-[560px]">
        <div className="xl:col-span-7 h-full min-h-0">
          <SalaryDistributionChart
            employees={filtered}
            bands={bands}
            highlightedId={highlightId}
            onHoverPoint={(point) => setHighlightId(point?.id ?? null)}
            title={t('distribution.salaryDistribution')}
            subtitle={t('distribution.bandP25P75')}
          />
        </div>

        <div className="xl:col-span-3 h-full min-h-0">
          <Card className="h-full flex flex-col p-6 min-h-0">
            <div className="flex items-start justify-between gap-2 mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-content-main tracking-tight">{t('distribution.criticalOutliers')}</h3>
                <p className="text-xs text-content-muted">{t('distribution.employeesBelow')}</p>
              </div>
              <Badge variant="dangerOutline" className="shrink-0">{outliers.length}</Badge>
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 -mr-2 min-h-0">
              {outliers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-content-muted">
                  <p className="text-sm font-medium">{t('distribution.noCritical')}</p>
                  <p className="text-xs mt-1">{t('distribution.everyoneInside')}</p>
                </div>
              ) : (
                outliers.map((employee, index) => (
                  <AlertRow
                    key={employee.id}
                    initials={getInitials(employee.name)}
                    name={employee.name}
                    role={`L${employee.level} • ${employee.role}`}
                    gap={`${(employee.gap * 100).toFixed(1)}%`}
                    colorClass={AVATAR_TONES[index % AVATAR_TONES.length]}
                    badgeVariant="danger"
                    highlight={highlightId === employee.id}
                    onClick={() => setHighlightId(employee.id)}
                    onHover={() => setHighlightId(employee.id)}
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
