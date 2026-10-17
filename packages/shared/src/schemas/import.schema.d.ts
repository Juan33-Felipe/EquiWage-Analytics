import type { ImportValidationResult } from '../types/api.types.js';
import type { Employee, SalaryBand } from '../types/domain.types.js';

export declare function findMissingPayrollColumns(
  rows: Array<Record<string, unknown>>,
  options?: { strictDepartment?: boolean }
): string[];

export declare function findMissingBandColumns(
  rows: Array<Record<string, unknown>>
): string[];

export declare function validateAndNormalizePayrollRows(
  rawRows: Array<Record<string, unknown>>,
  options?: { strictDepartment?: boolean }
): ImportValidationResult<Employee>;

export declare function validateAndNormalizeBandRows(
  rawRows: Array<Record<string, unknown>>
): ImportValidationResult<SalaryBand>;
