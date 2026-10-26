import { API_ENDPOINTS } from '@equiwage/shared';
import { apiRequest } from './http.client';

/**
 * REST API client for compensation audits, payroll/band imports,
 * budget simulations, executive reports, and local project sessions.
 */
export const compensationApi = {
  /** GET /api/health */
  getHealth() {
    return apiRequest(API_ENDPOINTS.HEALTH, { method: 'GET' });
  },

  /** GET /api/audit */
  getFullAudit() {
    return apiRequest(API_ENDPOINTS.AUDIT_OVERVIEW, { method: 'GET' });
  },

  /** PATCH /api/bands/:level */
  updateBand(level, patch) {
    return apiRequest(`${API_ENDPOINTS.BANDS}/${encodeURIComponent(level)}`, {
      method: 'PATCH',
      body: patch,
    });
  },

  /** POST /api/bands */
  addBand(newBand) {
    return apiRequest(API_ENDPOINTS.BANDS, {
      method: 'POST',
      body: newBand || {},
    });
  },

  /** PUT /api/bands */
  replaceBands(bands, sourceName) {
    return apiRequest(API_ENDPOINTS.BANDS, {
      method: 'PUT',
      body: { bands, sourceName },
    });
  },

  /** PATCH /api/simulation */
  updateSimulation(patch) {
    return apiRequest(API_ENDPOINTS.SIMULATION, {
      method: 'PATCH',
      body: patch,
    });
  },

  /** POST /api/simulation/apply */
  applySimulationScenario(scenarioName) {
    return apiRequest(`${API_ENDPOINTS.SIMULATION}/apply`, {
      method: 'POST',
      body: { scenarioName },
    });
  },

  /** POST /api/import/payroll (multipart/form-data file upload) */
  uploadPayrollFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(API_ENDPOINTS.IMPORT_PAYROLL, {
      method: 'POST',
      body: formData,
    });
  },

  /** POST /api/import/payroll (JSON rows) */
  importPayrollRows(employees, fileName) {
    return apiRequest(API_ENDPOINTS.IMPORT_PAYROLL, {
      method: 'POST',
      body: { employees, fileName },
    });
  },

  /** POST /api/import/bands (multipart/form-data file upload) */
  uploadBandsFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(API_ENDPOINTS.IMPORT_BANDS, {
      method: 'POST',
      body: formData,
    });
  },

  /** GET /api/session/export */
  exportSession() {
    return apiRequest(API_ENDPOINTS.SESSION_EXPORT, { method: 'GET' });
  },

  /** POST /api/session/restore */
  restoreSession(sessionPayload) {
    return apiRequest(API_ENDPOINTS.SESSION_RESTORE, {
      method: 'POST',
      body: sessionPayload,
    });
  },

  /** POST /api/session/reset */
  resetSession() {
    return apiRequest(API_ENDPOINTS.SESSION_RESET, { method: 'POST' });
  },

  /** POST /api/reports/executive (binary .xlsx download) */
  async downloadExecutiveExcel(options = {}) {
    const blob = await apiRequest(API_ENDPOINTS.REPORTS_EXECUTIVE, {
      method: 'POST',
      body: { ...options, format: 'xlsx' },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equiwage-compensation-audit-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /** POST /api/employees */
  createEmployee(employeeData) {
    return apiRequest(API_ENDPOINTS.EMPLOYEES, {
      method: 'POST',
      body: employeeData,
    });
  },

  /** PUT /api/employees/:id */
  updateEmployee(id, employeeData) {
    return apiRequest(`${API_ENDPOINTS.EMPLOYEES}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: employeeData,
    });
  },

  /** DELETE /api/employees/:id */
  deleteEmployee(id) {
    return apiRequest(`${API_ENDPOINTS.EMPLOYEES}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /** GET /api/compliance/minimum-wage */
  getLegalCompliance() {
    return apiRequest(API_ENDPOINTS.COMPLIANCE_MINIMUM_WAGE, { method: 'GET' });
  },

  /** PUT /api/compliance/minimum-wage */
  updateLegalCompliance(patch) {
    return apiRequest(API_ENDPOINTS.COMPLIANCE_MINIMUM_WAGE, {
      method: 'PUT',
      body: patch,
    });
  },

  /** GET /api/compliance/countries */
  getReferenceCountries() {
    return apiRequest(API_ENDPOINTS.COMPLIANCE_COUNTRIES, { method: 'GET' });
  },

  /** PUT /api/compliance/countries/:code */
  updateReferenceCountry(code, patch) {
    return apiRequest(`${API_ENDPOINTS.COMPLIANCE_COUNTRIES}/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: patch,
    });
  },

  /** GET /api/simulation/manual-adjustments */
  getManualAdjustments() {
    return apiRequest(API_ENDPOINTS.MANUAL_ADJUSTMENTS, { method: 'GET' });
  },

  /** POST /api/simulation/manual-adjustments */
  upsertManualAdjustment(employeeId, type, value, notes) {
    return apiRequest(API_ENDPOINTS.MANUAL_ADJUSTMENTS, {
      method: 'POST',
      body: { employeeId, type, value, notes },
    });
  },

  /** POST /api/simulation/manual-adjustments helper */
  saveManualAdjustment(adjustmentData) {
    return apiRequest(API_ENDPOINTS.MANUAL_ADJUSTMENTS, {
      method: 'POST',
      body: adjustmentData,
    });
  },

  /** DELETE /api/simulation/manual-adjustments/:employeeId */
  deleteManualAdjustment(employeeId) {
    return apiRequest(`${API_ENDPOINTS.MANUAL_ADJUSTMENTS}/${encodeURIComponent(employeeId)}`, {
      method: 'DELETE',
    });
  },

  /** DELETE /api/simulation/manual-adjustments */
  clearAllManualAdjustments() {
    return apiRequest(API_ENDPOINTS.MANUAL_ADJUSTMENTS, { method: 'DELETE' });
  },

  /** POST /api/simulator/approve-plan */
  approvePayrollPlan(options = {}) {
    return apiRequest(API_ENDPOINTS.SIMULATOR_APPROVE_PLAN, {
      method: 'POST',
      body: options,
    });
  },
};
