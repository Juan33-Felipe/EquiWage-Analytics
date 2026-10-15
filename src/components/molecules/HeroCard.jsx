import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../atoms/Button';
import { formatCurrency, useCompensation } from '../../context/CompensationContext';
import { ArrowRight } from 'lucide-react';

export function HeroCard() {
  const navigate = useNavigate();
  const { metrics, simulationResult, metrics: { alignedRate } } = useCompensation();
  const fulfillment = Math.round(alignedRate * 100);

  return (
    <div className="bg-gradient-to-br from-primary-hover to-primary-light rounded-xl shadow-soft p-6 flex flex-col justify-between text-white relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-xs font-semibold tracking-wider text-white/80 uppercase mb-2">
          Compensation Equity Plan
        </p>
        <p className="text-sm font-medium text-white/90 mb-1">Total Adjustment Budget</p>
        <h2 className="text-4xl font-bold mb-2 tracking-tight">
          {formatCurrency(metrics.minToMedianBudget)}
        </h2>
        <p className="text-xs text-white/80 max-w-[220px]">
          Estimated budget to close the market gaps across your workforce
        </p>
      </div>

      <div className="flex items-end justify-between gap-3 relative z-10 mt-6">
        <div>
          <p className="text-[10px] text-white/80 mb-1">
            Median target
            <br />
            fulfillment
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
            <span className="text-xs font-bold ml-2">{fulfillment}%</span>
          </div>
        </div>
        <Button
          variant="dark"
          className="gap-2 text-xs whitespace-nowrap"
          onClick={() => navigate('/dashboard/simulator')}
        >
          Simulate Budget
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {simulationResult.affectedCount > 0 && (
        <p className="text-[10px] text-white/80 relative z-10 mt-3">
          {simulationResult.affectedCount} employees currently below their band
        </p>
      )}

      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />
    </div>
  );
}
