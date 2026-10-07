import React from 'react';
import { HeroCard } from '../molecules/HeroCard';
import { StatCard } from '../molecules/StatCard';
import { User, AlertTriangle, ArrowLeftRight } from 'lucide-react';

export function TopMetricsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <HeroCard />
      
      <StatCard
        title="Employees Analyzed"
        value="1,248"
        subtitle="Across 8 job levels"
        icon={User}
        badgeText="+4.2%"
        badgeVariant="successOutline"
      />
      
      <StatCard
        title="Market Disparities"
        value="87"
        subtitle="Require compensation review"
        icon={AlertTriangle}
        badgeText="7.0%"
        badgeVariant="dangerOutline"
      />
      
      <StatCard
        title="Average Salary Gap"
        value="-8.4%"
        subtitle="Compared to market median"
        icon={ArrowLeftRight}
        badgeText="Below median"
        badgeVariant="dangerOutline"
      />
    </div>
  );
}
