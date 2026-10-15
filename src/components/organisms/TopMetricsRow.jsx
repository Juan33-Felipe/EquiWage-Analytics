import React from 'react';
import { motion } from 'framer-motion';
import { HeroCard } from '../molecules/HeroCard';
import { StatCard } from '../molecules/StatCard';
import { User, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useCompensation } from '../../context/CompensationContext';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export function TopMetricsRow() {
  const { metrics, simulationResult } = useCompensation();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6"
    >
      <motion.div variants={item}>
        <HeroCard />
      </motion.div>

      <motion.div variants={item}>
        <StatCard
          title="Employees Analyzed"
          value={metrics.headcount.toLocaleString()}
          subtitle={`${metrics.aligned} aligned within market bands`}
          icon={User}
          badgeText={`${Math.round(metrics.alignedRate * 100)}% aligned`}
          badgeVariant="successOutline"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatCard
          title="Market Disparities"
          value={metrics.marketDisparities.toLocaleString()}
          subtitle="Employees below their band minimum"
          icon={AlertTriangle}
          badgeText={`${simulationResult.affectedCount} to adjust`}
          badgeVariant="dangerOutline"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatCard
          title="Average Salary Gap"
          value={`${(metrics.averageGap * 100).toFixed(1)}%`}
          subtitle="Compared to market median"
          icon={ArrowLeftRight}
          badgeText={metrics.averageGap < 0 ? 'Below median' : 'Above median'}
          badgeVariant={metrics.averageGap < 0 ? 'dangerOutline' : 'successOutline'}
        />
      </motion.div>
    </motion.div>
  );
}
