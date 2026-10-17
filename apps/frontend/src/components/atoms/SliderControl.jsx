import React from 'react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';

export function SliderControl({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  valueLabel,
  className,
}) {
  const { isDark } = useTheme();
  const percent = ((value - min) / (max - min)) * 100;
  const trackRemainder = isDark ? '#374151' : '#F3F4F6';

  return (
    <div className={cn('w-full', className)}>
      {(label || valueLabel) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          {label && <span className="text-sm font-medium text-content-main min-w-0">{label}</span>}
          {valueLabel && (
            <span className="text-sm font-bold text-primary bg-orange-50 px-2.5 py-0.5 rounded-full shrink-0">
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer slider-primary"
        style={{
          background: `linear-gradient(to right, #F97316 ${percent}%, ${trackRemainder} ${percent}%)`,
        }}
      />
    </div>
  );
}
