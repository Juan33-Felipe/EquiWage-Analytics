import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Avatar } from '../components/atoms/Avatar';
import { Badge } from '../components/atoms/Badge';
import { FileDropzone } from '../components/molecules/FileDropzone';
import { EmployeeFormModal } from '../components/molecules/EmployeeFormModal';
import { IndividualAdjustmentDrawer } from '../components/molecules/IndividualAdjustmentDrawer';
import { parsePayrollFile } from '../utils/payrollParser';
import { formatCurrency, getInitials, useCompensation } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Upload,
  Database,
  ArrowRight,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  Sliders,
  ShieldAlert,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export function EmployeesImportPage() {
  const navigate = useNavigate();
  const {
    employees,
    uploadPayrollFile,
    importPayroll,
    payrollSource,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    legalCompliance,
    setManualAdjustment,
    removeManualAdjustment,
    loadDemoData,
  } = useCompensation();
  const { t, tDept, tSource, language } = useLanguage();
  const [status, setStatus] = useState('idle');
  const [uploadMeta, setUploadMeta] = useState(null);
  const [errorKey, setErrorKey] = useState('');
  const [customError, setCustomError] = useState('');
  const [missing, setMissing] = useState([]);
  const [query, setQuery] = useState('');

  // Modals & Drawers state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [adjustmentEmployee, setAdjustmentEmployee] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleFile = async (file) => {
    setStatus('loading');
    setErrorKey('');
    setCustomError('');
    setMissing([]);

    const backendResult = await uploadPayrollFile(file);
    if (backendResult.ok) {
      setStatus('success');
      setUploadMeta({ name: file.name, count: backendResult.rowCount.toLocaleString() });
      return;
    }

    if (backendResult.missing?.length || backendResult.errorKey) {
      setStatus('error');
      setUploadMeta(null);
      setErrorKey(backendResult.errorKey || 'employees.missingRequired');
      setCustomError(backendResult.error || '');
      setMissing(backendResult.missing || []);
      return;
    }

    const result = await parsePayrollFile(file);
    if (result.ok) {
      await importPayroll(result.employees, file.name);
      setStatus('success');
      setUploadMeta({ name: file.name, count: result.rowCount.toLocaleString() });
    } else {
      setStatus('error');
      setUploadMeta(null);
      setErrorKey(result.errorKey || 'employees.missingRequired');
      setCustomError(result.error || '');
      setMissing(result.missing || []);
    }
  };

  const handleSaveEmployee = async (formData, isEditing) => {
    if (isEditing) {
      return await updateEmployee(formData.id, formData);
    } else {
      return await addEmployee(formData);
    }
  };

  const handleDeleteEmployee = async (id) => {
    const res = await deleteEmployee(id);
    if (res.ok) {
      setDeleteConfirmId(null);
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
  const errorMessage = errorKey ? t(errorKey) : customError;

  return (
    <div className="space-y-6">
      {/* Top Header with Quick Actions & Flow Links */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-main tracking-tight">{t('employees.title')}</h2>
          <p className="text-sm text-content-muted mt-1">
            {t('employees.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="gap-2 text-xs font-semibold"
          >
            <Upload className="w-4 h-4 text-primary" />
            {language === 'es' ? 'Cargar Nómina (Excel / CSV)' : 'Upload Payroll (Excel / CSV)'}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingEmployee(null);
              setIsFormOpen(true);
            }}
            className="gap-2 text-xs"
          >
            <UserPlus className="w-4 h-4" />
            Registrar Empleado
          </Button>
          <Button
            variant="dark"
            onClick={() => navigate('/bands')}
            className="gap-2 text-xs"
          >
            Configurar Bandas
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Full-Width Employee Directory Card */}
      <Card className="p-0 overflow-hidden w-full">
        <div className="p-6 border-b border-border flex flex-wrap justify-between items-center gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-content-main tracking-tight mb-1">{t('employees.employeeDirectory')}</h3>
            <p className="text-xs text-content-muted truncate">
              {tSource(payrollSource)} • {t('employees.employeesCount', { count: employees.length.toLocaleString() })}
            </p>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('employees.quickSearch')}
              className="w-full sm:w-64 bg-surface border border-border rounded-full py-2 pl-9 pr-4 text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </div>
        </div>

        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-light sticky top-0 text-xs font-semibold text-content-muted uppercase tracking-wider z-10">
              <tr>
                <th className="px-5 py-4 font-medium whitespace-nowrap">{t('employees.tableEmployee')}</th>
                <th className="px-3 py-4 font-medium whitespace-nowrap">{t('employees.tableLevel')}</th>
                <th className="px-4 py-4 font-medium whitespace-nowrap">{t('employees.tableDepartment')}</th>
                <th className="px-4 py-4 font-medium text-right whitespace-nowrap">{t('employees.tableCurrentSalary')}</th>
                <th className="px-4 py-4 font-medium text-center whitespace-nowrap">{t('employees.tableStatus')}</th>
                <th className="px-5 py-4 font-medium text-right whitespace-nowrap">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border/50">
              {filtered.map((employee) => (
                <tr key={employee.id} className="hover:bg-surface-light transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar initials={getInitials(employee.name)} className="w-9 h-9 text-xs shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-content-main truncate">{employee.name}</p>
                        <p className="text-xs text-content-muted mt-0.5 truncate">{employee.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-xs">
                      {employee.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-content-muted text-xs font-medium whitespace-nowrap">
                    {tDept(employee.department)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-content-main whitespace-nowrap">
                    {formatCurrency(employee.currentSalary)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {employee.isBelowMinimumWage ? (
                      <Badge variant="legal" className="whitespace-nowrap inline-flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        &lt; {language === 'es' ? 'Salario Mínimo' : 'Minimum Wage'}
                      </Badge>
                    ) : (
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
                    )}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setAdjustmentEmployee(employee)}
                        title="Simular ajuste individual"
                        className="p-1.5 rounded-lg border border-border text-content-muted hover:text-primary hover:border-primary/40 hover:bg-surface-light transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingEmployee(employee);
                          setIsFormOpen(true);
                        }}
                        title="Editar empleado"
                        className="p-1.5 rounded-lg border border-border text-content-muted hover:text-content-main hover:bg-surface-light transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === employee.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded bg-surface border border-border text-content-muted text-xs hover:text-content-main"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(employee.id)}
                          title="Eliminar empleado"
                          className="p-1.5 rounded-lg border border-border text-content-muted hover:text-red-600 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    {employees.length === 0 ? (
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center mb-3">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-content-main mb-1">
                          {language === 'es' ? 'No hay colaboradores registrados' : 'No employees registered'}
                        </h4>
                        <p className="text-xs text-content-muted leading-relaxed mb-5">
                          {language === 'es' ? 'Para comenzar la auditoría de compensaciones, sube un archivo .CSV o .XLSX con la nómina de tu organización o agrega colaboradores manualmente.' : 'To start the compensation audit, upload a .CSV or .XLSX file with your organization\'s payroll or add employees manually.'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button
                            variant="primary"
                            className="text-xs gap-2"
                            onClick={() => setIsImportModalOpen(true)}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{language === 'es' ? 'Importar Archivo .CSV / .XLSX' : 'Import .CSV / .XLSX File'}</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs gap-2"
                            onClick={() => {
                              setEditingEmployee(null);
                              setIsFormOpen(true);
                            }}
                          >
                            <UserPlus className="w-3.5 h-3.5 text-primary" />
                            <span>{t('employees.addEmployee')}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-xs gap-2 text-primary hover:bg-primary/10"
                            onClick={loadDemoData}
                          >
                            <Database className="w-3.5 h-3.5" />
                            <span>{t('onboarding.tryDemo')}</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-content-muted">{t('employees.noMatch', { query })}</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Guided Step Footer Banner */}
        <div className="p-4 sm:p-5 bg-surface-light border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-content-muted">
            <Database className="w-4 h-4 text-primary shrink-0" />
            <span>{t('employees.footerNotice')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-xs" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-3.5 h-3.5 mr-1.5 text-primary" />
              {t('employees.replacePayroll')}
            </Button>
            <Button variant="primary" className="gap-2 text-xs" onClick={() => navigate('/bands')}>
              <span>{t('employees.continueToBands')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Focus Modal: Payroll File Upload & Validation */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl border border-border max-w-xl w-full p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-content-main tracking-tight">{t('employees.modalTitle')}</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-content-muted hover:text-content-main hover:bg-surface-light transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-content-muted">
              {t('employees.requiredColumns')}
            </p>

            <FileDropzone
              onFile={handleFile}
              status={status}
              successMessage={successMessage}
              errorMessage={errorMessage}
              missingColumns={missing}
            />

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-content-muted flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary" />
                Almacenamiento Local Seguro • 100% Privado
              </span>
              <Button
                variant="primary"
                onClick={() => setIsImportModalOpen(false)}
                className="text-xs"
              >
                {t('common.done')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Form Modal (Create / Edit) */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(null);
        }}
        initialEmployee={editingEmployee}
        onSave={handleSaveEmployee}
      />

      {/* Individual Manual Adjustment Drawer */}
      <IndividualAdjustmentDrawer
        isOpen={Boolean(adjustmentEmployee)}
        onClose={() => setAdjustmentEmployee(null)}
        employee={adjustmentEmployee}
        legalCompliance={legalCompliance}
        onSaveAdjustment={setManualAdjustment}
        onRemoveAdjustment={removeManualAdjustment}
      />
    </div>
  );
}
