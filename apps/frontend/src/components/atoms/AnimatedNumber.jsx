import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedNumber renders a number that counts up smoothly from 0 (or previous value)
 * to the target value with a natural easing curve.
 */
export function AnimatedNumber({
  value = 0,
  duration = 1300,
  formatter,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) {
  const targetNum = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;

  const [currentValue, setCurrentValue] = useState(0);
  const prevValueRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const diff = targetNum - startValue;

    if (diff === 0) {
      return;
    }

    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out Quartic: starts briskly, decelerates smoothly
      const ease = 1 - Math.pow(1 - progress, 4);
      const val = startValue + diff * ease;

      setCurrentValue(val);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCurrentValue(targetNum);
        prevValueRef.current = targetNum;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetNum, duration]);

  const formatted = formatter
    ? formatter(currentValue)
    : `${prefix}${currentValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

  return <span className={className}>{formatted}</span>;
}
