import React from 'react';
import { Card } from '../atoms/Card';
import { AlertRow } from '../molecules/AlertRow';
import { ListFilter } from 'lucide-react';

export function InequityAlertsWidget() {
  const alerts = [
    { initials: 'MC', name: 'Maya Chen', role: 'Senior Product Designer', gap: '-18.2%', colorClass: 'bg-blue-50 text-blue-700' },
    { initials: 'DB', name: 'Daniel Brooks', role: 'Software Engineer II', gap: '-15.0%', colorClass: 'bg-cyan-50 text-cyan-700' },
    { initials: 'PN', name: 'Priya Nair', role: 'Marketing Manager', gap: '-12.7%', colorClass: 'bg-yellow-50 text-yellow-700' },
    { initials: 'JE', name: 'Jordan Ellis', role: 'Financial Analyst', gap: '-10.4%', colorClass: 'bg-emerald-50 text-emerald-700' },
    { initials: 'SM', name: 'Sofia Martinez', role: 'People Operations Lead', gap: '-9.8%', colorClass: 'bg-pink-50 text-pink-700' },
  ];

  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-content-main tracking-tight">Inequity Alerts</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-bold text-danger">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              87 Detected
            </div>
          </div>
          <p className="text-xs text-content-muted">Largest gaps requiring attention</p>
        </div>
        <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
          <ListFilter className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 mt-2 overflow-y-auto pr-2 -mr-2">
        {alerts.map((alert, i) => (
          <AlertRow key={i} {...alert} />
        ))}
      </div>
    </Card>
  );
}
