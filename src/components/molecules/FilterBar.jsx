import React from 'react';
import { Building2, Layers, Target, RotateCcw } from 'lucide-react';
import { Card } from '../atoms/Card';
import { SelectPill } from '../atoms/SelectPill';
import { Button } from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';

export function FilterBar({ departments, levels, filters, onChange, onReset }) {
  const { t, tDept } = useLanguage();

  const departmentOptions = [
    { value: 'all', label: t('filter.allDepartments') },
    ...departments.map((dept) => ({ value: dept, label: tDept(dept) })),
  ];

  const levelOptions = [
    { value: 'all', label: t('filter.allJobLevels') },
    ...levels.map((level) => ({ value: String(level), label: t('bands.levelN', { level }) })),
  ];

  const rangeOptions = [
    { value: 'all', label: t('filter.allMarketRanges') },
    { value: 'below', label: t('filter.belowMinP25') },
    { value: 'P25-P50', label: t('filter.lowerBand') },
    { value: 'P50-P75', label: t('filter.upperBand') },
    { value: 'above', label: t('filter.aboveMaxP75') },
  ];

  const isDirty = filters.department !== 'all' || filters.level !== 'all' || filters.range !== 'all';

  return (
    <Card className="flex-row flex-wrap items-center gap-3 p-4 rounded-xl">
      <SelectPill
        ariaLabel={t('distribution.filterByDepartment')}
        icon={Building2}
        value={filters.department}
        onChange={(value) => onChange({ ...filters, department: value })}
        options={departmentOptions}
      />
      <SelectPill
        ariaLabel={t('distribution.filterByJob')}
        icon={Layers}
        value={filters.level}
        onChange={(value) => onChange({ ...filters, level: value })}
        options={levelOptions}
      />
      <SelectPill
        ariaLabel={t('distribution.filterByMarket')}
        icon={Target}
        value={filters.range}
        onChange={(value) => onChange({ ...filters, range: value })}
        options={rangeOptions}
      />

      <div className="flex items-center gap-2 ml-auto shrink-0">
        {isDirty && (
          <Button variant="ghost" className="gap-2 whitespace-nowrap" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
            {t('filter.reset')}
          </Button>
        )}
        <Button variant="primary" className="active:scale-95 transition-transform whitespace-nowrap">
          {t('filter.updateChart')}
        </Button>
      </div>
    </Card>
  );
}
