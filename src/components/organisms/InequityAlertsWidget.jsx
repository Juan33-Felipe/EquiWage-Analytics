import React from 'react';
import { Card } from '../atoms/Card';
import { AlertRow } from '../molecules/AlertRow';
import { ListFilter } from 'lucide-react';
import { getInitials, useCompensation } from '../../context/CompensationContext';

const AVATAR_TONES = [
  'bg-blue-50 text-blue-700',
  'bg-cyan-50 text-cyan-700',
  'bg-yellow-50 text-yellow-700',
  'bg-emerald-50 text-emerald-700',
  'bg-pink-50 text-pink-700',
  'bg-violet-50 text-violet-700',
];

export function InequityAlertsWidget({ onSelect, onHover }) {
  const { employees, inequities, marketGaps } = useCompensation();

  // Prioriza inequidades internas y, si no hay, muestra brechas de mercado.
  const source = inequities.length ? inequities : marketGaps;
  const items = [...employees]
    .filter((employee) => source.some((flagged) => flagged.id === employee.id))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 6);

  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-content-main tracking-tight">Inequity Alerts</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-bold text-danger">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              {source.length} Detected
            </div>
          </div>
          <p className="text-xs text-content-muted">Largest gaps requiring attention</p>
        </div>
        <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
          <ListFilter className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 mt-2 overflow-y-auto pr-2 -mr-2">
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-content-muted">
            <p className="text-sm font-medium">No critical alerts</p>
            <p className="text-xs mt-1">Every employee is within their market band.</p>
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
