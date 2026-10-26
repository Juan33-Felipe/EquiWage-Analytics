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

/** Dispersión horizontal determinista por empleado para evitar solapamiento. */
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
    <div className="bg-[#1C1C1C] text-white p-3.5 rounded-xl shadow-lg text-sm border border-gray-800 min-w-[210px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLegal ? 'bg-orange-500' : isBelow ? 'bg-danger' : 'bg-success'
            }`}
          />
          <span className="font-semibold text-white">{data.name}</span>
        </div>
        {isLegal && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/60 text-orange-300 border border-orange-700/50">
            &lt; Mínimo Legal
          </span>
        )}
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="text-gray-400">{t('tooltip.level')}</span>
          <span className="font-medium">Nivel {data.level}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-gray-400">{t('tooltip.currentSalary')}</span>
          <span className="font-bold text-white">{formatCurrency(data.currentSalary)}</span>
        </div>
        {data.band && (
          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-400">{t('tooltip.bandMedian')}</span>
            <span>{formatCurrency(data.band.median)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-gray-700">
          <span className="text-gray-400">{t('tooltip.gap')}</span>
          <span
            className={
              isLegal
                ? 'text-orange-400 font-bold'
                : isBelow
                  ? 'text-danger font-semibold'
                  : 'text-success font-semibold'
            }
          >
            {data.gap >= 0 ? '+' : ''}
            {(data.gap * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-[10px] text-gray-400 pt-1 text-center italic border-t border-gray-800">
          Haz clic para abrir micro-simulación 1-a-1
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
            <Badge variant="successOutline" className="gap-1.5 px-2 py-0.5 bg-green-50/50 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              {t('chart.liveAudit')}
            </Badge>
          </div>
          <p className="text-xs text-content-muted">{displaySubtitle}</p>
        </div>
        <div className="flex items-center flex-wrap gap-3 text-xs font-medium shrink-0">
          {legalCount > 0 && (
            <span className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300 font-bold whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" /> &lt; Salario Mínimo ({legalCount})
            </span>
          )}
          <span className="flex items-center gap-1.5 text-content-muted whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0" /> {t('chart.belowBand')} ({criticalCount})
          </span>
          <span className="flex items-center gap-1.5 text-content-muted whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" /> {t('chart.aligned')}
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
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
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
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              dx={-10}
            />
            <Tooltip content={<ChartTooltip t={t} />} cursor={{ strokeDasharray: '3 3' }} />

            {/* Market band (P25–P75) + median curve */}
            <Line data={bandData} type="monotone" dataKey="p75" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            <Line data={bandData} type="monotone" dataKey="p25" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            <Line data={bandData} type="monotone" dataKey="p50" stroke="#F97316" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={false} />

            {/* Aligned points */}
            <Scatter
              data={aligned}
              fill="#10B981"
              dataKey="salary"
              className="cursor-pointer"
              onClick={handlePointClick}
              onMouseEnter={onHoverPoint}
              onTouchStart={onHoverPoint}
            />

            {/* Critical below band points (Red) */}
            <Scatter
              data={critical}
              fill="#EF4444"
              dataKey="salary"
              className="cursor-pointer"
              onClick={handlePointClick}
              onMouseEnter={onHoverPoint}
              onTouchStart={onHoverPoint}
            />

            {/* Priority 1 Legal Minimum Wage violators (Primary Orange #F97316) */}
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

            {/* Highlighted (hovered/selected) point */}
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
        <span className="text-xs text-gray-400 font-medium">{t('chart.jobLevel')}</span>
      </div>

      <div className="mt-2 bg-orange-50/50 border border-orange-100 rounded-lg p-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-content-main leading-snug">
          <span className="font-semibold text-primary">{t('chart.insight')}</span>{' '}
          {legalCount > 0 ? (
            <span className="text-orange-700 dark:text-orange-400 font-semibold">
              {legalCount} {legalCount === 1 ? 'caso incumple' : 'casos incumplen'} el piso legal estatutario.{' '}
            </span>
          ) : null}
          {criticalCount > 0
            ? t('chart.employeesBelowMarket', { count: criticalCount })
            : legalCount === 0
              ? t('chart.everyEmployeeAligned')
              : ''}
        </p>
      </div>
    </Card>
  );
}
