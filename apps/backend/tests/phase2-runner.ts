import http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as XLSX from 'xlsx';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/database/sqlite.connection.js';
import { runSchemaMigrations } from '../src/database/schema.migrations.js';
import { resetDatabaseToSeed } from '../src/database/seed.runner.js';
import { DEFAULT_LOCAL_ADMIN_USER } from '@equiwage/shared';

// ANSI terminal colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
  details?: string;
}

const testResults: TestResult[] = [];

async function runTest(
  suite: string,
  name: string,
  fn: () => Promise<void> | void
): Promise<void> {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round(performance.now() - start);
    testResults.push({ suite, name, status: 'PASS', durationMs });
    console.log(`  ${GREEN}✓ PASS${RESET} [${durationMs}ms] ${name}`);
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : String(err);
    testResults.push({ suite, name, status: 'FAIL', durationMs, error: msg });
    console.error(`  ${RED}✗ FAIL${RESET} [${durationMs}ms] ${name}\n    ${RED}Error: ${msg}${RESET}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}: ${message}`);
  }
}

async function request(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    token?: string;
    headers?: Record<string, string>;
    body?: any;
    formData?: FormData;
  } = {}
) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const reqOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.formData) {
    reqOptions.body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    reqOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, reqOptions);
  let json: any = null;
  const rawText = await res.text();
  try {
    json = JSON.parse(rawText);
  } catch {
    json = null;
  }

  return {
    status: res.status,
    headers: res.headers,
    body: json,
    rawText,
  };
}

async function main() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   EQUIWAGE ANALYTICS — BACKEND API QA SUITE (PHASE 2)         ${RESET}`);
  console.log(`${BOLD}${CYAN}   Employee Payroll CRUD, Salary Bands, Imports & Compliance   ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  // 1. Initialize SQLite Database & Baseline Seed
  const db = getDatabase();
  runSchemaMigrations(db);
  resetDatabaseToSeed();

  // 2. Spin up test server on ephemeral port (port: 0)
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  try {
    // Obtain valid admin authentication token
    const loginRes = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: {
        identifier: DEFAULT_LOCAL_ADMIN_USER.email,
        password: DEFAULT_LOCAL_ADMIN_USER.defaultPassword,
      },
    });
    const authToken = loginRes.body?.data?.token;
    assert(Boolean(authToken), 'Failed to acquire auth token for Phase 2 tests');

    // -------------------------------------------------------------
    // SUITE 1: Employee Payroll CRUD (RF-001)
    // -------------------------------------------------------------
    console.log(`${BOLD}--- [SUITE 1] Employee Payroll CRUD (RF-001) ---${RESET}`);

    await runTest('Employees CRUD', 'GET /api/employees returns full active payroll with enriched calculations', async () => {
      const res = await request(baseUrl, '/api/employees', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assert(res.body.ok === true, 'ok must be true');
      assert(Array.isArray(res.body.data.employees), 'employees must be an array');
      assert(res.body.data.employees.length >= 24, 'must have at least 24 employees');
      
      const first = res.body.data.employees[0];
      assert(Boolean(first.id), 'employee must have id');
      assert(Boolean(first.name), 'employee must have name');
      assert(Boolean(first.role), 'employee must have role');
      assert(Boolean(first.department), 'employee must have department');
      assert(typeof first.level === 'number', 'employee must have level number');
      assert(first.currentSalary > 0, 'employee must have positive base salary');
      assert(Boolean(first.status), 'employee must have enriched market status');
    });

    await runTest('Employees CRUD', 'GET /api/employees filters accurately by department and level', async () => {
      const engRes = await request(baseUrl, '/api/employees?department=Engineering', { token: authToken });
      assertEqual(engRes.status, 200, 'HTTP status 200');
      assert(engRes.body.data.employees.length > 0, 'must have Engineering employees');
      for (const emp of engRes.body.data.employees) {
        assertEqual(emp.department, 'Engineering', 'all returned employees must be Engineering');
      }

      const l3Res = await request(baseUrl, '/api/employees?level=3', { token: authToken });
      assertEqual(l3Res.status, 200, 'HTTP status 200');
      for (const emp of l3Res.body.data.employees) {
        assertEqual(emp.level, 3, 'all returned employees must be level 3');
      }
    });

    const testEmpId = 'EMP-QA-777';

    await runTest('Employees CRUD', 'POST /api/employees creates employee with valid ID, Full Name, Role, Department, Level, Salary', async () => {
      const res = await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: {
          id: testEmpId,
          name: 'Sarah Connor',
          role: 'Cybersecurity Architect',
          department: 'Engineering',
          level: 6,
          currentSalary: 135000,
        },
      });

      assertEqual(res.status, 201, 'HTTP status must be 201 Created');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.employee.id, testEmpId, 'id matches');
      assertEqual(res.body.data.employee.name, 'Sarah Connor', 'name matches');
      assertEqual(res.body.data.employee.currentSalary, 135000, 'salary matches');
      assert(Boolean(res.body.data.audit), 'recalculated audit summary returned in payload');

      // Assert direct SQLite state
      const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(testEmpId) as any;
      assert(Boolean(row), 'Employee row must exist in SQLite database');
      assertEqual(row.name, 'Sarah Connor', 'SQLite name matches');
      assertEqual(row.level, 6, 'SQLite level matches');
      assertEqual(row.current_salary, 135000, 'SQLite salary matches');
    });

    await runTest('Employees CRUD', 'POST /api/employees accepts alternative field aliases (fullName, jobTitle, fixedBaseSalary)', async () => {
      const aliasId = 'EMP-QA-778';
      const res = await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: {
          id: aliasId,
          fullName: 'John Connor',
          jobTitle: 'DevSecOps Specialist',
          department: 'Operations',
          jobLevel: 4,
          fixedBaseSalary: 88000,
        },
      });

      assertEqual(res.status, 201, 'HTTP status must be 201 Created');
      assertEqual(res.body.data.employee.name, 'John Connor', 'name matches');
      assertEqual(res.body.data.employee.role, 'DevSecOps Specialist', 'role matches');
      assertEqual(res.body.data.employee.level, 4, 'level matches');
      assertEqual(res.body.data.employee.currentSalary, 88000, 'salary matches');

      db.prepare('DELETE FROM employees WHERE id = ?').run(aliasId);
    });

    await runTest('Employees CRUD', 'POST /api/employees rejects invalid inputs (missing fields, level out of range, duplicate ID)', async () => {
      // 1. Missing fields
      const res1 = await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: { name: '', role: '', level: 3, currentSalary: 50000 },
      });
      assertEqual(res1.status, 400, 'Fails with 400 when name/role are empty');
      assertEqual(res1.body.errorKey, 'employees.invalidFields', 'errorKey is invalidFields');

      // 2. Level out of range (< 1 or > 8)
      const res2 = await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: { name: 'Valid Name', role: 'Dev', department: 'HR', level: 9, currentSalary: 50000 },
      });
      assertEqual(res2.status, 400, 'Fails with 400 when level > 8');
      assertEqual(res2.body.errorKey, 'employees.invalidLevel', 'errorKey is invalidLevel');

      // 3. Duplicate ID conflict
      const res3 = await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: { id: testEmpId, name: 'Duplicate', role: 'Dev', department: 'HR', level: 3, currentSalary: 50000 },
      });
      assertEqual(res3.status, 409, 'Fails with 409 Conflict when ID already exists');
      assertEqual(res3.body.errorKey, 'employees.idConflict', 'errorKey is idConflict');
    });

    await runTest('Employees CRUD', 'PUT /api/employees/:id updates salary, role, level and recalculates KPIs', async () => {
      const res = await request(baseUrl, `/api/employees/${testEmpId}`, {
        method: 'PUT',
        token: authToken,
        body: {
          role: 'Principal Cybersecurity Architect',
          currentSalary: 148000,
          level: 7,
        },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.employee.role, 'Principal Cybersecurity Architect', 'role updated');
      assertEqual(res.body.data.employee.currentSalary, 148000, 'salary updated');
      assertEqual(res.body.data.employee.level, 7, 'level updated');

      // Verify SQLite state
      const row = db.prepare('SELECT current_salary, role, level FROM employees WHERE id = ?').get(testEmpId) as any;
      assertEqual(row.current_salary, 148000, 'SQLite salary updated');
      assertEqual(row.role, 'Principal Cybersecurity Architect', 'SQLite role updated');
      assertEqual(row.level, 7, 'SQLite level updated');
    });

    await runTest('Employees CRUD', 'PUT /api/employees/:id saves and clears individual 1-on-1 manual adjustment in SQLite', async () => {
      // 1. Save manual adjustment (percent: +10%)
      const resAdj = await request(baseUrl, `/api/employees/${testEmpId}`, {
        method: 'PUT',
        token: authToken,
        body: {
          manualAdjustment: {
            type: 'percent',
            value: 10,
            notes: 'Critical retention merit increase',
          },
        },
      });

      assertEqual(resAdj.status, 200, 'Update with manual adjustment returns 200');

      // Verify in SQLite employee_manual_adjustments table
      const adjRow = db.prepare('SELECT * FROM employee_manual_adjustments WHERE employee_id = ?').get(testEmpId) as any;
      assert(Boolean(adjRow), 'Manual adjustment row must exist in SQLite');
      assertEqual(adjRow.adjustment_type, 'percent', 'adjustment type matches');
      assertEqual(adjRow.adjustment_value, 10, 'adjustment value matches');
      // proposed_salary should be 148000 * 1.1 = 162800
      assertEqual(adjRow.proposed_salary, 162800, 'proposed_salary calculated correctly');

      // 2. Clear manual adjustment by sending null
      const resClear = await request(baseUrl, `/api/employees/${testEmpId}`, {
        method: 'PUT',
        token: authToken,
        body: { manualAdjustment: null },
      });
      assertEqual(resClear.status, 200, 'Clearing manual adjustment returns 200');

      const clearedRow = db.prepare('SELECT * FROM employee_manual_adjustments WHERE employee_id = ?').get(testEmpId);
      assert(!clearedRow, 'Manual adjustment must be deleted from SQLite');
    });

    await runTest('Employees CRUD', 'DELETE /api/employees/:id deletes employee and cleans up state', async () => {
      const res = await request(baseUrl, `/api/employees/${testEmpId}`, {
        method: 'DELETE',
        token: authToken,
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.deletedId, testEmpId, 'deletedId matches');

      // Direct SQLite verification
      const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(testEmpId);
      assert(!row, 'Employee must be removed from SQLite');

      // Verify 404 on subsequent get
      const getRes = await request(baseUrl, `/api/employees/${testEmpId}`, { token: authToken });
      assertEqual(getRes.status, 404, 'GET deleted employee returns 404');
    });

    // -------------------------------------------------------------
    // SUITE 2: File Import & Strict Validation (RF-001, RF-002, RNF-003)
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- [SUITE 2] File Import & Strict Validation ---${RESET}`);

    await runTest('File Import', 'POST /api/employees/import parses and imports valid .CSV payroll file', async () => {
      const csvContent = `id,name,role,department,level,current_salary\nIMP-101,Maya Lin,Staff Architect,Design,5,98000\nIMP-102,David Ross,Platform Engineer,Engineering,4,82000`;
      const formData = new FormData();
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'payroll_seed.csv');

      const res = await request(baseUrl, '/api/employees/import', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.importedCount, 2, 'importedCount is 2');
      assertEqual(res.body.data.sourceName, 'payroll_seed.csv', 'sourceName tracked');

      // Verify SQLite state
      const emp1 = db.prepare('SELECT * FROM employees WHERE id = ?').get('IMP-101') as any;
      assert(Boolean(emp1), 'Imported employee 1 exists in SQLite');
      assertEqual(emp1.name, 'Maya Lin', 'Name matches');
      assertEqual(emp1.current_salary, 98000, 'Salary matches');
    });

    await runTest('File Import', 'POST /api/employees/import parses and imports valid binary .XLSX payroll file', async () => {
      // Build binary XLSX in memory
      const payrollData = [
        { id: 'XLS-201', name: 'Lucas Scott', role: 'Lead Data Analyst', department: 'Analytics', level: 5, current_salary: 92000 },
        { id: 'XLS-202', name: 'Rachel Green', role: 'HR Coordinator', department: 'HR', level: 2, current_salary: 51000 },
        { id: 'XLS-203', name: 'Tom Miller', role: 'Security Engineer', department: 'Engineering', level: 4, current_salary: 86000 },
      ];
      const worksheet = XLSX.utils.json_to_sheet(payrollData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
      const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const formData = new FormData();
      formData.append('file', new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'payroll_corp.xlsx');

      const res = await request(baseUrl, '/api/employees/import', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.importedCount, 3, 'importedCount is 3');

      // Verify SQLite state
      const empCount = db.prepare("SELECT COUNT(*) as count FROM employees WHERE id LIKE 'XLS-%'").get() as { count: number };
      assertEqual(empCount.count, 3, 'All 3 employees stored in SQLite');
    });

    await runTest('File Import', 'NEGATIVE VALIDATION: Rejects malformed payroll file missing mandatory current_salary with friendly error', async () => {
      // Missing current_salary column completely
      const malformedCsv = `id,name,role,department,level\nBAD-01,Incomplete User,Dev,Engineering,3`;
      const formData = new FormData();
      formData.append('file', new Blob([malformedCsv], { type: 'text/csv' }), 'missing_salary.csv');

      const res = await request(baseUrl, '/api/employees/import', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 400, 'HTTP status must be 400 Bad Request');
      assertEqual(res.body.ok, false, 'ok must be false');
      assertEqual(res.body.errorKey, 'employees.missingRequired', 'errorKey is employees.missingRequired');
      assert(Array.isArray(res.body.missingColumns), 'missingColumns must be an array');
      assert(res.body.missingColumns.some((col: string) => col.includes('Current Salary')), 'missingColumns explicitly lists Current Salary');
      assert(res.body.message.includes('missing mandatory columns'), 'user-friendly message returned');
      assert(!res.body.message.includes('TypeError'), 'zero technical engineering jargon');
    });

    await runTest('File Import', 'NEGATIVE VALIDATION: Rejects malformed payroll file missing mandatory level with friendly error', async () => {
      // Missing level column completely
      const malformedCsv = `id,name,role,department,current_salary\nBAD-02,No Level User,Dev,Engineering,75000`;
      const formData = new FormData();
      formData.append('file', new Blob([malformedCsv], { type: 'text/csv' }), 'missing_level.csv');

      const res = await request(baseUrl, '/api/employees/import', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 400, 'HTTP status must be 400 Bad Request');
      assertEqual(res.body.ok, false, 'ok must be false');
      assert(Array.isArray(res.body.missingColumns), 'missingColumns must be an array');
      assert(res.body.missingColumns.some((col: string) => col.includes('Job Level')), 'missingColumns explicitly lists Job Level');
    });

    await runTest('File Import', 'POST /api/bands/import parses and imports valid .CSV salary bands file (L1–L8)', async () => {
      const bandsCsv = `level,min_salary,median_salary,max_salary
1,32000,40000,48000
2,42000,52000,62000
3,55000,68000,80000
4,70000,85000,100000
5,90000,110000,130000
6,115000,140000,165000
7,145000,175000,205000
8,180000,220000,260000`;

      const formData = new FormData();
      formData.append('file', new Blob([bandsCsv], { type: 'text/csv' }), 'market_bands_2026.csv');

      const res = await request(baseUrl, '/api/bands/import', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.importedCount, 8, '8 bands imported');

      // Verify SQLite state
      const bandsCount = db.prepare('SELECT COUNT(*) as count FROM salary_bands').get() as { count: number };
      assertEqual(bandsCount.count, 8, '8 bands stored in SQLite');
      const l1 = db.prepare('SELECT * FROM salary_bands WHERE level = 1').get() as any;
      assertEqual(l1.min_salary, 32000, 'L1 min updated');
      assertEqual(l1.median_salary, 40000, 'L1 median updated');
      assertEqual(l1.max_salary, 48000, 'L1 max updated');
    });

    await runTest('File Import', 'POST /api/bands/import parses and imports valid binary .XLSX salary bands file', async () => {
      const bandsData = [
        { level: 1, min: 34000, median: 42000, max: 50000 },
        { level: 2, min: 44000, median: 54000, max: 64000 },
        { level: 3, min: 58000, median: 70000, max: 82000 },
        { level: 4, min: 72000, median: 88000, max: 104000 },
      ];
      const worksheet = XLSX.utils.json_to_sheet(bandsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'SalaryBands');
      const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const formData = new FormData();
      formData.append('file', new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'bands.xlsx');

      const res = await request(baseUrl, '/api/bands/import', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.importedCount, 4, '4 bands imported');
    });

    await runTest('File Import', 'NEGATIVE VALIDATION: Rejects malformed salary bands file missing P50 median column', async () => {
      // Missing median column completely
      const badBandsCsv = `level,min_salary,max_salary\n1,30000,50000`;
      const formData = new FormData();
      formData.append('file', new Blob([badBandsCsv], { type: 'text/csv' }), 'missing_median.csv');

      const res = await request(baseUrl, '/api/bands/import', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 400, 'HTTP status must be 400 Bad Request');
      assertEqual(res.body.ok, false, 'ok must be false');
      assert(Array.isArray(res.body.missingColumns), 'missingColumns must be an array');
      assert(res.body.missingColumns.some((col: string) => col.includes('Median') || col.includes('P50')), 'indicates missing median column');
    });

    // -------------------------------------------------------------
    // SUITE 3: Salary Bands & Legal Minimum Wage Compliance (RF-002)
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- [SUITE 3] Salary Bands & Legal Minimum Wage Compliance (RF-002) ---${RESET}`);

    // Restore full clean seed baseline for compliance testing
    resetDatabaseToSeed();

    await runTest('Salary Bands', 'GET /api/bands returns all configured salary bands (L1-L8) with P25, P50, P75 ranges', async () => {
      const res = await request(baseUrl, '/api/bands', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.count, 8, '8 bands returned');
      for (const b of res.body.data.bands) {
        assert(b.level >= 1 && b.level <= 8, 'level between 1 and 8');
        assert(b.min <= b.median && b.median <= b.max, `P25 <= P50 <= P75 monotonicity satisfied for L${b.level}`);
      }
    });

    await runTest('Salary Bands', 'PUT /api/bands updates full band matrix in bulk and recalculates audit state', async () => {
      const customBands = [
        { level: 1, min: 36000, median: 44000, max: 52000 },
        { level: 2, min: 46000, median: 56000, max: 66000 },
        { level: 3, min: 60000, median: 72000, max: 84000 },
        { level: 4, min: 76000, median: 92000, max: 108000 },
        { level: 5, min: 96000, median: 116000, max: 136000 },
        { level: 6, min: 122000, median: 148000, max: 174000 },
        { level: 7, min: 154000, median: 186000, max: 218000 },
        { level: 8, min: 190000, median: 232000, max: 274000 },
      ];

      const res = await request(baseUrl, '/api/bands', {
        method: 'PUT',
        token: authToken,
        body: { bands: customBands },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assert(Boolean(res.body.data.metrics), 'returns recalculated metrics summary');

      // Verify SQLite state
      const l1 = db.prepare('SELECT min_salary, median_salary, max_salary FROM salary_bands WHERE level = 1').get() as any;
      assertEqual(l1.min_salary, 36000, 'SQLite L1 min updated');
      assertEqual(l1.median_salary, 44000, 'SQLite L1 median updated');
      assertEqual(l1.max_salary, 52000, 'SQLite L1 max updated');
    });

    await runTest('Legal Compliance', 'GET /api/compliance/minimum-wage returns active statutory configuration', async () => {
      const res = await request(baseUrl, '/api/compliance/minimum-wage', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assert(typeof res.body.data.enabled === 'boolean', 'enabled must be boolean');
      assert(typeof res.body.data.minimumWage === 'number', 'minimumWage must be number');
      assert(Boolean(res.body.data.countryCode), 'countryCode must exist');
    });

    await runTest('Legal Compliance', 'PUT /api/compliance/minimum-wage toggles enabled switch cleanly in SQLite', async () => {
      // 1. Toggle disabled
      const resOff = await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: { enabled: false },
      });
      assertEqual(resOff.status, 200, 'Toggle disabled returns 200');
      let row = db.prepare('SELECT enabled FROM legal_compliance_settings WHERE id = 1').get() as any;
      assertEqual(row.enabled, 0, 'SQLite recorded enabled = 0');

      // 2. Toggle enabled
      const resOn = await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: { enabled: true },
      });
      assertEqual(resOn.status, 200, 'Toggle enabled returns 200');
      row = db.prepare('SELECT enabled FROM legal_compliance_settings WHERE id = 1').get() as any;
      assertEqual(row.enabled, 1, 'SQLite recorded enabled = 1');
    });

    await runTest('Legal Compliance', 'PUT /api/compliance/minimum-wage updates country preset and editable statutory value', async () => {
      // Update country to Germany (EUR, statutory min wage 28,500)
      const resCountry = await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: {
          countryCode: 'DE',
          countryName: 'Germany',
          minimumWage: 28500,
          currency: 'EUR',
        },
      });

      assertEqual(resCountry.status, 200, 'Country preset update returns 200');
      assertEqual(resCountry.body.data.compliance.countryCode, 'DE', 'countryCode updated');
      assertEqual(resCountry.body.data.compliance.currency, 'EUR', 'currency updated');
      assertEqual(resCountry.body.data.compliance.minimumWage, 28500, 'minimumWage updated');

      // Verify SQLite state
      const row = db.prepare('SELECT * FROM legal_compliance_settings WHERE id = 1').get() as any;
      assertEqual(row.country_code, 'DE', 'SQLite country_code is DE');
      assertEqual(row.currency, 'EUR', 'SQLite currency is EUR');
      assertEqual(row.minimum_wage, 28500, 'SQLite minimum_wage is 28500');

      // Customize minimum wage value to an editable custom threshold
      const resCustom = await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: { minimumWage: 33000 },
      });
      assertEqual(resCustom.status, 200, 'Custom minimum wage update returns 200');
      assertEqual(resCustom.body.data.compliance.minimumWage, 33000, 'minimumWage updated to 33000');

      const customRow = db.prepare('SELECT minimum_wage FROM legal_compliance_settings WHERE id = 1').get() as any;
      assertEqual(customRow.minimum_wage, 33000, 'SQLite minimum_wage is 33000');
    });

    await runTest('Legal Compliance', 'PUT /api/compliance/minimum-wage rejects negative minimum wage with 400', async () => {
      const res = await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: { minimumWage: -1000 },
      });

      assertEqual(res.status, 400, 'Fails with 400 on negative wage');
      assertEqual(res.body.errorKey, 'compliance.invalidWage', 'errorKey is compliance.invalidWage');
    });

    await runTest('Legal Compliance', 'GET /api/compliance/countries returns reference countries catalog preloaded in SQLite', async () => {
      const res = await request(baseUrl, '/api/compliance/countries', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assert(Array.isArray(res.body.data), 'countries must be an array');
      assert(res.body.data.length >= 10, 'must have at least 10 reference countries');

      const us = res.body.data.find((c: any) => c.code === 'US');
      assert(Boolean(us), 'US reference country must exist in catalog');
      assert(us.defaultMinimumWage > 0, 'US minimum wage must be positive');
    });

  } finally {
    // Teardown test server
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // -------------------------------------------------------------
  // PHASE 2 SUMMARY TABLE
  // -------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;

  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   PHASE 2 TEST EXECUTION SUMMARY                              ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`Total Tests Executed: ${BOLD}${total}${RESET}`);
  console.log(`Tests Passed:         ${GREEN}${BOLD}${passed}${RESET} / ${total}`);
  console.log(`Tests Failed:         ${failed > 0 ? RED : GREEN}${BOLD}${failed}${RESET} / ${total}`);

  if (failed > 0) {
    console.log(`\n${RED}Failed Tests Detail:${RESET}`);
    for (const f of testResults.filter((r) => r.status === 'FAIL')) {
      console.log(`  - [${f.suite}] ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}✓ ALL PHASE 2 TESTS PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
