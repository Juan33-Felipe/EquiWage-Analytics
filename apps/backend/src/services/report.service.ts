import * as XLSX from 'xlsx';
import {
  BAND_STATUS,
  REPORT_SECTIONS,
  formatCurrency,
  type EnrichedEmployee,
  type ReportExportRequest,
  type SalaryBand,
} from '@equiwage/shared';
import { auditService } from './audit.service.js';

export interface StructuredExecutiveReport {
  generatedAt: string;
  language: 'en' | 'es';
  filters: {
    department: string;
    level: string;
    sections: string[];
  };
  summaryMetrics: {
    employeesIncluded: number;
    adjustmentBudget: number;
    belowMarketCount: number;
    alignedCount: number;
    aboveMarketCount: number;
    alignmentRatePercent: number;
    averageSalaryGapPercent: number;
    internalInequityCount: number;
  };
  employees: EnrichedEmployee[];
  bands: Array<SalaryBand & { spread: number }>;
}

export class ReportService {
  /**
   * Generates structured data for Executive PDF/HTML and JSON reports (RF-007).
   */
  generateExecutiveReportData(request: Partial<ReportExportRequest> = {}): StructuredExecutiveReport {
    const audit = auditService.getFullAuditSummary();
    const department = request.department || 'all';
    const level = request.level !== undefined ? String(request.level) : 'all';
    const language: 'en' | 'es' = request.language === 'es' ? 'es' : 'en';
    const sections =
      Array.isArray(request.sections) && request.sections.length > 0
        ? request.sections
        : [...REPORT_SECTIONS];

    const filteredEmployees = audit.employees.filter(
      (emp) =>
        (department === 'all' || emp.department === department) &&
        (level === 'all' || String(emp.level) === level)
    );

    const belowMarketCount = filteredEmployees.filter(
      (emp) => emp.status === BAND_STATUS.BELOW
    ).length;
    const alignedCount = filteredEmployees.filter(
      (emp) => emp.status === BAND_STATUS.ALIGNED
    ).length;
    const aboveMarketCount = filteredEmployees.filter(
      (emp) => emp.status === BAND_STATUS.ABOVE
    ).length;

    const avgGap =
      filteredEmployees.length > 0
        ? filteredEmployees.reduce((sum, emp) => sum + emp.gap, 0) / filteredEmployees.length
        : 0;

    return {
      generatedAt: new Date().toISOString(),
      language,
      filters: {
        department,
        level,
        sections,
      },
      summaryMetrics: {
        employeesIncluded: filteredEmployees.length,
        adjustmentBudget: audit.simulationResult.totalBudget,
        belowMarketCount,
        alignedCount,
        aboveMarketCount,
        alignmentRatePercent:
          filteredEmployees.length > 0
            ? Math.round((alignedCount / filteredEmployees.length) * 100)
            : 0,
        averageSalaryGapPercent: Number((avgGap * 100).toFixed(1)),
        internalInequityCount: audit.metrics.inequityCount,
      },
      employees: filteredEmployees,
      bands: audit.bands.map((band) => ({
        ...band,
        spread: band.max - band.min,
      })),
    };
  }

  /**
   * Builds a multi-sheet .XLSX binary buffer for the Executive Compensation Audit report (RF-007).
   */
  generateExecutiveExcelBuffer(request: Partial<ReportExportRequest> = {}): {
    buffer: Buffer;
    fileName: string;
  } {
    const report = this.generateExecutiveReportData(request);
    const isEs = report.language === 'es';
    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      [isEs ? 'Auditoría de Equidad Salarial EquiWage' : 'EquiWage Compensation Equity Audit'],
      [isEs ? 'Generado' : 'Generated', new Date(report.generatedAt).toLocaleString(isEs ? 'es-ES' : 'en-US')],
      [isEs ? 'Empleados Incluidos' : 'Employees Included', report.summaryMetrics.employeesIncluded],
      [isEs ? 'Presupuesto de Ajuste' : 'Adjustment Budget', report.summaryMetrics.adjustmentBudget],
      [isEs ? 'Bajo el Mínimo de Banda (P25)' : 'Below Band Minimum (P25)', report.summaryMetrics.belowMarketCount],
      [isEs ? 'Brecha Salarial Promedio' : 'Average Salary Gap', `${report.summaryMetrics.averageSalaryGapPercent}%`],
      [isEs ? 'Inequidades Internas' : 'Internal Inequities', report.summaryMetrics.internalInequityCount],
      [isEs ? 'Departamento' : 'Department', report.filters.department],
      [isEs ? 'Nivel de Cargo' : 'Job Level', report.filters.level],
      [],
      [isEs ? 'Secciones Incluidas' : 'Included Sections', report.filters.sections.join(', ')],
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(summaryRows),
      isEs ? 'Resumen Ejecutivo' : 'Executive Summary'
    );

    if (
      report.filters.sections.includes('Identified Outlier List') ||
      report.filters.sections.includes('Statistical Disparity Analysis')
    ) {
      const empRows = report.employees.map((emp) => ({
        ID: emp.id,
        [isEs ? 'Nombre' : 'Employee Name']: emp.name,
        [isEs ? 'Departamento' : 'Department']: emp.department,
        [isEs ? 'Cargo' : 'Role']: emp.role,
        [isEs ? 'Nivel' : 'Level']: emp.level,
        [isEs ? 'Salario Actual' : 'Current Salary']: emp.currentSalary,
        [isEs ? 'Mínimo Banda (P25)' : 'Band Min (P25)']: emp.band?.min ?? '',
        [isEs ? 'Mediana Banda (P50)' : 'Band Median (P50)']: emp.band?.median ?? '',
        [isEs ? 'Máximo Banda (P75)' : 'Band Max (P75)']: emp.band?.max ?? '',
        [isEs ? 'Brecha vs Mediana' : 'Gap to Median']: `${(emp.gap * 100).toFixed(1)}%`,
        [isEs ? 'Estado' : 'Status']:
          emp.status === 'below'
            ? isEs
              ? 'Bajo Banda'
              : 'Below Band'
            : emp.status === 'above'
              ? isEs
                ? 'Sobre Banda'
                : 'Above Band'
              : isEs
                ? 'Alineado'
                : 'Aligned',
      }));

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(empRows),
        isEs ? 'Auditoria Empleados' : 'Employee Audit'
      );
    }

    if (report.filters.sections.includes('Band Compression Metrics')) {
      const bandRows = report.bands.map((band) => ({
        [isEs ? 'Nivel de Cargo' : 'Job Level']: `L${band.level}`,
        [isEs ? 'Salario Mínimo (P25)' : 'Min Salary (P25)']: band.min,
        [isEs ? 'Mediana de Mercado (P50)' : 'Market Median (P50)']: band.median,
        [isEs ? 'Salario Máximo (P75)' : 'Max Salary (P75)']: band.max,
        [isEs ? 'Amplitud de Banda' : 'Band Spread']: band.spread,
        [isEs ? 'Formato Mín-Máx' : 'Formatted Range']: `${formatCurrency(band.min)} - ${formatCurrency(band.max)}`,
      }));

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(bandRows),
        isEs ? 'Bandas Salariales' : 'Salary Bands'
      );
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const fileName = `equiwage-compensation-audit-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return { buffer, fileName };
  }
}

export const reportService = new ReportService();
