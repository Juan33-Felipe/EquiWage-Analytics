import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Avatar } from '../components/atoms/Avatar';
import { Badge } from '../components/atoms/Badge';
import { FileDropzone } from '../components/molecules/FileDropzone';
import { parsePayrollFile } from '../utils/payrollParser';
import { formatCurrency, getInitials, useCompensation } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import { Upload, Database, ArrowRight, Search } from 'lucide-react';

export function EmployeesImportPage() {
  const navigate = useNavigate();
  const { employees, importPayroll, payrollSource } = useCompensation();
  const { t, tDept, tSource } = useLanguage();
  const [status, setStatus] = useState('idle');
  const [uploadMeta, setUploadMeta] = useState(null);
  const [errorKey, setErrorKey] = useState('');
  const [missing, setMissing] = useState([]);
  const [query, setQuery] = useState('');

  const handleFile = async (file) => {
    setStatus('loading');
    setErrorKey('');
    setMissing([]);
    const result = await parsePayrollFile(file);
    if (result.ok) {
      importPayroll(result.employees, file.name);
      setStatus('success');
      setUploadMeta({ name: file.name, count: result.rowCount.toLocaleString() });
    } else {
      setStatus('error');
      setUploadMeta(null);
      setErrorKey(result.errorKey || 'employees.missingRequired');
      setMissing(result.missing || []);
    }
  };

  const filtered = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(query.toLowerCase()) ||
      employee.role.toLowerCase().includes(query.toLowerCase()) ||
      employee.department.toLowerCase().includes(query.toLowerCase()) ||
      tDept(employee.department).toLowerCase().includes(query.toLowerCase())
  );

  const successMessage = uploadMeta
    ? t('employees.rowsDetected', { name: uploadMeta.name, count: uploadMeta.count })
    : '';
  const errorMessage = errorKey ? t(errorKey) : '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-main tracking-tight">{t('employees.title')}</h2>
        <p className="text-sm text-content-muted mt-1">
          {t('employees.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-primary shrink-0" />
              <h3 className="text-base font-bold text-content-main tracking-tight">{t('employees.payrollDataset')}</h3>
            </div>
            <p className="text-xs text-content-muted mb-5">
              {t('employees.requiredColumns')}
            </p>
            <FileDropzone
              onFile={handleFile}
              status={status}
              successMessage={successMessage}
              errorMessage={errorMessage}
              missingColumns={missing}
            />
          </Card>

          <Card className="p-6 bg-orange-50/40 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-primary shrink-0" />
              <h3 className="text-sm font-bold text-content-main">{t('employees.secureLocalSession')}</h3>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              {t('employees.payrollProcessed')}
            </p>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">{t('employees.employeeDirectory')}</h3>
                <p className="text-xs text-content-muted truncate">
                  {tSource(payrollSource)} • {t('employees.employeesCount', { count: employees.length.toLocaleString() })}
                </p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('employees.quickSearch')}
                  className="w-full sm:w-56 bg-surface border border-gray-200 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 shadow-sm"
                />
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 sticky top-0 text-xs font-semibold text-content-muted uppercase tracking-wider z-10">
                  <tr>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">{t('employees.tableEmployee')}</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">{t('employees.tableLevel')}</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">{t('employees.tableDepartment')}</th>
                    <th className="px-6 py-4 font-medium text-right whitespace-nowrap">{t('employees.tableCurrentSalary')}</th>
                    <th className="px-6 py-4 font-medium text-right whitespace-nowrap">{t('employees.tableStatus')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {filtered.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar initials={getInitials(employee.name)} className="w-9 h-9 text-xs shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-content-main truncate">{employee.name}</p>
                            <p className="text-xs text-content-muted mt-0.5 truncate">{employee.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-50 text-primary font-bold text-xs">
                          {employee.level}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-content-muted text-xs font-medium whitespace-nowrap">
                        {tDept(employee.department)}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-content-main whitespace-nowrap">
                        {formatCurrency(employee.currentSalary)}
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <Badge
                          variant={
                            employee.status === 'below'
                              ? 'dangerOutline'
                              : employee.status === 'above'
                                ? 'warning'
                                : 'successOutline'
                          }
                          className="whitespace-nowrap"
                        >
                          {employee.status === 'below'
                            ? t('employees.belowBand')
                            : employee.status === 'above'
                              ? t('employees.aboveBand')
                              : t('employees.aligned')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-content-muted">
                        {t('employees.noMatch', { query })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <Button variant="primary" className="gap-2" onClick={() => navigate('/dashboard/overview')}>
                {t('employees.validateAndRun')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
