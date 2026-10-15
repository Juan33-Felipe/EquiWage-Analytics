import React from 'react';
import { Building2, Layers, Target, RotateCcw } from 'lucide-react';
import { Card } from '../atoms/Card';
import { SelectPill } from '../atoms/SelectPill';
import { Button } from '../atoms/Button';

export function FilterBar({ departments, levels, filters, onChange, onReset }) {
  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departments.map((dept) => ({ value: dept, label: dept })),
  ];

  const levelOptions = [
    { value: 'all', label: 'All Job Levels' },
    ...levels.map((level) => ({ value: String(level), label: `Level ${level}` })),
  ];

  const rangeOptions = [
    { value: 'all', label: 'All Market Ranges' },
    { value: 'below', label: 'Below Minimum (P25)' },
    { value: 'P25-P50', label: 'Lower Band (P25–P50)' },
    { value: 'P50-P75', label: 'Upper Band (P50–P75)' },
    { value: 'above', label: 'Above Maximum (P75)' },
  ];

  const isDirty = filters.department !== 'all' || filters.level !== 'all' || filters.range !== 'all';

  return (
    <Card className="flex-row flex-wrap items-center gap-3 p-4 rounded-xl">
      <SelectPill
        ariaLabel="Filter by department"
        icon={Building2}
        value={filters.department}
        onChange={(value) => onChange({ ...filters, department: value })}
        options={departmentOptions}
      />
      <SelectPill
        ariaLabel="Filter by job level"
        icon={Layers}
        value={filters.level}
        onChange={(value) => onChange({ ...filters, level: value })}
        options={levelOptions}
      />
      <SelectPill
        ariaLabel="Filter by market range"
        icon={Target}
        value={filters.range}
        onChange={(value) => onChange({ ...filters, range: value })}
        options={rangeOptions}
      />

      <div className="flex items-center gap-2 ml-auto">
        {isDirty && (
          <Button variant="ghost" className="gap-2" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        )}
        <Button variant="primary" className="active:scale-95 transition-transform">
          Update Chart
        </Button>
      </div>
    </Card>
  );
}
