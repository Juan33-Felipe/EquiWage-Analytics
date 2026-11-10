import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { AnimatedNumber } from '../atoms/AnimatedNumber';
import { cn } from '../../utils/cn';

export function StatCard({
  title,
  value,
  numericValue,
  formatter,
  prefix = '',
  suffix = '',
  decimals = 0,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'danger',
  className,
}) {
  const isDanger = badgeVariant.includes('danger');
  const waveColor = isDanger ? '#EF4444' : '#10B981';
  const gradId = `spark-${(title || 'stat').replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden group', className)}>
      {/* Top Row: CoinSphere-styled Icon Badge + Status Pill */}
      <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/25 shadow-xs">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-content-muted/80 truncate">
            {title}
          </span>
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} className="font-semibold text-xs py-1 px-2.5 rounded-full whitespace-nowrap">
            {badgeText}
          </Badge>
        )}
      </div>

      {/* Middle Block: Bold Numeric Metric + Sparkline Wave */}
      <div className="my-auto py-2 min-w-0 relative z-10">
        <h3 className="text-3xl xl:text-4xl font-extrabold text-content-main tracking-tight truncate leading-none">
          {numericValue !== undefined ? (
            <AnimatedNumber
              value={numericValue}
              formatter={formatter}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
              duration={1300}
            />
          ) : (
            value
          )}
        </h3>

        {/* CoinSphere Wave Sparkline Indicator */}
        <div className="w-full h-8 mt-2 relative overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 200 36" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={waveColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={waveColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={isDanger
                ? "M 0,15 Q 40,28 80,18 T 140,25 T 200,16 L 200,36 L 0,36 Z"
                : "M 0,26 Q 40,10 80,22 T 140,12 T 200,18 L 200,36 L 0,36 Z"
              }
              fill={`url(#${gradId})`}
            />
            <path
              d={isDanger
                ? "M 0,15 Q 40,28 80,18 T 140,25 T 200,16"
                : "M 0,26 Q 40,10 80,22 T 140,12 T 200,18"
              }
              fill="none"
              stroke={waveColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx={isDanger ? "140" : "140"}
              cy={isDanger ? "25" : "12"}
              r="2.5"
              fill={waveColor}
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      {/* Bottom Block: Contextual Subtitle with Clean Divider */}
      <div className="pt-2.5 border-t border-border/50 dark:border-white/[0.06] text-xs text-content-muted min-w-0 relative z-10">
        <p className="truncate leading-snug" title={subtitle}>
          {subtitle}
        </p>
      </div>

      {/* Ambient background glow */}
      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-orange-500/15 blur-xl pointer-events-none" />
    </Card>
  );
}
