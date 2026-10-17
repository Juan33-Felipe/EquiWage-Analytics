import type { Request, Response } from 'express';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { importService } from '../services/index.js';

export class ImportController {
  /**
   * POST /api/import/payroll
   * Processes .CSV / .XLSX file uploads or JSON rows for employee payroll (RF-001, RNF-003).
   */
  importPayroll = (req: Request, res: Response): void => {
    const uploadedFile = req.file;
    const body = (req.body || {}) as Record<string, unknown>;

    if (!uploadedFile && !Array.isArray(body.rows) && !Array.isArray(body.employees)) {
      throw new AppError(
        'No payroll file or employee dataset was provided. Please select a valid .CSV or .XLSX file.',
        {
          statusCode: 400,
          errorKey: 'error.noFile',
        }
      );
    }

    const fileName =
      uploadedFile?.originalname ||
      (typeof body.fileName === 'string' ? body.fileName : undefined) ||
      (typeof body.sourceName === 'string' ? body.sourceName : undefined) ||
      'Imported dataset';

    const result = importService.importPayroll({
      fileBuffer: uploadedFile?.buffer,
      rawRows: Array.isArray(body.rows) ? (body.rows as Array<Record<string, unknown>>) : undefined,
      employees: Array.isArray(body.employees) ? body.employees : undefined,
      fileName,
      strictDepartment: body.strictDepartment === true || body.strictDepartment === 'true',
    });

    res.status(200).json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/import/bands
   * Processes .CSV / .XLSX file uploads or JSON rows for market salary bands (RF-002, RNF-003).
   */
  importBands = (req: Request, res: Response): void => {
    const uploadedFile = req.file;
    const body = (req.body || {}) as Record<string, unknown>;

    if (!uploadedFile && !Array.isArray(body.rows) && !Array.isArray(body.bands)) {
      throw new AppError(
        'No salary bands file or dataset was provided. Please select a valid .CSV or .XLSX file.',
        {
          statusCode: 400,
          errorKey: 'error.noFile',
        }
      );
    }

    const fileName =
      uploadedFile?.originalname ||
      (typeof body.fileName === 'string' ? body.fileName : undefined) ||
      'Imported salary bands';

    const result = importService.importSalaryBands({
      fileBuffer: uploadedFile?.buffer,
      rawRows: Array.isArray(body.rows) ? (body.rows as Array<Record<string, unknown>>) : undefined,
      bands: Array.isArray(body.bands) ? body.bands : undefined,
      fileName,
    });

    res.status(200).json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };
}

export const importController = new ImportController();
