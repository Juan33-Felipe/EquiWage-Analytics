import React, { useMemo } from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '../../context/CompensationContext';
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

export function SalaryDistributionChart({
  employees,
  bands,
  highlightedId,
  onHoverPoint,
  title = 'Salary Distribution',
  subtitle = 'Employee salaries by job level and market band',
  className = 'h-full',
}) {
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

  const aligned = points.filter((p) => p.status === 'aligned' || p.status === 'above');
  const critical = points.filter((p) => p.status === 'below');
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

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    if (!data.name) return null;
    const isBelow = data.status === 'below';
    return (
      <div className="bg-[#1C1C1C] text-white p-3 rounded-xl shadow-lg text-sm border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isBelow ? 'bg-danger' : 'bg-success'}`} />
          <span className="font-semibold">{data.name}</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-400">Level</span>
            <span>{data.level}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-400">Current salary</span>
            <span className="font-semibold">{formatCurrency(data.currentSalary)}</span>
          </div>
          {data.band && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-gray-400">Band median</span>
              <span>{formatCurrency(data.band.median)}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-6 pt-1 border-t border-gray-700">
            <span className="text-gray-400">Gap</span>
            <span className={isBelow ? 'text-danger font-semibold' : 'text-success font-semibold'}>
              {data.gap >= 0 ? '+' : ''}
              {(data.gap * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const criticalCount = critical.length;

  return (
    <Card className={`${className} flex flex-col p-6`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-content-main tracking-tight">{title}</h3>
            <Badge variant="successOutline" className="gap-1.5 px-2 py-0.5 bg-green-50/50">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Live audit
            </Badge>
          </div>
          <p className="text-xs text-content-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium shrink-0">
          <span className="flex items-center gap-1.5 text-content-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-success" /> Aligned
          </span>
          <span className="flex items-center gap-1.5 text-content-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" /> Below band
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
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
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

            {/* Market band (P25–P75) + median curve */}
            <Line data={bandData} type="monotone" dataKey="p75" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            <Line data={bandData} type="monotone" dataKey="p25" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            <Line data={bandData} type="monotone" dataKey="p50" stroke="#F97316" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={false} />

            {/* Aligned points */}
            <Scatter data={aligned} fill="#10B981" dataKey="salary" onMouseEnter={onHoverPoint} onTouchStart={onHoverPoint} />

            {/* Critical points */}
            <Scatter data={critical} fill="#EF4444" dataKey="salary" onMouseEnter={onHoverPoint} onTouchStart={onHoverPoint} />

            {/* Highlighted (hovered/selected) point */}
            {highlighted.length > 0 && (
              <Scatter
                data={highlighted}
                fill="#EF4444"
                dataKey="salary"
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const color = payload.status === 'below' ? '#EF4444' : '#F97316';
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.2} />
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

      <div className="text-center mt-2 mb-2">
        <span className="text-xs text-gray-400 font-medium">Job Level</span>
      </div>

      <div className="mt-2 bg-orange-50/50 border border-orange-100 rounded-lg p-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-content-main">
          <span className="font-semibold text-primary">Insight:</span>{' '}
          {criticalCount > 0
            ? `${criticalCount} employee${criticalCount > 1 ? 's' : ''} sit below the market minimum and need review.`
            : 'Every employee is currently aligned within their market band.'}
        </p>
      </div>
    </Card>
  );
}
