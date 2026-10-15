import React from 'react';
import { Card } from '../atoms/Card';
import { AlertRow } from '../molecules/AlertRow';
import { ListFilter } from 'lucide-react';
import { getInitials, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';

const AVATAR_TONES = [
  'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-pink-50 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
];

export function InequityAlertsWidget({ onSelect, onHover }) {
  const { employees, inequities, marketGaps } = useCompensation();
  const { t } = useLanguage();

  // Prioriza inequidades internas y, si no hay, muestra brechas de mercado.
  const source = inequities.length ? inequities : marketGaps;
  const items = [...employees]
    .filter((employee) => source.some((flagged) => flagged.id === employee.id))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 6);

  return (
    <Card className="h-full flex flex-col p-6 min-h-0">
      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-content-main tracking-tight">{t('alerts.inequityAlerts')}</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-bold text-danger shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              {t('alerts.detected', { count: source.length })}
            </div>
          </div>
          <p className="text-xs text-content-muted">{t('alerts.largestGaps')}</p>
        </div>
        <button className="w-8 h-8 shrink-0 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
          <ListFilter className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 mt-2 overflow-y-auto pr-2 -mr-2 min-h-0">
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-content-muted">
            <p className="text-sm font-medium">{t('alerts.noCritical')}</p>
            <p className="text-xs mt-1">{t('alerts.everyEmployeeWithin')}</p>
          </div>
        )}
        {items.map((employee, index) => (
          <AlertRow
            key={employee.id}
            initials={getInitials(employee.name)}
            name={employee.name}
            role={`L${employee.level} • ${employee.role}`}
            gap={`${employee.gap >= 0 ? '+' : ''}${(employee.gap * 100).toFixed(1)}%`}
            colorClass={AVATAR_TONES[index % AVATAR_TONES.length]}
            badgeVariant={employee.status === 'below' ? 'danger' : 'warning'}
            onClick={() => onSelect?.(employee)}
            onHover={() => onHover?.(employee)}
          />
        ))}
      </div>
    </Card>
  );
}
