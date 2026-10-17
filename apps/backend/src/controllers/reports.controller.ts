import type { Request, Response } from 'express';
import type { ReportExportRequest } from '@equiwage/shared';
import { reportService } from '../services/index.js';

export class ReportsController {
  /**
   * POST /api/reports/executive
   * Generates structured executive report data or a downloadable .XLSX binary (RF-007).
   */
  generateExecutiveReport = (req: Request, res: Response): void => {
    const body = (req.body || {}) as Partial<ReportExportRequest>;
    const format = body.format || 'json';

    if (format === 'xlsx') {
      const { buffer, fileName } = reportService.generateExecutiveExcelBuffer(body);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(buffer);
      return;
    }

    const reportData = reportService.generateExecutiveReportData(body);
    res.status(200).json({
      ok: true,
      data: reportData,
      timestamp: new Date().toISOString(),
    });
  };
}

export const reportsController = new ReportsController();
