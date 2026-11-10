import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { AnimatedNumber } from '../atoms/AnimatedNumber';
import { formatCurrency, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export function HeroCard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { metrics, simulationResult, metrics: { alignedRate } } = useCompensation();
  const { t } = useLanguage();
  const fulfillment = Math.min(100, Math.max(0, Math.round(alignedRate * 100)));

  // Gauge calculation for CoinSphere arch
  const radius = 64;
  const cx = 100;
  const cy = 82;
  const arcLength = Math.PI * radius; // ~201
  const dashOffset = arcLength * (1 - fulfillment / 100);
  const angle = Math.PI - (fulfillment / 100) * Math.PI;
  const markerX = cx + radius * Math.cos(angle);
  const markerY = cy - radius * Math.sin(angle);

  return (
    <div className="bg-surface dark:bg-[#181920]/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 flex flex-col justify-between text-content-main relative overflow-hidden h-full shadow-[0_4px_20px_rgba(15,23,42,0.04)] dark:shadow-soft border border-border dark:border-white/10 transition-all group">
      {/* Top Row: Plan Label + Badge */}
      <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/25 shadow-xs">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-content-muted/80 truncate">
            {t('metrics.compensationEquity')}
          </span>
        </div>
        <Badge variant="success" className="gap-1 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
          <TrendingUp className="w-3 h-3" />
          <span>+{fulfillment}% P50</span>
        </Badge>
      </div>

      {/* Middle Block: Metric Value + CoinSphere Arched Semi-Circle Gauge */}
      <div className="my-auto py-1 min-w-0 relative z-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
          {t('metrics.totalAdjustment')}
        </p>
        <h2 className="text-3xl xl:text-4xl font-extrabold text-content-main tracking-tight leading-none mb-3">
          <AnimatedNumber
            value={metrics.minToMedianBudget}
            formatter={(v) => formatCurrency(Math.round(v))}
            duration={1400}
          />
        </h2>

        {/* CoinSphere Signature Arched Gauge */}
        <div className="relative w-full max-w-[210px] h-[92px] flex items-center justify-center">
          <svg viewBox="0 0 200 95" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="coinsphereGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF5C00" />
                <stop offset="35%" stopColor="#F59E0B" />
                <stop offset="70%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Inactive Track */}
            <path
              d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
              strokeWidth="11"
              strokeLinecap="round"
            />

            {/* Active Colored Arc */}
            <path
              d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
              fill="none"
              stroke="url(#coinsphereGauge)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={dashOffset}
              filter={isDark ? 'url(#gaugeGlow)' : undefined}
              className="transition-all duration-1000 ease-out"
            />

            {/* Knob Indicator on Gauge Arc */}
            {fulfillment > 0 && (
              <g transform={`translate(${markerX}, ${markerY})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="5"
                  className="fill-white stroke-primary stroke-2 shadow-md"
                />
              </g>
            )}
          </svg>

          {/* Text inside Arch */}
          <div className="absolute bottom-1 inset-x-0 flex flex-col items-center text-center pointer-events-none">
            <span className="text-xs font-bold text-content-main leading-tight">
              {fulfillment}% Cumplimiento
            </span>
            <span className="text-[10px] text-content-muted">vs. Mediana Mercado</span>
          </div>
        </div>
      </div>

      {/* Bottom Block: Simulate Action Button */}
      <div className="pt-3 border-t border-border dark:border-white/[0.08] flex items-center justify-between gap-2 relative z-10">
        <span className="text-xs text-content-muted truncate">
          {t('metrics.estimatedBudget')}
        </span>

        <button
          type="button"
          onClick={() => navigate('/dashboard/simulator')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/25 active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
        >
          {t('metrics.simulateBudget')}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ambient glass background lights */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-orange-500/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-orange-600/20 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
}
