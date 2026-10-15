import React from 'react';
import { Card } from '../atoms/Card';
import { SliderControl } from '../atoms/SliderControl';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';
import { DEPARTMENTS } from '../../data/mockCompensationData';
import { useCompensation } from '../../context/CompensationContext';

export function SimulatorControlsCard() {
  const { simulation, updateSimulation, toggleDepartment } = useCompensation();

  const targets = [
    { id: 'minimum', title: 'Bring to Band Minimum', caption: 'Close market disparities (P25)' },
    { id: 'median', title: 'Bring to Market Median', caption: 'Full market competitiveness (P50)' },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">Policy Parameters</h3>
      <p className="text-xs text-content-muted mb-6">Tune the scenario to model your budget</p>

      {/* Adjustment target */}
      <div className="space-y-3 mb-6">
        {targets.map((target) => {
          const active = simulation.target === target.id;
          return (
            <button
              key={target.id}
              onClick={() => updateSimulation({ target: target.id })}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                active
                  ? 'border-primary bg-orange-50/60 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  active ? 'border-primary' : 'border-gray-300'
                )}
              >
                {active && <span className="w-2 h-2 rounded-full bg-primary" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-content-main">{target.title}</span>
                <span className="block text-xs text-content-muted mt-0.5">{target.caption}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Phased rollout */}
      <SliderControl
        className="mb-6"
        label="Phased Rollout"
        valueLabel={`${simulation.rolloutQuarters} Quarter${simulation.rolloutQuarters > 1 ? 's' : ''}`}
        min={1}
        max={4}
        step={1}
        value={simulation.rolloutQuarters}
        onChange={(value) => updateSimulation({ rolloutQuarters: value })}
      />

      {/* Departments */}
      <div className="pt-5 border-t border-gray-100">
        <p className="text-sm font-semibold text-content-main mb-3">Include Departments</p>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((department) => {
            const active = simulation.departments.includes(department);
            return (
              <button
                key={department}
                onClick={() => toggleDepartment(department)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 text-content-muted hover:border-gray-300'
                )}
              >
                {active && <Check className="w-3 h-3" />}
                {department}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
