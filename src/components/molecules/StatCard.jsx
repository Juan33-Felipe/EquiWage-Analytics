import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { cn } from '../../utils/cn';

export function StatCard({ title, value, subtitle, icon: Icon, badgeText, badgeVariant = 'danger', badgeIcon: BadgeIcon, className }) {
  return (
    <Card className={cn("justify-between", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} className="font-semibold text-xs py-1 px-2.5">
            {badgeText}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-sm text-content-muted mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-content-main mb-1 tracking-tight">{value}</h3>
        <p className="text-xs text-content-muted">{subtitle}</p>
      </div>
    </Card>
  );
}
