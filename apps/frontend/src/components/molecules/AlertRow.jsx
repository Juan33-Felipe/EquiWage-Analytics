import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { ChevronRight } from 'lucide-react';
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
  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={onHover}
      whileHover={{ scale: 1.01, x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-all border border-transparent',
        'hover:bg-white/50 dark:hover:bg-white/[0.04] hover:border-border dark:hover:border-white/[0.06]',
        highlight && 'bg-primary/10 border-primary/30'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar initials={initials} colorClass={colorClass} className="w-9 h-9 text-xs shrink-0 shadow-xs" />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-content-main truncate">{name}</h4>
          <p className="text-xs text-content-muted truncate">{role}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={badgeVariant} className="text-xs font-bold px-2.5 py-0.5">
          {gap}
        </Badge>
        <ChevronRight className="w-4 h-4 text-content-muted/60" />
      </div>
    </motion.div>
  );
}
