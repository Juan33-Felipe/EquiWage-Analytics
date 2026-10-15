import React from 'react';
import { cn } from '../../utils/cn';

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
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-content-main">{label}</span>}
          {valueLabel && (
            <span className="text-sm font-bold text-primary bg-orange-50 px-2.5 py-0.5 rounded-full">
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
          background: `linear-gradient(to right, #F97316 ${percent}%, #F3F4F6 ${percent}%)`,
        }}
      />
    </div>
  );
}
