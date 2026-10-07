import React, { useState } from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Avatar } from '../components/atoms/Avatar';
import { Settings2, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

export function SimulatorPage() {
  const [target, setTarget] = useState('minimum'); // 'minimum' or 'median'

  // Mock data for employees below market minimum or with equity gaps
  const employees = [
    { id: 1, name: 'John Doe', role: 'Senior Engineer', level: 4, current: 82000, min: 88000, median: 95000, max: 110000 },
    { id: 2, name: 'Maria Rodriguez', role: 'Product Manager', level: 5, current: 115000, min: 120000, median: 135000, max: 155000 },
    { id: 3, name: 'Taylor Swift', role: 'Marketing Specialist', level: 2, current: 62000, min: 65000, median: 72000, max: 80000 },
    { id: 4, name: 'Alex Johnson', role: 'HR Business Partner', level: 3, current: 71000, min: 75000, median: 82000, max: 92000 },
    { id: 5, name: 'Sam Smith', role: 'Sales Executive', level: 4, current: 85000, min: 88000, median: 95000, max: 110000 },
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const calculateAdjustment = (emp) => {
    const targetVal = target === 'minimum' ? emp.min : emp.median;
    const adjustment = targetVal > emp.current ? targetVal - emp.current : 0;
    return adjustment;
  };

  const calculateNewSalary = (emp) => {
    return emp.current + calculateAdjustment(emp);
  };

  const totalAdjustmentCost = employees.reduce((acc, emp) => acc + calculateAdjustment(emp), 0);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">Salary Adjustment Simulator</h2>
          <p className="text-sm text-content-muted mt-1">Model the financial impact of bringing employees to market bands.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 text-xs py-1.5">
            <Settings2 className="w-4 h-4" />
            Simulation Settings
          </Button>
          <Button variant="primary" className="text-xs py-1.5 px-4">
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left Panel: Controls & Summary */}
        <div className="col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-gray-900 to-[#1C1C1C] text-white border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/25 to-transparent pointer-events-none" />
            <h3 className="text-sm font-medium text-gray-400 mb-1 relative">Total Adjustment Cost</h3>
            <div className="text-4xl font-bold mb-4 tracking-tight relative">
              {formatCurrency(totalAdjustmentCost)}
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 mt-6 border border-white/10 relative">
              <p className="text-xs font-medium text-gray-300 mb-3">Target Strategy</p>
              <div className="flex bg-black/40 rounded-lg p-1">
                <button
                  onClick={() => setTarget('minimum')}
                  className={cn(
                    "flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-200",
                    target === 'minimum' ? "bg-primary text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Minimum
                </button>
                <button
                  onClick={() => setTarget('median')}
                  className={cn(
                    "flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-200",
                    target === 'median' ? "bg-primary text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Median
                </button>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
            <h3 className="text-sm font-semibold text-content-main mb-4 tracking-tight relative">Simulation Insights</h3>
            <div className="space-y-4 relative">
              <div>
                <p className="text-xs text-content-muted mb-1">Affected Employees</p>
                <p className="text-xl font-bold text-content-main">{employees.length}</p>
              </div>
              <div>
                <p className="text-xs text-content-muted mb-1">Average Adjustment</p>
                <p className="text-xl font-bold text-content-main">
                  {formatCurrency(totalAdjustmentCost / employees.length)}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-content-muted leading-relaxed">
                  Adjusting to the <span className="font-semibold text-content-main capitalize">{target}</span> will resolve all identified market disparities for this group.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel: Table */}
        <div className="col-span-3">
          <Card className="h-[600px] overflow-hidden flex flex-col p-0 relative">
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
            <div className="p-6 border-b border-gray-100/50 flex justify-between items-center bg-white/60 backdrop-blur-md z-10 relative">
              <div>
                <h3 className="text-lg font-bold text-content-main tracking-tight mb-1 relative">Employee Breakdown</h3>
                <p className="text-xs text-content-muted relative">Individual salary adjustments to meet target</p>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 bg-orange-50 text-primary rounded-full border border-orange-100">
                {target === 'minimum' ? 'Correcting to Band Minimum' : 'Correcting to Band Median'}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 sticky top-0 text-xs font-semibold text-content-muted uppercase tracking-wider backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-4 font-medium border-b border-gray-100">Employee</th>
                    <th className="px-6 py-4 font-medium border-b border-gray-100">Current Salary</th>
                    <th className="px-6 py-4 font-medium border-b border-gray-100">Band (Min - Med)</th>
                    <th className="px-6 py-4 font-medium text-right border-b border-gray-100">Adjustment</th>
                    <th className="px-6 py-4 font-medium text-right border-b border-gray-100">New Salary</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {employees.map((emp) => {
                    const adjustment = calculateAdjustment(emp);
                    const newSalary = calculateNewSalary(emp);
                    const isAdjusted = adjustment > 0;

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar initials={getInitials(emp.name)} className="w-9 h-9 text-xs" />
                            <div>
                              <p className="font-semibold text-content-main group-hover:text-primary transition-colors">{emp.name}</p>
                              <p className="text-xs text-content-muted mt-0.5">L{emp.level} • {emp.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-content-main font-medium">
                          {formatCurrency(emp.current)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-content-muted bg-gray-50/50 px-2 py-1 rounded w-fit">
                            <span className={cn(target === 'minimum' && 'font-bold text-content-main')}>
                              {formatCurrency(emp.min)}
                            </span>
                            <span className="text-gray-300">-</span>
                            <span className={cn(target === 'median' && 'font-bold text-content-main')}>
                              {formatCurrency(emp.median)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAdjusted ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-success bg-green-50 px-2 py-1 rounded-md text-xs border border-green-100">
                              +{formatCurrency(adjustment)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-content-main">
                          {isAdjusted ? (
                            <div className="flex items-center justify-end gap-2.5">
                              <span className="text-gray-400 line-through text-xs font-medium">
                                {formatCurrency(emp.current)}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-primary" />
                              <span className="text-primary">{formatCurrency(newSalary)}</span>
                            </div>
                          ) : (
                            formatCurrency(emp.current)
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
