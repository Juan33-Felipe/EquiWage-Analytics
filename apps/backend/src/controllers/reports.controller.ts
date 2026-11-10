import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import type { ReportExportRequest } from '@equiwage/shared';
import { reportService } from '../services/index.js';

export class ReportsController {
  /**
   * POST /api/reports/executive
   * Generates structured executive report data or a downloadable .XLSX binary (RF-007).
   */
  generateExecutiveReport = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const body = (req.body || {}) as Partial<ReportExportRequest>;
    const format = body.format || 'json';

    if (format === 'xlsx') {
      const { buffer, fileName } = reportService.generateExecutiveExcelBuffer(body, userId);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(buffer);
      return;
    }

    const reportData = reportService.generateExecutiveReportData(body, userId);
    res.status(200).json({
      ok: true,
      data: reportData,
      timestamp: new Date().toISOString(),
    });
  };
}

export const reportsController = new ReportsController();
