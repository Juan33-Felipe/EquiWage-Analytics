import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../atoms/Button';
import { formatCurrency, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight } from 'lucide-react';

export function HeroCard() {
  const navigate = useNavigate();
  const { metrics, simulationResult, metrics: { alignedRate } } = useCompensation();
  const { t } = useLanguage();
  const fulfillment = Math.round(alignedRate * 100);

  return (
    <div className="bg-gradient-to-br from-primary-hover to-primary-light rounded-xl shadow-soft p-6 flex flex-col justify-between text-white relative overflow-hidden h-full">
      <div className="relative z-10 min-w-0">
        <p className="text-xs font-semibold tracking-wider text-white/80 uppercase mb-2 truncate">
          {t('metrics.compensationEquity')}
        </p>
        <p className="text-sm font-medium text-white/90 mb-1 truncate">{t('metrics.totalAdjustment')}</p>
        <h2 className="text-3xl xl:text-4xl font-bold mb-2 tracking-tight truncate">
          {formatCurrency(metrics.minToMedianBudget)}
        </h2>
        <p className="text-xs text-white/80 leading-relaxed">
          {t('metrics.estimatedBudget')}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 relative z-10 mt-6">
        <div className="min-w-0">
          <p className="text-[10px] text-white/80 mb-1 leading-tight">
            {t('metrics.medianTarget')}
            <br />
            {t('metrics.fulfillment')}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i <= Math.round(fulfillment / 20) ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
            <span className="text-xs font-bold ml-1.5">{fulfillment}%</span>
          </div>
        </div>
        <Button
          variant="dark"
          className="gap-1.5 px-3 py-2 text-xs whitespace-nowrap shrink-0"
          onClick={() => navigate('/dashboard/simulator')}
        >
          {t('metrics.simulateBudget')}
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Button>
      </div>

      {simulationResult.affectedCount > 0 && (
        <p className="text-[10px] text-white/80 relative z-10 mt-3 truncate">
          {t('metrics.employeesBelowBand', { count: simulationResult.affectedCount })}
        </p>
      )}

      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />
    </div>
  );
}
