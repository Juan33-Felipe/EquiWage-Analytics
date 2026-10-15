import React from 'react';
import { Card } from '../atoms/Card';
import { formatCurrency, useCompensation } from '../../context/CompensationContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../../utils/cn';

const BAR_TONES = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5', '#FFF7ED'];

export function DepartmentImpactChart() {
  const { simulationResult } = useCompensation();
  const data = simulationResult.byDepartment;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">Cost Impact by Department</h3>
          <p className="text-xs text-content-muted">How the simulated budget is distributed across teams</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-content-muted">Total</p>
          <p className="text-xl font-bold text-content-main">{formatCurrency(simulationResult.totalBudget)}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-sm text-content-muted">
          No adjustments required for the selected departments.
        </div>
      ) : (
        <div className="h-[280px] -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="department"
                axisLine={false}
                tickLine={false}
                width={90}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip
                cursor={{ fill: '#F9FAFB' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [formatCurrency(value), 'Budget']}
              />
              <Bar dataKey="cost" radius={[0, 8, 8, 0]} barSize={22}>
                {data.map((entry, index) => (
                  <Cell key={entry.department} fill={BAR_TONES[index % BAR_TONES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.map((item, index) => (
            <div key={item.department} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: BAR_TONES[index % BAR_TONES.length] }}
                />
                <span className="text-xs font-medium text-content-main truncate">{item.department}</span>
              </div>
              <span className={cn('text-xs font-bold shrink-0', 'text-primary')}>
                {Math.round(item.share * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
