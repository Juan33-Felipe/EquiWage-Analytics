import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../atoms/Avatar';
import { cn } from '../../utils/cn';

export function AlertRow({
  initials,
  name,
  role,
  gap,
  colorClass,
  badgeVariant = 'danger',
  onClick,
  onHover,
  highlight = false,
}) {
  const badgeStyles = {
    danger: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/20',
    warning: 'text-amber-600 dark:text-amber-400 bg-yellow-50 dark:bg-amber-500/15 border border-yellow-200 dark:border-amber-500/20',
    success: 'text-green-700 dark:text-emerald-400 bg-green-50 dark:bg-emerald-500/15 border border-green-200 dark:border-emerald-500/20',
    neutral: 'text-content-muted bg-gray-50 dark:bg-white/5 border border-border',
    legal: 'text-primary-light bg-primary/15 border border-primary/25 font-bold',
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={onHover}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'flex items-center justify-between py-3 border-b border-border/50 last:border-0 px-2 -mx-2 rounded-lg cursor-pointer transition-shadow',
        'hover:bg-surface-light/70',
        highlight && 'bg-primary/10'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar initials={initials} colorClass={colorClass} />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-content-main truncate">{name}</h4>
          <p className="text-xs text-content-muted truncate">{role}</p>
        </div>
      </div>
      <div className={cn('text-sm font-semibold px-2 py-1 rounded-md shrink-0', badgeStyles[badgeVariant])}>
        {gap}
      </div>
    </motion.div>
  );
}
