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
    danger: 'text-danger bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    warning: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400',
    success: 'text-success bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    neutral: 'text-content-muted bg-gray-100 dark:bg-slate-800 dark:text-gray-400',
    legal: 'text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-bold',
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={onHover}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'flex items-center justify-between py-3 border-b border-gray-50 last:border-0 px-2 -mx-2 rounded-lg cursor-pointer transition-shadow',
        'hover:bg-gray-50/70 hover:shadow-soft',
        highlight && 'bg-orange-50/40'
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
