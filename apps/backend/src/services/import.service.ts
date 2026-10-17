import * as XLSX from 'xlsx';
import {
  validateAndNormalizeBandRows,
  validateAndNormalizePayrollRows,
  type AuditSummaryPayload,
  type Employee,
  type SalaryBand,
} from '@equiwage/shared';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { bandsRepository, employeesRepository } from '../repositories/index.js';
import { auditService } from './audit.service.js';

export interface PayrollImportSuccessResponse {
  importedCount: number;
  sourceName: string;
  invalidRows?: Array<{ rowNumber: number; reason: string }>;
  audit: AuditSummaryPayload;
}

export interface BandsImportSuccessResponse {
  importedCount: number;
  sourceName: string;
  invalidRows?: Array<{ rowNumber: number; reason: string }>;
  audit: AuditSummaryPayload;
}

export class ImportService {
  /**
   * Parses a binary .CSV or .XLSX buffer into an array of raw row objects.
   */
  parseSpreadsheetBuffer(buffer: Buffer): Array<Record<string, unknown>> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return [];
      }
      const worksheet = workbook.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    } catch {
      throw new AppError(
        'We could not read this spreadsheet file. Please upload a valid .CSV or .XLSX file.',
        {
          statusCode: 400,
          errorKey: 'error.readError',
        }
      );
    }
  }

  /**
   * Validates and imports employee payroll from either a file buffer or JSON rows (RF-001, RNF-003).
   */
  importPayroll(params: {
    fileBuffer?: Buffer;
    rawRows?: Array<Record<string, unknown>>;
    employees?: Employee[];
    fileName?: string;
    strictDepartment?: boolean;
  }): PayrollImportSuccessResponse {
    const sourceName = params.fileName?.trim() || 'Imported dataset';

    // Direct pre-validated employees array support (for seamless frontend compatibility)
    if (Array.isArray(params.employees) && params.employees.length > 0) {
      const normalized = params.employees
        .map((emp, idx) => ({
          id: String(emp.id || `EMP-${String(idx + 1).padStart(3, '0')}`),
          name: String(emp.name || 'Unnamed Employee'),
          role: String(emp.role || 'Unassigned Role'),
          department: String(emp.department || 'Unassigned'),
          level: Number(emp.level) || 1,
          currentSalary: Number(emp.currentSalary) || 0,
        }))
        .filter((emp) => emp.currentSalary > 0);

      if (normalized.length === 0) {
        throw new AppError('No valid employee records with positive salaries were provided.', {
          statusCode: 400,
          errorKey: 'error.noValidEmployees',
        });
      }

      employeesRepository.replaceAllEmployees(normalized, sourceName);
      return {
        importedCount: normalized.length,
        sourceName,
        audit: auditService.getFullAuditSummary(),
      };
    }

    const rows = params.fileBuffer
      ? this.parseSpreadsheetBuffer(params.fileBuffer)
      : params.rawRows ?? [];

    const validation = validateAndNormalizePayrollRows(rows, {
      strictDepartment: params.strictDepartment ?? false,
    });

    if (!validation.ok || !validation.data) {
      throw new AppError(
        validation.message || 'The uploaded payroll file is invalid or missing mandatory columns.',
        {
          statusCode: 400,
          errorKey: validation.errorKey || 'employees.missingRequired',
          missingColumns: validation.missingColumns,
          details: validation.invalidRows?.map((item) => ({
            row: item.rowNumber,
            issue: item.reason,
          })),
        }
      );
    }

    employeesRepository.replaceAllEmployees(validation.data, sourceName);

    return {
      importedCount: validation.data.length,
      sourceName,
      invalidRows: validation.invalidRows,
      audit: auditService.getFullAuditSummary(),
    };
  }

  /**
   * Validates and imports market salary bands from either a file buffer or JSON rows (RF-002, RNF-003).
   */
  importSalaryBands(params: {
    fileBuffer?: Buffer;
    rawRows?: Array<Record<string, unknown>>;
    bands?: SalaryBand[];
    fileName?: string;
  }): BandsImportSuccessResponse {
    const sourceName = params.fileName?.trim() || 'Imported salary bands';

    if (Array.isArray(params.bands) && params.bands.length > 0) {
      const normalized = params.bands
        .map((band) => ({
          level: Number(band.level),
          min: Number(band.min),
          median: Number(band.median),
          max: Number(band.max),
        }))
        .filter((band) => [band.level, band.min, band.median, band.max].every(Number.isFinite));

      if (normalized.length === 0) {
        throw new AppError('No valid salary band ranges were provided.', {
          statusCode: 400,
          errorKey: 'error.noRanges',
        });
      }

      bandsRepository.replaceAllBands(normalized);
      return {
        importedCount: normalized.length,
        sourceName,
        audit: auditService.getFullAuditSummary(),
      };
    }

    const rows = params.fileBuffer
      ? this.parseSpreadsheetBuffer(params.fileBuffer)
      : params.rawRows ?? [];

    const validation = validateAndNormalizeBandRows(rows);

    if (!validation.ok || !validation.data) {
      throw new AppError(
        validation.message || 'We could not find valid salary band ranges (P25, P50, P75) in this file.',
        {
          statusCode: 400,
          errorKey: validation.errorKey || 'error.noRanges',
          missingColumns: validation.missingColumns,
          details: validation.invalidRows?.map((item) => ({
            row: item.rowNumber,
            issue: item.reason,
          })),
        }
      );
    }

    bandsRepository.replaceAllBands(validation.data);

    return {
      importedCount: validation.data.length,
      sourceName,
      invalidRows: validation.invalidRows,
      audit: auditService.getFullAuditSummary(),
    };
  }
}

export const importService = new ImportService();
