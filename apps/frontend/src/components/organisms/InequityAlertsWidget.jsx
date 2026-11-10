import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { AlertRow } from '../molecules/AlertRow';
import { ListFilter, ArrowRight } from 'lucide-react';
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
  const navigate = useNavigate();
  const { employees, inequities, marketGaps, legalViolators } = useCompensation();
  const { t, language } = useLanguage();
  const [filterTab, setFilterTab] = React.useState('all');

  const items = useMemo(() => {
    let list = [...employees].filter((employee) => {
      if (filterTab === 'critical') {
        return employee.isBelowMinimumWage || employee.status === 'below';
      }
      if (filterTab === 'market') {
        return marketGaps.some((gap) => gap.id === employee.id);
      }
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
      .slice(0, 5);
  }, [employees, inequities, marketGaps, filterTab]);

  const totalAlertCount = (legalViolators?.length || 0) + inequities.length + marketGaps.length;

  return (
    <Card className="h-full flex flex-col p-5 sm:p-6 min-h-0">
      {/* CoinSphere Top Token Header with See All pill button */}
      <div className="flex justify-between items-center gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base font-bold text-content-main tracking-tight truncate">
            {t('alerts.inequityAlerts')}
          </h3>
          <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5 shrink-0">
            {totalAlertCount}
          </Badge>
        </div>
        <button
          onClick={() => navigate('/dashboard/distribution')}
          className="px-3 py-1 rounded-full text-xs font-semibold text-content-muted hover:text-content-main bg-white/50 dark:bg-white/[0.05] border border-border dark:border-white/[0.08] hover:border-primary/40 transition-all cursor-pointer shrink-0"
        >
          {t('alerts.seeAll')}
        </button>
      </div>

      {/* CoinSphere Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3 p-1 rounded-full bg-white/50 dark:bg-[#1F2029]/80 border border-border/60 dark:border-white/10 text-xs">
        {[
          { id: 'all', label: language === 'es' ? 'Todos' : 'All' },
          { id: 'critical', label: language === 'es' ? 'Críticos' : 'Critical' },
          { id: 'market', label: language === 'es' ? 'Mercado' : 'Market' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`flex-1 py-1 px-2.5 rounded-full font-semibold transition-all text-center cursor-pointer ${
              filterTab === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-content-muted hover:text-content-main'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
                ? t('alerts.belowMinWage')
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

      {totalAlertCount > 0 && (
        <button
          onClick={() => navigate('/dashboard/distribution')}
          className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary hover:text-primary-hover transition-colors group shrink-0"
        >
          <span>{t('alerts.viewAllInDistribution', { count: totalAlertCount })}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </Card>
  );
}
