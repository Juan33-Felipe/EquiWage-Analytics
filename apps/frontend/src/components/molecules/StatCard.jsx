import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { cn } from '../../utils/cn';

export function StatCard({ title, value, subtitle, icon: Icon, badgeText, badgeVariant = 'danger', className }) {
  return (
    <Card className={cn("justify-between h-full", className)}>
      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
        <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-gray-50">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} className="font-semibold text-xs py-1 px-2.5 whitespace-nowrap">
            {badgeText}
          </Badge>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-content-muted mb-1 truncate" title={title}>{title}</p>
        <h3 className="text-3xl font-bold text-content-main mb-1 tracking-tight truncate">{value}</h3>
        <p className="text-xs text-content-muted leading-snug">{subtitle}</p>
      </div>
    </Card>
  );
}
