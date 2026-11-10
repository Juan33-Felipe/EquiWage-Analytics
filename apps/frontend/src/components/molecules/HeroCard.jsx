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

  // Gauge calculation for CoinSphere arch - Enlarged for comfortable inner text fit
  const radius = 76;
  const cx = 110;
  const cy = 92;
  const arcLength = Math.PI * radius; // ~238.7
  const dashOffset = arcLength * (1 - fulfillment / 100);
  const angle = Math.PI - (fulfillment / 100) * Math.PI;
  const markerX = cx + radius * Math.cos(angle);
  const markerY = cy - radius * Math.sin(angle);

  return (
    <div className="bg-white/65 dark:bg-[#151210]/75 backdrop-blur-2xl rounded-2xl p-5 sm:p-6 flex flex-col justify-between text-content-main relative overflow-hidden h-full shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-soft border border-white/70 dark:border-white/10 transition-all group">
      {/* Top Row: Icon + Badge */}
      <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
        <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/25 shadow-xs">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <Badge variant="success" className="gap-1 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
          <TrendingUp className="w-3 h-3" />
          <span>+{fulfillment}% P50</span>
        </Badge>
      </div>

      {/* Plan Label */}
      <div className="relative z-10 mb-2">
        <span className="text-[11px] font-bold tracking-wider uppercase text-content-muted/80 truncate block" title={t('metrics.compensationEquity')}>
          {t('metrics.compensationEquity')}
        </span>
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

        {/* CoinSphere Signature Arched Gauge - Enlarged with comfortable text clearance */}
        <div className="relative w-full max-w-[245px] h-[110px] flex items-center justify-center">
          <svg viewBox="0 0 220 105" className="w-full h-full overflow-visible">
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
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Active Colored Arc */}
            <path
              d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
              fill="none"
              stroke="url(#coinsphereGauge)"
              strokeWidth="12"
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
                  r="5.5"
                  className="fill-white stroke-primary stroke-2 shadow-md"
                />
              </g>
            )}
          </svg>

          {/* Text inside Arch */}
          <div className="absolute bottom-1 inset-x-0 flex flex-col items-center text-center pointer-events-none">
            <span className="text-sm font-extrabold text-content-main leading-tight">
              {fulfillment}% Cumplimiento
            </span>
            <span className="text-[11px] text-content-muted font-medium mt-0.5">
              vs. Mediana Mercado
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Block: Simulate Action Button */}
      <div className="pt-3 border-t border-border dark:border-white/[0.08] relative z-10">
        <button
          type="button"
          onClick={() => navigate('/dashboard/simulator')}
          className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/25 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
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
