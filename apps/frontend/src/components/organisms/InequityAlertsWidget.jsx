import React, { useMemo } from 'react';
import { Card } from '../atoms/Card';
import { AlertRow } from '../molecules/AlertRow';
import { ListFilter } from 'lucide-react';
import { getInitials, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';

const AVATAR_TONES = [
  'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300',
  'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300',
  'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300',
  'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
  'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300',
  'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300',
];

export function InequityAlertsWidget({ onSelect, onHover }) {
  const { employees, inequities, marketGaps, legalViolators } = useCompensation();
  const { t } = useLanguage();

  const items = useMemo(() => {
    const list = [...employees].filter((employee) => {
      return (
        employee.isBelowMinimumWage ||
        inequities.some((flagged) => flagged.id === employee.id) ||
        marketGaps.some((gap) => gap.id === employee.id)
      );
    });

    return list
      .sort((a, b) => {
        if (a.isBelowMinimumWage && !b.isBelowMinimumWage) return -1;
        if (!a.isBelowMinimumWage && b.isBelowMinimumWage) return 1;
        return a.gap - b.gap;
      })
      .slice(0, 6);
  }, [employees, inequities, marketGaps]);

  const totalAlertCount = (legalViolators?.length || 0) + inequities.length + marketGaps.length;

  return (
    <Card className="h-full flex flex-col p-6 min-h-0">
      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-content-main tracking-tight">{t('alerts.inequityAlerts')}</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/15 text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {t('alerts.detected', { count: totalAlertCount })}
            </div>
          </div>
          <p className="text-xs text-content-muted">{t('alerts.largestGaps')}</p>
        </div>
        <button className="w-8 h-8 shrink-0 rounded-lg border border-border flex items-center justify-center text-content-muted hover:bg-surface-light hover:text-content-main transition-colors">
          <ListFilter className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 mt-2 overflow-y-auto pr-2 -mr-2 min-h-0">
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-content-muted">
            <p className="text-sm font-medium">
              {(employees?.length || 0) === 0 ? t('alerts.noEmployees') : t('alerts.noCritical')}
            </p>
            <p className="text-xs mt-1">
              {(employees?.length || 0) === 0 ? t('alerts.noEmployeesDesc') : t('alerts.everyEmployeeWithin')}
            </p>
          </div>
        )}
        {items.map((employee, index) => (
          <AlertRow
            key={employee.id}
            initials={getInitials(employee.name)}
            name={employee.name}
            role={`L${employee.level} • ${employee.role}`}
            gap={
              employee.isBelowMinimumWage
                ? '< Min Wage'
                : `${employee.gap >= 0 ? '+' : ''}${(employee.gap * 100).toFixed(1)}%`
            }
            colorClass={AVATAR_TONES[index % AVATAR_TONES.length]}
            badgeVariant={
              employee.isBelowMinimumWage
                ? 'legal'
                : employee.status === 'below'
                  ? 'danger'
                  : 'warning'
            }
            onClick={() => onSelect?.(employee)}
            onHover={() => onHover?.(employee)}
          />
        ))}
      </div>
    </Card>
  );
}
