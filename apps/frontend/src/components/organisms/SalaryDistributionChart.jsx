import React, { useMemo } from 'react';
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
          <span className="font-medium">Nivel {data.level}</span>
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
          Haz clic para abrir micro-simulacion 1-a-1
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
  const { t } = useLanguage();
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

  const legalViolators = points.filter((p) => p.isBelowMinimumWage);
  const critical = points.filter((p) => p.status === 'below' && !p.isBelowMinimumWage);
  const aligned = points.filter((p) => p.status !== 'below' && !p.isBelowMinimumWage);
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

  const criticalCount = critical.length;
  const legalCount = legalViolators.length;

  const handlePointClick = (entry) => {
    if (onClickPoint && entry) {
      onClickPoint(entry);
    }
  };

  return (
    <Card className={`${className} flex flex-col p-6 min-h-0`}>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-content-main tracking-tight">{displayTitle}</h3>
            <Badge variant="successOutline" className="gap-1.5 px-2 py-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('chart.liveAudit')}
            </Badge>
          </div>
          <p className="text-xs text-content-muted">{displaySubtitle}</p>
        </div>
        <div className="flex items-center flex-wrap gap-3 text-xs font-medium shrink-0">
          {legalCount > 0 && (
            <span className="flex items-center gap-1.5 text-primary-light font-bold whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" /> &lt; Salario Min ({legalCount})
            </span>
          )}
          <span className="flex items-center gap-1.5 text-content-muted whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" /> {t('chart.belowBand')} ({criticalCount})
          </span>
          <span className="flex items-center gap-1.5 text-content-muted whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" /> {t('chart.aligned')}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] -ml-4">
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

            <Line data={bandData} type="monotone" dataKey="p75" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            <Line data={bandData} type="monotone" dataKey="p25" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            <Line data={bandData} type="monotone" dataKey="p50" stroke="#F97316" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={false} />

            <Scatter
              data={aligned}
              fill="#10B981"
              dataKey="salary"
              className="cursor-pointer"
              onClick={handlePointClick}
              onMouseEnter={onHoverPoint}
              onTouchStart={onHoverPoint}
            />

            <Scatter
              data={critical}
              fill="#EF4444"
              dataKey="salary"
              className="cursor-pointer"
              onClick={handlePointClick}
              onMouseEnter={onHoverPoint}
              onTouchStart={onHoverPoint}
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
      </div>

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
                  {legalCount} {legalCount === 1 ? 'caso incumple' : 'casos incumplen'} el piso legal estatutario.{' '}
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
