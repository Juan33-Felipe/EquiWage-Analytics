import React from 'react';
import { motion } from 'framer-motion';
import { HeroCard } from '../molecules/HeroCard';
import { StatCard } from '../molecules/StatCard';
import { User, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6"
    >
      <motion.div variants={item} className="h-full">
        <HeroCard />
      </motion.div>

      <motion.div variants={item} className="h-full">
        <StatCard
          title={t('metrics.employeesAnalyzed')}
          value={metrics.headcount.toLocaleString()}
          subtitle={t('metrics.alignedWithin', { count: metrics.aligned })}
          icon={User}
          badgeText={t('metrics.alignedBadge', { rate: Math.round(metrics.alignedRate * 100) })}
          badgeVariant="successOutline"
        />
      </motion.div>

      <motion.div variants={item} className="h-full">
        <StatCard
          title={t('metrics.marketDisparities')}
          value={metrics.marketDisparities.toLocaleString()}
          subtitle={t('metrics.employeesBelowBandMin')}
          icon={AlertTriangle}
          badgeText={t('metrics.toAdjust', { count: simulationResult.affectedCount })}
          badgeVariant="dangerOutline"
        />
      </motion.div>

      <motion.div variants={item} className="h-full">
        <StatCard
          title={t('metrics.averageSalaryGap')}
          value={`${(metrics.averageGap * 100).toFixed(1)}%`}
          subtitle={t('metrics.comparedMarketMedian')}
          icon={ArrowLeftRight}
          badgeText={metrics.averageGap < 0 ? t('metrics.belowMedian') : t('metrics.aboveMedian')}
          badgeVariant={metrics.averageGap < 0 ? 'dangerOutline' : 'successOutline'}
        />
      </motion.div>
    </motion.div>
  );
}
