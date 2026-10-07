import React from 'react';
import { Card } from '../components/atoms/Card';
import { StatCard } from '../components/molecules/StatCard';
import { Activity, Users, ShieldAlert, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AlertRow } from '../components/molecules/AlertRow';

export function OverviewPage() {
  const pieData = [
    { name: 'Aligned', value: 85, color: '#10B981' },
    { name: 'Below Min', value: 10, color: '#EF4444' },
    { name: 'Above Max', value: 5, color: '#F59E0B' },
  ];

  const barData = [
    { department: 'Engineering', belowMin: 12, inequity: 4 },
    { department: 'Sales', belowMin: 8, inequity: 2 },
    { department: 'Marketing', belowMin: 3, inequity: 1 },
    { department: 'HR', belowMin: 1, inequity: 0 },
    { department: 'Operations', belowMin: 5, inequity: 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">Analysis Overview</h2>
          <p className="text-sm text-content-muted mt-1">Comprehensive summary of the current compensation structure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Overall Salary Health"
          value="85%"
          subtitle="Employees within market bands"
          icon={Activity}
          badgeText="Healthy"
          badgeVariant="successOutline"
        />
        <StatCard
          title="Total Headcount"
          value="1,248"
          subtitle="Included in current analysis"
          icon={Users}
        />
        <StatCard
          title="Below Market Min"
          value="29"
          subtitle="Employees require adjustment"
          icon={TrendingDown}
          badgeText="Action Req"
          badgeVariant="dangerOutline"
        />
        <StatCard
          title="Internal Inequities"
          value="9"
          subtitle="Exceed 10% variance in same role"
          icon={ShieldAlert}
          badgeText="High Priority"
          badgeVariant="dangerOutline"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
          <h3 className="text-lg font-bold text-content-main mb-4 tracking-tight relative">Alignment Distribution</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#111827', fontSize: '12px', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold text-content-main">85%</span>
              <span className="text-xs text-content-muted">Aligned</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-content-muted">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
          <h3 className="text-lg font-bold text-content-main mb-1 tracking-tight relative">Disparities by Department</h3>
          <p className="text-xs text-content-muted mb-6 relative">Number of employees below market minimum and internal inequities</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="belowMin" name="Below Minimum" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="inequity" name="Internal Inequity" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
          <h3 className="text-lg font-bold text-content-main mb-4 tracking-tight relative">Critical Internal Inequities</h3>
          <div className="space-y-1">
            <AlertRow initials="JD" name="John Doe" role="Senior Engineer" gap="14% Variance" colorClass="bg-red-100 text-red-700" />
            <AlertRow initials="AS" name="Alice Smith" role="Product Manager" gap="12% Variance" colorClass="bg-orange-100 text-orange-700" />
            <AlertRow initials="RJ" name="Robert Jones" role="Account Executive" gap="11% Variance" colorClass="bg-orange-100 text-orange-700" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-primary to-orange-400 text-white border-0 shadow-lg shadow-orange-500/20">
          <h3 className="text-lg font-bold text-white mb-4 tracking-tight">Financial Impact Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/20 rounded-xl border border-white/30 flex justify-between items-center backdrop-blur-sm">
              <div>
                <h4 className="font-semibold text-white text-sm">Cost to Minimum</h4>
                <p className="text-xs text-white/90 mt-0.5">Adjusting all 29 employees to band minimum</p>
              </div>
              <span className="text-xl font-bold text-white">$128,450</span>
            </div>
            <div className="p-4 bg-black/10 rounded-xl border border-black/10 flex justify-between items-center backdrop-blur-sm">
              <div>
                <h4 className="font-semibold text-white text-sm">Cost to Median</h4>
                <p className="text-xs text-white/80 mt-0.5">Adjusting to market median (Optional)</p>
              </div>
              <span className="text-xl font-bold text-white">$345,200</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
