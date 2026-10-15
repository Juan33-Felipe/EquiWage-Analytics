import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Avatar } from '../components/atoms/Avatar';
import { Badge } from '../components/atoms/Badge';
import { SimulatorHeroCard } from '../components/organisms/SimulatorHeroCard';
import { SimulatorControlsCard } from '../components/organisms/SimulatorControlsCard';
import { DepartmentImpactChart } from '../components/organisms/DepartmentImpactChart';
import { formatCurrency, getInitials, useCompensation } from '../context/CompensationContext';
import { ArrowRight, Download, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SEVERITY = {
  critical: { label: 'Critical', variant: 'dangerOutline' },
  moderate: { label: 'Moderate', variant: 'warning' },
  none: { label: 'Aligned', variant: 'success' },
};

export function SimulatorPage() {
  const { simulationResult, simulation, exportSession } = useCompensation();
  const rows = simulationResult.rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">Budget Simulator</h2>
          <p className="text-sm text-content-muted mt-1">
            Model the exact cost of leveling salaries in real time — no data leaves your machine.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportSession}>
          <Download className="w-4 h-4" />
          Save Session
        </Button>
      </div>

      <SimulatorHeroCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SimulatorControlsCard />
        </div>
        <div className="lg:col-span-2">
          <DepartmentImpactChart />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">
              Simulated Employee Adjustments
            </h3>
            <p className="text-xs text-content-muted">
              Target:{' '}
              {simulation.target === 'minimum' ? 'Band Minimum (P25)' : 'Market Median (P50)'} •{' '}
              {simulation.rolloutQuarters} quarter{simulation.rolloutQuarters > 1 ? 's' : ''} rollout
            </p>
          </div>
          <Badge variant="primary" className="bg-orange-50 text-primary">
            {rows.length} employees • {formatCurrency(simulationResult.totalBudget)}
          </Badge>
        </div>

        <div className="max-h-[460px] overflow-auto">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-content-muted">
              No employees require an adjustment under this scenario.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 sticky top-0 text-xs font-semibold text-content-muted uppercase tracking-wider z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">Employee</th>
                  <th className="px-6 py-4 font-medium">Current Salary</th>
                  <th className="px-6 py-4 font-medium">Proposed Salary</th>
                  <th className="px-6 py-4 font-medium text-right">Net Increase</th>
                  <th className="px-6 py-4 font-medium text-right">Gap Severity</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {rows.map((row, index) => {
                  const severity = SEVERITY[row.severity] || SEVERITY.none;
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar initials={getInitials(row.name)} className="w-9 h-9 text-xs" />
                          <div>
                            <p className="font-semibold text-content-main group-hover:text-primary transition-colors">
                              {row.name}
                            </p>
                            <p className="text-xs text-content-muted mt-0.5">
                              L{row.level} • {row.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-content-main font-medium">
                        {formatCurrency(row.currentSalary)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 line-through text-xs font-medium">
                            {formatCurrency(row.currentSalary)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary" />
                          <span className="text-primary font-bold">{formatCurrency(row.proposedSalary)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-success bg-green-50 px-2 py-1 rounded-md text-xs border border-green-100">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{formatCurrency(row.adjustment)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={severity.variant}>{severity.label}</Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
          <p className="text-xs text-content-muted">
            Total budget required: <span className="font-bold text-content-main">{formatCurrency(simulationResult.totalBudget)}</span>
          </p>
          <Button variant="primary" className="gap-2 active:scale-95 transition-transform" onClick={exportSession}>
            Apply Scenario & Export Plan
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
