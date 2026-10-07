import React from 'react';
import { TopMetricsRow } from '../components/organisms/TopMetricsRow';
import { SalaryDistributionChart } from '../components/organisms/SalaryDistributionChart';
import { InequityAlertsWidget } from '../components/organisms/InequityAlertsWidget';

export function DashboardPage() {
  return (
    <>
      <TopMetricsRow />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[460px]">
        <div className="lg:col-span-2 h-full">
          <SalaryDistributionChart />
        </div>
        <div className="h-full">
          <InequityAlertsWidget />
        </div>
      </div>
    </>
  );
}
