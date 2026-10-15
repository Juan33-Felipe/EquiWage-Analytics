import React, { useMemo, useState } from 'react';
import { FilterBar } from '../components/molecules/FilterBar';
import { SalaryDistributionChart } from '../components/organisms/SalaryDistributionChart';
import { Card } from '../components/atoms/Card';
import { AlertRow } from '../components/molecules/AlertRow';
import { Badge } from '../components/atoms/Badge';
import { getInitials, useCompensation } from '../context/CompensationContext';
import { DEPARTMENTS } from '../data/mockCompensationData';

const AVATAR_TONES = [
  'bg-blue-50 text-blue-700',
  'bg-cyan-50 text-cyan-700',
  'bg-yellow-50 text-yellow-700',
  'bg-emerald-50 text-emerald-700',
  'bg-pink-50 text-pink-700',
  'bg-violet-50 text-violet-700',
];

export function DistributionPage() {
  const { employees, bands } = useCompensation();
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
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-content-main tracking-tight">Salary Curve & Outliers</h2>
            <Badge variant="successOutline" className="gap-1.5 px-2 py-0.5 bg-green-50/50">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Secure Local Session
            </Badge>
          </div>
          <p className="text-sm text-content-muted">
            Compare every salary against the market band and spot the outliers at a glance.
          </p>
        </div>
        <div className="text-xs font-medium text-content-muted bg-surface border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          Showing {filtered.length} of {employees.length} employees
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
        <div className="xl:col-span-7 h-full">
          <SalaryDistributionChart
            employees={filtered}
            bands={bands}
            highlightedId={highlightId}
            onHoverPoint={(point) => setHighlightId(point?.id ?? null)}
            title="Salary Distribution Curve"
            subtitle="Market band (P25–P75) with the median curve overlaid"
          />
        </div>

        <div className="xl:col-span-3 h-full">
          <Card className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-content-main tracking-tight">Critical Outliers</h3>
                <p className="text-xs text-content-muted">Employees below the market minimum</p>
              </div>
              <Badge variant="dangerOutline">{outliers.length}</Badge>
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 -mr-2">
              {outliers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-content-muted">
                  <p className="text-sm font-medium">No critical outliers</p>
                  <p className="text-xs mt-1">Everyone in this view sits inside their market band.</p>
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
