import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { TopMetricsRow } from '../components/organisms/TopMetricsRow';
import { SalaryDistributionChart } from '../components/organisms/SalaryDistributionChart';
import { InequityAlertsWidget } from '../components/organisms/InequityAlertsWidget';
import { useCompensation, formatCurrency } from '../context/CompensationContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, ArrowRight, Sparkles } from 'lucide-react';

export function OverviewPage() {
  const navigate = useNavigate();
  const { employees, bands, metrics, simulationResult } = useCompensation();
  const [highlightId, setHighlightId] = useState(null);

  const statusCounts = employees.reduce(
    (acc, employee) => {
      acc[employee.status] = (acc[employee.status] || 0) + 1;
      return acc;
    },
    { aligned: 0, below: 0, above: 0 }
  );

  const pieData = [
    { name: 'Aligned', value: statusCounts.aligned, color: '#10B981' },
    { name: 'Below min', value: statusCounts.below, color: '#EF4444' },
    { name: 'Above max', value: statusCounts.above, color: '#F59E0B' },
  ].filter((entry) => entry.value > 0);

  const alignedPercent = metrics.headcount ? Math.round((statusCounts.aligned / metrics.headcount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">Analysis Overview</h2>
          <p className="text-sm text-content-muted mt-1">
            A clear picture of how your salaries compare to the market today.
          </p>
        </div>
      </div>

      <TopMetricsRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[480px]">
        <div className="lg:col-span-2 h-full">
          <SalaryDistributionChart
            employees={employees}
            bands={bands}
            highlightedId={highlightId}
            onHoverPoint={(point) => setHighlightId(point?.id ?? null)}
          />
        </div>
        <div className="h-full">
          <InequityAlertsWidget
            onHover={(employee) => setHighlightId(employee.id)}
            onSelect={(employee) => {
              setHighlightId(employee.id);
              navigate('/dashboard/distribution');
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-content-main tracking-tight">Alignment Distribution</h3>
          </div>
          <p className="text-xs text-content-muted mb-4">Where your employees sit within market bands</p>
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-content-main">{alignedPercent}%</span>
              <span className="text-xs text-content-muted">Aligned</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-content-muted">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-gradient-to-br from-primary-hover to-primary-light text-white border-0 p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-lg font-bold tracking-tight mb-1">Financial Impact Summary</h3>
            <p className="text-xs text-white/85 mb-6">What it would cost to level the workforce to the market</p>

            <div className="space-y-3">
              <div className="p-4 bg-white/15 rounded-xl border border-white/25 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Cost to Band Minimum</h4>
                  <p className="text-xs text-white/85 mt-0.5">
                    Bring {metrics.marketDisparities} employees up to P25
                  </p>
                </div>
                <span className="text-xl font-bold">
                  {formatCurrency(
                    employees
                      .filter((employee) => employee.status === 'below')
                      .reduce((acc, employee) => acc + (employee.band.min - employee.currentSalary), 0)
                  )}
                </span>
              </div>
              <div className="p-4 bg-black/10 rounded-xl border border-black/10 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Cost to Market Median</h4>
                  <p className="text-xs text-white/80 mt-0.5">Full competitiveness at P50</p>
                </div>
                <span className="text-xl font-bold">{formatCurrency(simulationResult.totalBudget)}</span>
              </div>
            </div>

            <div className="mt-auto pt-6 flex items-center justify-between gap-4">
              <p className="text-xs text-white/85 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Adjust the scenario in the simulator before committing budget.
              </p>
              <Button
                variant="dark"
                className="gap-2 shrink-0"
                onClick={() => navigate('/dashboard/simulator')}
              >
                Open Simulator
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        </Card>
      </div>
    </div>
  );
}
