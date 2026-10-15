import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { ReportPreviewCard } from '../components/organisms/ReportPreviewCard';
import { DEPARTMENTS } from '../data/mockCompensationData';
import { formatCurrency, useCompensation } from '../context/CompensationContext';
import { Download, FileSpreadsheet, FileText, Printer, Check } from 'lucide-react';
import { cn } from '../utils/cn';

const REPORT_SECTIONS = [
  'Executive Cost Summary',
  'Statistical Disparity Analysis',
  'Identified Outlier List',
  'Band Compression Metrics',
];

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
  const [department, setDepartment] = useState('all');
  const [level, setLevel] = useState('all');
  const [sections, setSections] = useState(REPORT_SECTIONS);
  const [format, setFormat] = useState('pdf');
  const [downloaded, setDownloaded] = useState(false);

  const levels = [...new Set(bands.map((band) => band.level))].sort((a, b) => a - b);
  const reportEmployees = useMemo(
    () => employees.filter((employee) =>
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

  const buildWorkbook = () => {
    const workbook = XLSX.utils.book_new();
    const summary = [
      ['EquiWage Analytics — Executive Compensation Audit'],
      ['Generated', new Date().toLocaleString()],
      ['Employees included', reportEmployees.length],
      ['Adjustment budget (selected scenario)', simulationResult.totalBudget],
      ['Employees below market minimum', reportEmployees.filter((employee) => employee.status === 'below').length],
      ['Average salary gap', `${(metrics.averageGap * 100).toFixed(1)}%`],
      ['Internal inequities (>10%)', metrics.inequityCount],
      ['Included departments', department === 'all' ? 'All departments' : department],
      ['Included job level', level === 'all' ? 'All levels' : `Level ${level}`],
      [],
      ['Included report sections', sections.join(', ')],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), 'Executive Summary');

    if (sections.includes('Identified Outlier List') || sections.includes('Statistical Disparity Analysis')) {
      const employeeRows = reportEmployees.map((employee) => ({
        ID: employee.id,
        Name: employee.name,
        Department: employee.department,
        Role: employee.role,
        Level: employee.level,
        'Current Salary': employee.currentSalary,
        'Band Minimum P25': employee.band?.min ?? '',
        'Band Median P50': employee.band?.median ?? '',
        'Band Maximum P75': employee.band?.max ?? '',
        'Gap to Median': `${(employee.gap * 100).toFixed(1)}%`,
        Status: employee.status,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(employeeRows), 'Employee Audit');
    }

    if (sections.includes('Band Compression Metrics')) {
      const bandRows = bands.map((band) => ({
        'Job Level': band.level,
        'Minimum P25': band.min,
        'Median P50': band.median,
        'Maximum P75': band.max,
        'Band Spread': band.max - band.min,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(bandRows), 'Salary Bands');
    }

    XLSX.writeFile(workbook, `equiwage-compensation-audit-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!printWindow) {
      window.alert('Please allow pop-ups to print the report, then choose “Save as PDF”.');
      return;
    }

    const rows = reportEmployees.map((employee) => `
      <tr>
        <td>${escapeHtml(employee.name)}</td><td>${escapeHtml(employee.department)}</td>
        <td>${escapeHtml(employee.role)}</td><td>L${employee.level}</td>
        <td>${escapeHtml(formatCurrency(employee.currentSalary))}</td>
        <td>${escapeHtml(employee.band ? formatCurrency(employee.band.min) : '—')}</td>
        <td>${escapeHtml(`${(employee.gap * 100).toFixed(1)}%`)}</td>
        <td>${escapeHtml(employee.status)}</td>
      </tr>`).join('');

    const selectedSections = sections.map((section) => `<li>${escapeHtml(section)}</li>`).join('');
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>EquiWage Compensation Audit</title>
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
      <header><div><div class="brand">EquiWage Analytics</div><h1>Compensation Equity Report</h1><p>Executive audit • ${escapeHtml(new Date().toLocaleDateString())}</p></div><p>Confidential • Local analysis</p></header>
      ${sections.includes('Executive Cost Summary') ? `<h2>Executive Cost Summary</h2><div class="metrics">
        <div class="metric"><p>Adjustment budget</p><strong>${escapeHtml(formatCurrency(simulationResult.totalBudget))}</strong></div>
        <div class="metric"><p>Employees analyzed</p><strong>${reportEmployees.length}</strong></div>
        <div class="metric"><p>Below market minimum</p><strong>${reportEmployees.filter((employee) => employee.status === 'below').length}</strong></div>
      </div>` : ''}
      ${sections.includes('Statistical Disparity Analysis') ? `<h2>Statistical Disparity Analysis</h2><div class="metrics">
        <div class="metric"><p>Average salary gap</p><strong>${(metrics.averageGap * 100).toFixed(1)}%</strong></div>
        <div class="metric"><p>Internal inequities (&gt;10%)</p><strong>${metrics.inequityCount}</strong></div>
        <div class="metric"><p>Alignment rate</p><strong>${Math.round(metrics.alignedRate * 100)}%</strong></div>
      </div>` : ''}
      ${selectedSections ? `<h2>Included Sections</h2><ul>${selectedSections}</ul>` : ''}
      ${sections.includes('Identified Outlier List') ? `<h2>Employee Audit & Outliers</h2><table><thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Level</th><th>Salary</th><th>Band P25</th><th>Gap to median</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
      ${sections.includes('Band Compression Metrics') ? `<h2>Salary Bands</h2><table><thead><tr><th>Level</th><th>Minimum P25</th><th>Median P50</th><th>Maximum P75</th><th>Spread</th></tr></thead><tbody>${bands.map((band) => `<tr><td>L${band.level}</td><td>${escapeHtml(formatCurrency(band.min))}</td><td>${escapeHtml(formatCurrency(band.median))}</td><td>${escapeHtml(formatCurrency(band.max))}</td><td>${escapeHtml(formatCurrency(band.max - band.min))}</td></tr>`).join('')}</tbody></table>` : ''}
      <div style="display:flex;gap:70px;margin-top:70px"><div style="width:40%;border-top:1px solid #9ca3af;padding-top:8px">HR Approval</div><div style="width:40%;border-top:1px solid #9ca3af;padding-top:8px">Finance Approval</div></div>
      <script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  const generateReport = () => {
    setDownloaded(false);
    if (format === 'xlsx') buildWorkbook();
    else printReport();
    setDownloaded(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-main tracking-tight">Executive Reports</h2>
        <p className="text-sm text-content-muted mt-1">
          Build a clear compensation audit for HR and Finance — generated locally on this device.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <Card className="xl:col-span-2 p-6">
          <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">Export Configuration</h3>
          <p className="text-xs text-content-muted mb-6">Choose the scope and information to include</p>

          <label className="block text-xs font-semibold text-content-main mb-2">Department</label>
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <label className="block text-xs font-semibold text-content-main mb-2">Job Level</label>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Job Levels</option>
            {levels.map((item) => <option key={item} value={item}>Level {item}</option>)}
          </select>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-content-main mb-3">Sections to Include</p>
            <div className="space-y-3">
              {REPORT_SECTIONS.map((section) => (
                <label key={section} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sections.includes(section)}
                    onChange={() => toggleSection(section)}
                    className="sr-only"
                  />
                  <span className={cn(
                    'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                    sections.includes(section) ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white group-hover:border-primary'
                  )}>
                    {sections.includes(section) && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-sm text-content-main">{section}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-5">
            <p className="text-xs font-semibold text-content-main mb-3">Export Format</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'pdf', label: 'PDF Executive Summary', icon: FileText },
                { id: 'xlsx', label: 'Excel Detailed Audit', icon: FileSpreadsheet },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setFormat(id)}
                  className={cn(
                    'flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all',
                    format === id ? 'border-primary bg-orange-50/50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon className={cn('w-4 h-4', format === id ? 'text-primary' : 'text-content-muted')} />
                  <span className="text-xs font-semibold text-content-main">{label}</span>
                </button>
              ))}
            </div>
            {format === 'pdf' && (
              <p className="text-[11px] text-content-muted mt-2">
                Opens the print dialog; choose “Save as PDF” to download your report.
              </p>
            )}
          </div>

          <Button variant="primary" className="w-full gap-2 mt-6" onClick={generateReport}>
            <Download className="w-4 h-4" />
            Generate & Download Report
          </Button>
          {downloaded && (
            <p className="text-xs text-success font-medium mt-3 text-center">
              {format === 'xlsx' ? 'Your Excel report has been generated.' : 'Your report is ready to save as PDF.'}
            </p>
          )}
          <div className="mt-5 flex items-center gap-2 text-xs text-content-muted">
            <Badge variant="successOutline">{reportEmployees.length} employees</Badge>
            <span>in this report</span>
          </div>
        </Card>

        <div className="xl:col-span-3">
          <ReportPreviewCard sections={sections} />
        </div>
      </div>
    </div>
  );
}
