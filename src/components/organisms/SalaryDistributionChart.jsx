import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Sparkles } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

export function SalaryDistributionChart() {
  // Mock data for the chart
  const data = [
    { level: 1.2, salary: 65, status: 'below', name: 'Alex' },
    { level: 1.5, salary: 85, status: 'above', name: 'Sam' },
    { level: 2.1, salary: 98, status: 'above', name: 'Jordan' },
    { level: 2.3, salary: 82, status: 'below', name: 'Taylor' },
    { level: 3.1, salary: 120, status: 'above', name: 'Casey' },
    { level: 3.2, salary: 91, status: 'below', name: 'Riley' },
    { level: 3.4, salary: 105, status: 'above', name: 'Morgan' },
    { level: 4.8, salary: 145, status: 'above', name: 'Quinn' },
    { level: 4.9, salary: 115, status: 'below', name: 'Maria Rodriguez', highlight: true },
    { level: 5.2, salary: 165, status: 'above', name: 'Avery' },
    { level: 5.6, salary: 150, status: 'above', name: 'Devin' },
    { level: 6.2, salary: 190, status: 'above', name: 'Logan' },
    { level: 6.4, salary: 142, status: 'below', name: 'Drew' },
    { level: 7.1, salary: 215, status: 'above', name: 'Micah' },
    { level: 7.6, salary: 175, status: 'below', name: 'Jesse' },
  ];

  // Band data for the curved lines (P25 to P75)
  const bandData = [
    { level: 1, p25: 55, p75: 65 },
    { level: 2, p25: 62, p75: 75 },
    { level: 3, p25: 70, p75: 88 },
    { level: 4, p25: 82, p75: 105 },
    { level: 5, p25: 98, p75: 125 },
    { level: 6, p25: 115, p75: 145 },
    { level: 7, p25: 135, p75: 165 },
    { level: 8, p25: 155, p75: 185 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data.name) return null; // Don't show tooltip for band lines
      
      return (
        <div className="bg-[#1C1C1C] text-white p-3 rounded-xl shadow-lg text-sm border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${data.status === 'below' ? 'bg-danger' : 'bg-success'}`} />
            <span className="font-semibold">{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-gray-400">Level {Math.floor(data.level)} • {data.status === 'below' ? 'below median' : 'above median'}</span>
            <span className={data.status === 'below' ? 'text-danger' : 'text-success'}>
              {data.status === 'below' ? '-15.2%' : '+4.1%'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-content-main tracking-tight">Salary Distribution</h3>
            <Badge variant="successOutline" className="gap-1.5 px-2 py-0.5 bg-green-50/50">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Live audit
            </Badge>
          </div>
          <p className="text-xs text-content-muted">Employee salaries by job level and market band</p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="level" 
              type="number" 
              domain={[1, 8]} 
              tickCount={8}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              dy={10}
            />
            <YAxis 
              dataKey="salary" 
              type="number"
              domain={[60, 220]}
              tickCount={5}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `$${val}k`}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            {/* Background Band Area */}
            <Line data={bandData} type="monotone" dataKey="p75" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            <Line data={bandData} type="monotone" dataKey="p25" stroke="#FDBA74" strokeWidth={2} dot={false} activeDot={false} />
            
            {/* Data points */}
            <Scatter 
              data={data.filter(d => d.status === 'above')} 
              fill="#10B981"
              dataKey="salary"
            />
            <Scatter 
              data={data.filter(d => d.status === 'below' && !d.highlight)} 
              fill="#EF4444"
              dataKey="salary"
            />
            
            {/* Highlighted point */}
            <Scatter 
              data={data.filter(d => d.highlight)} 
              fill="#EF4444"
              dataKey="salary"
              shape={(props) => {
                const { cx, cy } = props;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={8} fill="#EF4444" opacity={0.2} />
                    <circle cx={cx} cy={cy} r={4} fill="#EF4444" />
                    <circle cx={cx} cy={cy} r={6} fill="none" stroke="#EF4444" strokeWidth={1} />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center mt-2 mb-4">
        <span className="text-xs text-gray-400 font-medium">Job Level</span>
      </div>

      {/* Footer Insight */}
      <div className="mt-4 bg-orange-50/50 border border-orange-100 rounded-lg p-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-xs text-content-main">
          <span className="font-semibold text-primary">Insight:</span> Most disparities are concentrated in levels 2-5.
        </p>
      </div>
    </Card>
  );
}
