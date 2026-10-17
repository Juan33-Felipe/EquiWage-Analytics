import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { DEPARTMENTS, REPORT_SECTIONS } from '@equiwage/shared';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { ReportPreviewCard } from '../components/organisms/ReportPreviewCard';
import { formatCurrency, useCompensation } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import { useAiDiagnostics } from '../hooks/useAiDiagnostics';
import { compensationApi } from '../services/compensation.api';
import { Download, FileSpreadsheet, FileText, Check, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function ReportsPage() {
  const { employees, bands, metrics, simulationResult } = useCompensation();
  const { t, tDept, language } = useLanguage();
  const { diagnostic: aiDiagnostic, loading: aiLoading, runDiagnostics } = useAiDiagnostics();
  const [department, setDepartment] = useState('all');
  const [level, setLevel] = useState('all');
  const [sections, setSections] = useState(REPORT_SECTIONS);
  const [format, setFormat] = useState('pdf');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    runDiagnostics({ language, department, level });
  }, [language, department, level, runDiagnostics]);

  const levels = [...new Set(bands.map((band) => band.level))].sort((a, b) => a - b);
  const reportEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          (department === 'all' || employee.department === department) &&
          (level === 'all' || String(employee.level) === level)
      ),
    [employees, department, level]
  );

  const toggleSection = (section) => {
    setSections((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section]
    );
  };

  const getStatusLabel = (status) => {
    if (status === 'below') return t('employees.belowBand');
    if (status === 'above') return t('employees.aboveBand');
    return t('employees.aligned');
  };

  const buildWorkbook = async () => {
    try {
      await compensationApi.downloadExecutiveExcel({
        department,
        level,
        sections,
        language,
      });
      return;
    } catch {
      // Fallback to local SheetJS workbook generation if backend is unreachable
    }

    const workbook = XLSX.utils.book_new();
    const translatedSections = sections.map((sec) => t(`report.section.${sec}`)).join(', ');
    const summary = [
      [t('excel.equiWageAudit')],
      [t('excel.generated'), new Date().toLocaleString(language === 'es' ? 'es-ES' : 'en-US')],
      [t('excel.employeesIncluded'), reportEmployees.length],
      [t('excel.adjustmentBudget'), simulationResult.totalBudget],
      [t('excel.belowMarket'), reportEmployees.filter((employee) => employee.status === 'below').length],
      [t('report.averageSalaryGap'), `${(metrics.averageGap * 100).toFixed(1)}%`],
      [t('excel.internalInequities'), metrics.inequityCount],
      [t('excel.includedDepartments'), department === 'all' ? t('excel.allDepartments') : tDept(department)],
      [t('excel.includedJobLevel'), level === 'all' ? t('excel.allLevels') : t('reports.levels', { level })],
      [],
      [t('excel.includedSections'), translatedSections],
    ];

    if (aiDiagnostic?.executiveSummary) {
      summary.push([], ['AI Executive Summary (Anonymized)', aiDiagnostic.executiveSummary]);
      summary.push(['Rollout Strategy', aiDiagnostic.rolloutStrategy]);
    }

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(summary),
      t('report.executiveSummary').slice(0, 31)
    );

    if (sections.includes('Identified Outlier List') || sections.includes('Statistical Disparity Analysis')) {
      const employeeRows = reportEmployees.map((employee) => ({
        [t('excel.col.id')]: employee.id,
        [t('excel.col.name')]: employee.name,
        [t('excel.col.department')]: tDept(employee.department),
        [t('excel.col.role')]: employee.role,
        [t('excel.col.level')]: employee.level,
        [t('excel.col.currentSalary')]: employee.currentSalary,
        [t('excel.col.bandMin')]: employee.band?.min ?? '',
        [t('excel.col.bandMedian')]: employee.band?.median ?? '',
        [t('excel.col.bandMax')]: employee.band?.max ?? '',
        [t('excel.col.gap')]: `${(employee.gap * 100).toFixed(1)}%`,
        [t('excel.col.status')]: getStatusLabel(employee.status),
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(employeeRows),
        t('excel.employeeAudit').slice(0, 31)
      );
    }

    if (sections.includes('Band Compression Metrics')) {
      const bandRows = bands.map((band) => ({
        [t('bands.jobLevel')]: band.level,
        [t('bands.minSalary')]: band.min,
        [t('bands.marketMedian')]: band.median,
        [t('bands.maxSalary')]: band.max,
        [t('excel.col.bandSpread')]: band.max - band.min,
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(bandRows),
        t('excel.salaryBands').slice(0, 31)
      );
    }

    XLSX.writeFile(workbook, `equiwage-compensation-audit-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!printWindow) {
      window.alert(t('error.allowPopups'));
      return;
    }

    const rows = reportEmployees
      .map(
        (employee) => `
      <tr>
        <td>${escapeHtml(employee.name)}</td><td>${escapeHtml(tDept(employee.department))}</td>
        <td>${escapeHtml(employee.role)}</td><td>L${employee.level}</td>
        <td>${escapeHtml(formatCurrency(employee.currentSalary))}</td>
        <td>${escapeHtml(employee.band ? formatCurrency(employee.band.min) : '—')}</td>
        <td>${escapeHtml(`${(employee.gap * 100).toFixed(1)}%`)}</td>
        <td>${escapeHtml(getStatusLabel(employee.status))}</td>
      </tr>`
      )
      .join('');

    const selectedSections = sections
      .map((section) => `<li>${escapeHtml(t(`report.section.${section}`))}</li>`)
      .join('');

    const aiSectionHtml = aiDiagnostic
      ? `<h2>${escapeHtml(language === 'es' ? 'Diagnóstico Ejecutivo IA (Anonimizado)' : 'AI Executive Diagnostic (Anonymized)')}</h2>
         <div class="metric" style="margin-bottom:12px">
           <p style="color:#111827;font-size:12px;line-height:1.5">${escapeHtml(aiDiagnostic.executiveSummary)}</p>
           <p style="font-size:11px;margin-top:8px;color:#EA580C"><strong>${escapeHtml(language === 'es' ? 'Estrategia de Despliegue:' : 'Rollout Strategy:')}</strong> ${escapeHtml(aiDiagnostic.rolloutStrategy)}</p>
           <p style="font-size:10px;margin-top:6px;color:#10B981">${escapeHtml(aiDiagnostic.privacyGuarantee)}</p>
         </div>`
      : '';

    printWindow.document.write(`<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeHtml(t('report.compensationEquityReport'))}</title>
      <style>
        *{box-sizing:border-box}body{font:14px Inter,Arial,sans-serif;color:#111827;margin:36px}
        header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #F97316;padding-bottom:18px;margin-bottom:24px}
        h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:26px 0 10px}p{color:#6B7280;margin:4px 0}
        .brand{color:#F97316;font-weight:700}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .metric{border:1px solid #e5e7eb;border-radius:12px;padding:14px}.metric strong{display:block;font-size:19px;margin-top:5px}
        table{width:100%;border-collapse:collapse;font-size:10px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #e5e7eb}
        th{background:#F9FAFB;color:#6B7280;font-size:9px;text-transform:uppercase}ul{padding-left:20px;color:#4b5563}
        @media print{body{margin:18mm}.no-print{display:none}}
      </style></head><body>
      <header><div><div class="brand">EquiWage Analytics</div><h1>${escapeHtml(t('report.compensationEquityReport'))}</h1><p>${escapeHtml(t('print.executiveAudit'))} • ${escapeHtml(new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US'))}</p></div><p>${escapeHtml(t('print.confidential'))}</p></header>
      ${sections.includes('Executive Cost Summary') ? `<h2>${escapeHtml(t('report.executiveCostSummary'))}</h2><div class="metrics">
        <div class="metric"><p>${escapeHtml(t('report.adjustmentBudget'))}</p><strong>${escapeHtml(formatCurrency(simulationResult.totalBudget))}</strong></div>
        <div class="metric"><p>${escapeHtml(t('print.employeesAnalyzed'))}</p><strong>${reportEmployees.length}</strong></div>
        <div class="metric"><p>${escapeHtml(t('print.belowMarketMin'))}</p><strong>${reportEmployees.filter((employee) => employee.status === 'below').length}</strong></div>
      </div>` : ''}
      ${aiSectionHtml}
      ${sections.includes('Statistical Disparity Analysis') ? `<h2>${escapeHtml(t('report.statisticalDisparity'))}</h2><div class="metrics">
        <div class="metric"><p>${escapeHtml(t('report.averageSalaryGap'))}</p><strong>${(metrics.averageGap * 100).toFixed(1)}%</strong></div>
        <div class="metric"><p>${escapeHtml(t('excel.internalInequities'))}</p><strong>${metrics.inequityCount}</strong></div>
        <div class="metric"><p>${escapeHtml(t('report.alignmentRate'))}</p><strong>${Math.round(metrics.alignedRate * 100)}%</strong></div>
      </div>` : ''}
      ${selectedSections ? `<h2>${escapeHtml(t('print.includedSections'))}</h2><ul>${selectedSections}</ul>` : ''}
      ${sections.includes('Identified Outlier List') ? `<h2>${escapeHtml(t('print.employeeAuditOutliers'))}</h2><table><thead><tr><th>${escapeHtml(t('employees.tableEmployee'))}</th><th>${escapeHtml(t('employees.tableDepartment'))}</th><th>${escapeHtml(t('excel.col.role'))}</th><th>${escapeHtml(t('employees.tableLevel'))}</th><th>${escapeHtml(t('print.salary'))}</th><th>${escapeHtml(t('print.bandP25'))}</th><th>${escapeHtml(t('print.gapToMedian'))}</th><th>${escapeHtml(t('employees.tableStatus'))}</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
      ${sections.includes('Band Compression Metrics') ? `<h2>${escapeHtml(t('excel.salaryBands'))}</h2><table><thead><tr><th>${escapeHtml(t('employees.tableLevel'))}</th><th>${escapeHtml(t('bands.minSalary'))}</th><th>${escapeHtml(t('bands.marketMedian'))}</th><th>${escapeHtml(t('bands.maxSalary'))}</th><th>${escapeHtml(t('print.spread'))}</th></tr></thead><tbody>${bands.map((band) => `<tr><td>L${band.level}</td><td>${escapeHtml(formatCurrency(band.min))}</td><td>${escapeHtml(formatCurrency(band.median))}</td><td>${escapeHtml(formatCurrency(band.max))}</td><td>${escapeHtml(formatCurrency(band.max - band.min))}</td></tr>`).join('')}</tbody></table>` : ''}
      <div style="display:flex;gap:70px;margin-top:70px"><div style="width:40%;border-top:1px solid #9ca3af;padding-top:8px">${escapeHtml(t('report.hrApproval'))}</div><div style="width:40%;border-top:1px solid #9ca3af;padding-top:8px">${escapeHtml(t('report.financeApproval'))}</div></div>
      <script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  const generateReport = async () => {
    setDownloaded(false);
    if (format === 'xlsx') await buildWorkbook();
    else printReport();
    setDownloaded(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">{t('reports.executiveReports')}</h2>
          <p className="text-sm text-content-muted mt-1">
            {t('reports.buildAudit')}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 text-xs"
          onClick={() => runDiagnostics({ language, department, level })}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          )}
          <span>
            {language === 'es' ? 'Actualizar Diagnóstico IA' : 'Refresh AI Diagnostic'}
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <Card className="xl:col-span-2 p-6">
          <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">{t('reports.exportConfiguration')}</h3>
          <p className="text-xs text-content-muted mb-6">{t('reports.chooseScope')}</p>

          <label className="block text-xs font-semibold text-content-main mb-2">{t('reports.department')}</label>
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t('reports.allDepartments')}</option>
            {DEPARTMENTS.map((item) => (
              <option key={item} value={item}>
                {tDept(item)}
              </option>
            ))}
          </select>

          <label className="block text-xs font-semibold text-content-main mb-2">{t('reports.jobLevel')}</label>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t('reports.allJobLevels')}</option>
            {levels.map((item) => (
              <option key={item} value={item}>
                {t('reports.levels', { level: item })}
              </option>
            ))}
          </select>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-content-main mb-3">{t('reports.sectionsInclude')}</p>
            <div className="space-y-3">
              {REPORT_SECTIONS.map((section) => (
                <label key={section} className="flex items-center gap-3 cursor-pointer group min-w-0">
                  <input
                    type="checkbox"
                    checked={sections.includes(section)}
                    onChange={() => toggleSection(section)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors',
                      sections.includes(section)
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-300 bg-white group-hover:border-primary'
                    )}
                  >
                    {sections.includes(section) && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-sm text-content-main leading-snug">{t(`report.section.${section}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-5">
            <p className="text-xs font-semibold text-content-main mb-3">{t('reports.exportFormat')}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'pdf', label: t('reports.pdfSummary'), icon: FileText },
                { id: 'xlsx', label: t('reports.excelAudit'), icon: FileSpreadsheet },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setFormat(id)}
                  className={cn(
                    'flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all min-w-0',
                    format === id ? 'border-primary bg-orange-50/50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', format === id ? 'text-primary' : 'text-content-muted')} />
                  <span className="text-xs font-semibold text-content-main leading-tight">{label}</span>
                </button>
              ))}
            </div>
            {format === 'pdf' && (
              <p className="text-[11px] text-content-muted mt-2">
                {t('reports.opensPrint')}
              </p>
            )}
          </div>

          <Button variant="primary" className="w-full gap-2 mt-6" onClick={generateReport}>
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">{t('reports.generateDownload')}</span>
          </Button>
          {downloaded && (
            <p className="text-xs text-success font-medium mt-3 text-center">
              {format === 'xlsx' ? t('reports.excelGenerated') : t('reports.pdfReady')}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-content-muted">
            <Badge variant="successOutline">{t('reports.employeesCount', { count: reportEmployees.length })}</Badge>
            <span>{t('reports.inThisReport')}</span>
          </div>
        </Card>

        <div className="xl:col-span-3">
          <ReportPreviewCard
            sections={sections}
            aiDiagnostic={aiDiagnostic}
            aiLoading={aiLoading}
          />
        </div>
      </div>
    </div>
  );
}
