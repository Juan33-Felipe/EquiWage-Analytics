import { SIMULATION_TARGETS, type SimulationParams } from '@equiwage/shared';
import { AppError } from '../middlewares/error-handler.middleware.js';

/**
 * Validates and normalizes incoming simulation parameter updates.
 */
export function validateSimulationPatchPayload(
  body: Record<string, unknown>
): Partial<SimulationParams> {
  const patch: Partial<SimulationParams> = {};

  if (body.target !== undefined) {
    if (
      body.target !== SIMULATION_TARGETS.MINIMUM &&
      body.target !== SIMULATION_TARGETS.MEDIAN
    ) {
      throw new AppError("Simulation target must be either 'minimum' (P25) or 'median' (P50).", {
        statusCode: 400,
        errorKey: 'error.invalidSimulationTarget',
      });
    }
    patch.target = body.target;
  }

  if (body.rolloutQuarters !== undefined) {
    const quarters = Number(body.rolloutQuarters);
    if (!Number.isInteger(quarters) || quarters < 1 || quarters > 4) {
      throw new AppError('Rollout quarters must be an integer between 1 and 4.', {
        statusCode: 400,
        errorKey: 'error.invalidRolloutQuarters',
      });
    }
    patch.rolloutQuarters = quarters;
  }

  if (body.departments !== undefined) {
    if (!Array.isArray(body.departments)) {
      throw new AppError('Departments filter must be an array of department names.', {
        statusCode: 400,
        errorKey: 'error.invalidDepartmentsFilter',
      });
    }
    patch.departments = body.departments.map(String);
  }

  if (body.customAdjustmentPercent !== undefined) {
    const pct = Number(body.customAdjustmentPercent);
    if (!Number.isFinite(pct) || pct < -50 || pct > 100) {
      throw new AppError('Custom adjustment percentage must be between -50% and +100%.', {
        statusCode: 400,
        errorKey: 'error.invalidCustomAdjustment',
      });
    }
    patch.customAdjustmentPercent = pct;
  }

  if (body.inflationPercent !== undefined) {
    const inflation = Number(body.inflationPercent);
    if (!Number.isFinite(inflation) || inflation < 0 || inflation > 25) {
      throw new AppError('Projected market inflation must be between 0% and 25%.', {
        statusCode: 400,
        errorKey: 'error.invalidInflationPercent',
      });
    }
    patch.inflationPercent = inflation;
  }

  if (body.includeLegalCompliance !== undefined) {
    patch.includeLegalCompliance = Boolean(body.includeLegalCompliance);
  }

  if (body.manualAdjustments !== undefined && Array.isArray(body.manualAdjustments)) {
    patch.manualAdjustments = body.manualAdjustments as SimulationParams['manualAdjustments'];
  }

  return patch;
}
