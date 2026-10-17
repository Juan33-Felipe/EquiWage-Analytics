import type { SalaryBand } from '@equiwage/shared';
import { AppError } from '../middlewares/error-handler.middleware.js';

/**
 * Validates a partial or complete salary band update for a single level.
 */
export function validateBandUpdatePayload(
  existing: SalaryBand,
  patch: Record<string, unknown>
): SalaryBand {
  const min = patch.min !== undefined ? Number(patch.min) : existing.min;
  const median = patch.median !== undefined ? Number(patch.median) : existing.median;
  const max = patch.max !== undefined ? Number(patch.max) : existing.max;

  if (![min, median, max].every((val) => Number.isFinite(val) && val >= 0)) {
    throw new AppError(
      'Salary band Minimum (P25), Median (P50), and Maximum (P75) must be valid non-negative numbers.',
      {
        statusCode: 400,
        errorKey: 'error.invalidBandValues',
      }
    );
  }

  // Ensure monotonic order if user edits a single field or all fields
  const safeMedian = Math.max(median, min);
  const safeMax = Math.max(max, safeMedian);

  return {
    level: existing.level,
    min,
    median: safeMedian,
    max: safeMax,
  };
}
