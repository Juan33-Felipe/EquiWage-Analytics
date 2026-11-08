import React from 'react';
import { Card } from '../atoms/Card';
import { SliderControl } from '../atoms/SliderControl';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';
import { DEPARTMENTS } from '@equiwage/shared';
import { useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';

export function SimulatorControlsCard() {
  const { simulation, updateSimulation, toggleDepartment } = useCompensation();
  const { t, tDept } = useLanguage();

  const targets = [
    { id: 'minimum', title: t('simulator.bringToBandMin'), caption: t('simulator.closeMarket') },
    { id: 'median', title: t('simulator.bringToMarketMedian'), caption: t('simulator.fullMarket') },
  ];

  const rolloutValueLabel =
    simulation.rolloutQuarters === 1
      ? t('simulator.quarterSingular', { count: simulation.rolloutQuarters })
      : t('simulator.quarterPlural', { count: simulation.rolloutQuarters });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">{t('simulator.policyParameters')}</h3>
      <p className="text-xs text-content-muted mb-6">{t('simulator.tuneScenario')}</p>

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
                  ? 'border-primary bg-primary/15'
                  : 'border-border hover:border-content-muted/30 hover:bg-surface-light'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  active ? 'border-primary' : 'border-border'
                )}
              >
                {active && <span className="w-2 h-2 rounded-full bg-primary" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-content-main">{target.title}</span>
                <span className="block text-xs text-content-muted mt-0.5">{target.caption}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Projected Market Inflation Slider (Feature C) */}
      <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-content-main tracking-tight flex items-center gap-1.5">
            <span>Inflación de Mercado Proyectada</span>
          </label>
          <span className="text-xs font-mono font-bold text-primary bg-surface px-2 py-0.5 rounded-md border border-primary/20">
            +{simulation.inflationPercent || 0}%
          </span>
        </div>
        <SliderControl
          min={0}
          max={25}
          step={1}
          value={simulation.inflationPercent || 0}
          onChange={(value) => updateSimulation({ inflationPercent: value })}
          valueLabel={`+${simulation.inflationPercent || 0}%`}
        />
        <p className="text-[11px] text-content-muted mt-2 leading-relaxed">
          Desplaza dinámicamente las bandas salariales (P25, P50, P75) hacia arriba para proyectar desfases de competitividad para el próximo ciclo.
        </p>
      </div>

      {/* Phased rollout */}
      <SliderControl
        className="mb-6"
        label={t('simulator.phasedRollout')}
        valueLabel={rolloutValueLabel}
        min={1}
        max={4}
        step={1}
        value={simulation.rolloutQuarters}
        onChange={(value) => updateSimulation({ rolloutQuarters: value })}
      />

      {/* Departments */}
      <div className="pt-5 border-t border-border">
        <p className="text-sm font-semibold text-content-main mb-3">{t('simulator.includeDepartments')}</p>
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
                    : 'border-border text-content-muted hover:border-content-muted/30'
                )}
              >
                {active && <Check className="w-3 h-3 shrink-0" />}
                {tDept(department)}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
