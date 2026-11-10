import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Sparkles, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function spreadOffset(index) {
  const pattern = [-0.32, 0.28, -0.12, 0.34, -0.34, 0.14, -0.24, 0.22, 0];
  return pattern[index % pattern.length];
}

function ChartTooltip({ active, payload, t }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  if (!data.name) return null;
  const isLegal = Boolean(data.isBelowMinimumWage);
  const isBelow = data.status === 'below';

  return (
    <div className="bg-surface-light text-content-main p-3.5 rounded-xl shadow-lg text-sm border border-border min-w-[210px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLegal ? 'bg-primary' : isBelow ? 'bg-red-400' : 'bg-emerald-400'
            }`}
          />
          <span className="font-semibold text-content-main">{data.name}</span>
        </div>
        {isLegal && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary-light border border-primary/30">
            &lt; Min Legal
          </span>
        )}
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="text-content-muted">{t('tooltip.level')}</span>
          <span className="font-medium">{t('bands.levelN', { level: data.level })}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-content-muted">{t('tooltip.currentSalary')}</span>
          <span className="font-bold text-content-main">{formatCurrency(data.currentSalary)}</span>
        </div>
        {data.band && (
          <div className="flex items-center justify-between gap-6">
            <span className="text-content-muted">{t('tooltip.bandMedian')}</span>
            <span>{formatCurrency(data.band.median)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-border">
          <span className="text-content-muted">{t('tooltip.gap')}</span>
          <span
            className={
              isLegal
                ? 'text-primary font-bold'
                : isBelow
                  ? 'text-red-400 font-semibold'
                  : 'text-emerald-400 font-semibold'
            }
          >
            {data.gap >= 0 ? '+' : ''}
            {(data.gap * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-[10px] text-content-muted pt-1 text-center italic border-t border-border">
          {t('chart.clickMicroSimulation')}
        </p>
      </div>
    </div>
  );
}

export function SalaryDistributionChart({
  employees,
  bands,
  highlightedId,
  onHoverPoint,
  onClickPoint,
  title,
  subtitle,
  className = 'h-full',
}) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [chartFilter, setChartFilter] = useState('all');
  const displayTitle = title || t('chart.salaryDistribution');
  const displaySubtitle = subtitle || t('chart.employeeSalaries');

  const bandData = useMemo(
    () => bands.map((band) => ({ level: band.level, p25: band.min, p50: band.median, p75: band.max })),
    [bands]
  );

  const points = useMemo(
    () =>
      employees.map((employee, index) => ({
        ...employee,
        x: employee.level + spreadOffset(index),
        salary: employee.currentSalary,
      })),
    [employees]
  );

  const legalViolators = points.filter((p) => p.isBelowMinimumWage && (chartFilter === 'all' || chartFilter === 'legal'));
  const critical = points.filter((p) => p.status === 'below' && !p.isBelowMinimumWage && (chartFilter === 'all' || chartFilter === 'below'));
  const aligned = points.filter((p) => p.status !== 'below' && !p.isBelowMinimumWage && (chartFilter === 'all' || chartFilter === 'aligned'));
  const highlighted = points.filter((p) => p.id === highlightedId);

  const maxSalary = Math.max(
    ...bands.map((b) => b.max),
    ...employees.map((e) => e.currentSalary),
    260000
  );
  const minSalary = Math.min(
    ...bands.map((b) => b.min),
    ...employees.map((e) => e.currentSalary),
    20000
  );

  const criticalCount = points.filter((p) => p.status === 'below' && !p.isBelowMinimumWage).length;
  const legalCount = points.filter((p) => p.isBelowMinimumWage).length;

  const handlePointClick = (entry) => {
    if (onClickPoint && entry) {
      onClickPoint(entry);
    }
  };

  return (
    <Card className={`${className} flex flex-col p-5 sm:p-6 min-h-0`}>
      {/* CoinSphere Profile Chart Header with See all */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-lg font-bold text-content-main tracking-tight truncate">{displayTitle}</h3>
            <Badge variant="successOutline" className="gap-1.5 px-2 py-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('chart.liveAudit')}
            </Badge>
          </div>
          <p className="text-xs text-content-muted">{displaySubtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/distribution')}
          className="px-3 py-1 rounded-full text-xs font-semibold text-content-muted hover:text-content-main bg-white/50 dark:bg-white/[0.05] border border-border dark:border-white/[0.08] hover:border-primary/40 transition-all cursor-pointer shrink-0"
        >
          See all
        </button>
      </div>

      {/* CoinSphere Pill Tabs */}
      <div className="flex items-center flex-wrap gap-1.5 mb-4 p-1 rounded-full bg-white/50 dark:bg-[#1F2029]/80 border border-border/60 dark:border-white/10 text-xs self-start">
        {[
          { id: 'all', label: language === 'es' ? 'Todos' : 'All' },
          { id: 'below', label: `${t('chart.belowBand')} (${criticalCount})` },
          { id: 'aligned', label: language === 'es' ? 'Alineados' : 'Aligned' },
          ...(legalCount > 0 ? [{ id: 'legal', label: `${t('chart.filterLegal')} (${legalCount})` }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setChartFilter(tab.id)}
            className={`py-1 px-3 rounded-full font-semibold transition-all cursor-pointer ${
              chartFilter === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-content-muted hover:text-content-main'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex-1 min-h-[280px] w-full min-w-0 -ml-2 sm:-ml-4 overflow-hidden"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0.5, 8.5]}
              tickCount={9}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
              tickFormatter={(val) => (Number.isInteger(val) ? val : '')}
              dy={10}
            />
            <YAxis
              dataKey="salary"
              type="number"
              domain={[minSalary * 0.9, maxSalary * 1.05]}
              tickCount={6}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
              tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
              dx={-10}
            />
            <Tooltip content={<ChartTooltip t={t} />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--chart-grid)' }} />

            <Line
              data={bandData}
              type="monotone"
              dataKey="p75"
              stroke="#FDBA74"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={true}
              animationDuration={1400}
              animationEasing="ease-out"
              animationBegin={100}
            />
            <Line
              data={bandData}
              type="monotone"
              dataKey="p25"
              stroke="#FDBA74"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={true}
              animationDuration={1400}
              animationEasing="ease-out"
              animationBegin={250}
            />
            <Line
              data={bandData}
              type="monotone"
              dataKey="p50"
              stroke="#F97316"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive={true}
              animationDuration={1400}
              animationEasing="ease-out"
              animationBegin={400}
            />

            <Scatter
              data={aligned}
              fill="#10B981"
              dataKey="salary"
              className="cursor-pointer"
              onClick={handlePointClick}
              onMouseEnter={onHoverPoint}
              onTouchStart={onHoverPoint}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={550}
            />

            <Scatter
              data={critical}
              fill="#EF4444"
              dataKey="salary"
              className="cursor-pointer"
              onClick={handlePointClick}
              onMouseEnter={onHoverPoint}
              onTouchStart={onHoverPoint}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={650}
            />

            {legalViolators.length > 0 && (
              <Scatter
                data={legalViolators}
                fill="#EA580C"
                dataKey="salary"
                className="cursor-pointer"
                onClick={handlePointClick}
                onMouseEnter={onHoverPoint}
                onTouchStart={onHoverPoint}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={750}
              />
            )}

            {highlighted.length > 0 && (
              <Scatter
                data={highlighted}
                fill="#EF4444"
                dataKey="salary"
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const color = payload.isBelowMinimumWage
                    ? '#EA580C'
                    : payload.status === 'below'
                      ? '#EF4444'
                      : '#F97316';
                  return (
                    <g className="cursor-pointer" onClick={() => handlePointClick(payload)}>
                      <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.25} />
                      <circle cx={cx} cy={cy} r={5} fill={color} />
                      <circle cx={cx} cy={cy} r={7} fill="none" stroke={color} strokeWidth={1.5} />
                    </g>
                  );
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="text-center mt-1 mb-1">
        <span className="text-xs text-content-muted font-medium">{t('chart.jobLevel')}</span>
      </div>

      <div className="mt-2 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-content-main leading-snug">
          <span className="font-semibold text-primary">{t('chart.insight')}</span>{' '}
          {(employees?.length || 0) === 0 ? (
            t('chart.noDataInsight')
          ) : (
            <>
              {legalCount > 0 ? (
                <span className="text-primary-light font-semibold">
                  {t('chart.legalViolationNotice', { count: legalCount })}{' '}
                </span>
              ) : null}
              {criticalCount > 0
                ? t('chart.employeesBelowMarket', { count: criticalCount })
                : legalCount === 0
                  ? t('chart.everyEmployeeAligned')
                  : ''}
            </>
          )}
        </p>
      </div>
    </Card>
  );
}
