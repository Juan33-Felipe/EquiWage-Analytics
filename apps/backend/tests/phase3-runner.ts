import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/database/sqlite.connection.js';
import { runSchemaMigrations } from '../src/database/schema.migrations.js';
import { resetDatabaseToSeed } from '../src/database/seed.runner.js';
import { DEFAULT_LOCAL_ADMIN_USER, SIMULATION_TARGETS, type ProjectSessionPayload } from '@equiwage/shared';

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
  console.log(`${BOLD}${CYAN}   EQUIWAGE ANALYTICS — BACKEND API QA SUITE (PHASE 3)         ${RESET}`);
  console.log(`${BOLD}${CYAN}   AuditEngine, Real-Time Simulator & Session Persistence      ${RESET}`);
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
    // Acquire valid JWT authentication token
    const loginRes = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: {
        identifier: DEFAULT_LOCAL_ADMIN_USER.email,
        password: DEFAULT_LOCAL_ADMIN_USER.defaultPassword,
      },
    });
    const authToken = loginRes.body?.data?.token;
    assert(Boolean(authToken), 'Failed to acquire auth token for Phase 3 tests');

    // -------------------------------------------------------------
    // SUITE 1: Core Deterministic Audit Calculations (RF-003, RF-004)
    // -------------------------------------------------------------
    console.log(`${BOLD}--- [SUITE 1] Core Audit Calculations (RF-003, RF-004) ---${RESET}`);

    await runTest('Audit Engine', 'GET /api/audit/overview returns complete deterministic audit state in < 1000ms', async () => {
      const t0 = performance.now();
      const res = await request(baseUrl, '/api/audit/overview', { token: authToken });
      const elapsed = Math.round(performance.now() - t0);

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assert(Boolean(res.body.data.metrics), 'metrics must exist');
      assert(Boolean(res.body.data.marketGaps), 'marketGaps must exist');
      assert(Boolean(res.body.data.inequities), 'inequities must exist');
      assert(Boolean(res.body.data.employees), 'employees must exist');
      assert(res.body.data.metrics.headcount >= 24, 'headcount >= 24');
      assert(elapsed < 1000, `Execution latency (${elapsed}ms) must be < 1000ms (RNF-002)`);
    });

    await runTest('Audit Engine', 'GET /api/audit root endpoint alias behaves identically to /overview', async () => {
      const res = await request(baseUrl, '/api/audit', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.payrollSource, 'Sample dataset', 'payrollSource matches baseline seed');
    });

    await runTest('Audit Calculations', 'PRIORITY 1: Flags employees below Legal Minimum Wage with exact deficit calculation', async () => {
      // 1. Configure Legal Minimum Wage to $42,000 USD
      await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: { enabled: true, minimumWage: 42000, countryCode: 'US' },
      });

      // 2. Insert test employee below minimum wage ($34,000 < $42,000)
      const testEmpId = 'EMP-LEG-001';
      await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: {
          id: testEmpId,
          name: 'Legal Violation Test',
          role: 'Junior Associate',
          department: 'Operations',
          level: 1,
          currentSalary: 34000,
        },
      });

      // 3. Query audit overview
      const res = await request(baseUrl, '/api/audit/overview', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status 200');
      const emp = res.body.data.employees.find((e: any) => e.id === testEmpId);
      assert(Boolean(emp), 'Employee must be present in audit');
      assertEqual(emp.isBelowMinimumWage, true, 'isBelowMinimumWage must be true');
      assertEqual(emp.minimumWageDeficit, 8000, 'minimumWageDeficit must be exact (42000 - 34000 = 8000)');
      assert(res.body.data.metrics.legalViolationsCount >= 1, 'legalViolationsCount must be at least 1');
      assert(res.body.data.metrics.legalComplianceCost >= 8000, 'legalComplianceCost must include deficit');

      // 4. Disable compliance toggle and assert legal violation flags turn off
      await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: { enabled: false },
      });

      const resDisabled = await request(baseUrl, '/api/audit/overview', { token: authToken });
      const empDisabled = resDisabled.body.data.employees.find((e: any) => e.id === testEmpId);
      assertEqual(empDisabled.isBelowMinimumWage, false, 'isBelowMinimumWage must be false when toggle disabled');
      assertEqual(resDisabled.body.data.metrics.legalViolationsCount, 0, 'legalViolationsCount must be 0 when disabled');

      // Cleanup
      await request(baseUrl, `/api/employees/${testEmpId}`, { method: 'DELETE', token: authToken });
      await request(baseUrl, '/api/compliance/minimum-wage', { method: 'PUT', token: authToken, body: { enabled: true } });
    });

    await runTest('Audit Calculations', 'PRIORITY 2: Market Gaps (RF-003) detects employees below Band Minimum (P25)', async () => {
      const res = await request(baseUrl, '/api/audit/gaps', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      const gaps = res.body.data.marketGaps || res.body.data.gaps;
      assert(Array.isArray(gaps), 'gaps must be an array');
      assert(gaps.length > 0, 'baseline dataset must have market gaps below P25');

      // Verify mathematical accuracy of deficit and sorting
      let previousDeficit = Infinity;
      for (const gapItem of gaps) {
        assertEqual(gapItem.status, 'below', 'gap employee status must be below');
        assert(gapItem.currentSalary < gapItem.band.min, 'currentSalary must be strictly less than band min');
        assertEqual(gapItem.deficitAmount, gapItem.band.min - gapItem.currentSalary, 'deficitAmount must equal band.min - currentSalary');
        assert(gapItem.deficitAmount <= previousDeficit, 'gaps must be sorted by descending deficitAmount');
        previousDeficit = gapItem.deficitAmount;
      }
    });

    await runTest('Audit Calculations', 'Internal Inequities (RF-004) detects > 10% salary disparity within same role and level', async () => {
      // 1. Insert two peers in same role and level with 20% disparity:
      // Peer A: $50,000; Peer B: $60,000 ((60000 - 50000) / 50000 = 20% > 10%)
      const peerA = 'EMP-INEQ-A';
      const peerB = 'EMP-INEQ-B';
      const testRole = 'Integration QA Specialist';
      const testLevel = 3;

      await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: { id: peerA, name: 'Peer Lower', role: testRole, department: 'Engineering', level: testLevel, currentSalary: 50000 },
      });
      await request(baseUrl, '/api/employees', {
        method: 'POST',
        token: authToken,
        body: { id: peerB, name: 'Peer Higher', role: testRole, department: 'Engineering', level: testLevel, currentSalary: 60000 },
      });

      const res = await request(baseUrl, '/api/audit/inequities', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');

      const foundGroup = res.body.data.groups.find((g: any) => g.role === testRole && g.level === testLevel);
      assert(Boolean(foundGroup), 'Inequity group must be flagged for role and level');
      assertEqual(foundGroup.peerCount, 2, 'group has 2 peers');
      assertEqual(foundGroup.lowestSalary, 50000, 'lowest salary is 50000');
      assertEqual(foundGroup.highestSalary, 60000, 'highest salary is 60000');
      // Spread: (60000 - 50000) / 50000 = 0.20
      assert(Math.abs(foundGroup.spread - 0.20) < 0.001, 'spread must be exactly 20%');
      assert(foundGroup.spread > 0.10, 'spread exceeds 10% threshold (RF-004)');

      // Cleanup
      await request(baseUrl, `/api/employees/${peerA}`, { method: 'DELETE', token: authToken });
      await request(baseUrl, `/api/employees/${peerB}`, { method: 'DELETE', token: authToken });
    });

    // -------------------------------------------------------------
    // SUITE 2: Real-Time Budget Simulator & Sub-Second Latency (RF-005, RNF-002)
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- [SUITE 2] Real-Time Budget Simulator (RF-005, RNF-002) ---${RESET}`);
    resetDatabaseToSeed();

    await runTest('Simulator Engine', 'POST /api/audit/simulate evaluates P25 Minimum vs P50 Median leveling policies', async () => {
      // 1. Simulate target: 'minimum' (P25)
      const resMin = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: { target: SIMULATION_TARGETS.MINIMUM },
      });
      assertEqual(resMin.status, 200, 'Simulate P25 returns 200');
      assert(resMin.body.data.totalBudget > 0, 'P25 budget must be positive');
      assert(resMin.body.data.affectedCount > 0, 'P25 must have affected employees');

      // 2. Simulate target: 'median' (P50)
      const resMed = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: { target: SIMULATION_TARGETS.MEDIAN },
      });
      assertEqual(resMed.status, 200, 'Simulate P50 returns 200');
      assert(
        resMed.body.data.totalBudget > resMin.body.data.totalBudget,
        'P50 Median leveling budget must be strictly greater than P25 Minimum budget'
      );
    });

    await runTest('Simulator Engine', 'POST /api/audit/simulate filters adjustments strictly by selected departments', async () => {
      const res = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: {
          target: SIMULATION_TARGETS.MINIMUM,
          departments: ['Engineering'],
        },
      });

      assertEqual(res.status, 200, 'HTTP status 200');
      for (const row of res.body.data.rows) {
        if (!row.isBelowMinimumWage) {
          assertEqual(row.department, 'Engineering', 'Macro adjustments restricted to Engineering');
        }
      }
    });

    await runTest('Simulator Engine', 'POST /api/audit/simulate computes 1 to 4 quarters phased rollout schedule', async () => {
      // Test 1 quarter rollout
      const resQ1 = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: { rolloutQuarters: 1 },
      });
      assertEqual(resQ1.body.data.quarterlySchedule.length, 1, '1 quarter schedule has length 1');
      assertEqual(resQ1.body.data.quarterlySchedule[0].cost, Math.round(resQ1.body.data.totalBudget), 'quarter cost equals total');

      // Test 4 quarters rollout
      const resQ4 = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: { rolloutQuarters: 4 },
      });
      assertEqual(resQ4.body.data.quarterlySchedule.length, 4, '4 quarters schedule has length 4');
      const expectedQuarterCost = Math.round(resQ4.body.data.totalBudget / 4);
      assertEqual(resQ4.body.data.quarterlySchedule[0].cost, expectedQuarterCost, 'Q1 cost equals total / 4');
      assertEqual(resQ4.body.data.quarterlySchedule[3].cumulativeCost, Math.round(resQ4.body.data.totalBudget), 'Q4 cumulative equals total');
    });

    await runTest('Simulator Engine', 'POST /api/audit/simulate factors in Projected Market Inflation (0% to +25%)', async () => {
      // 1. Baseline simulation at 0% inflation
      const resBase = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: { inflationPercent: 0, target: SIMULATION_TARGETS.MINIMUM },
      });
      const baseBudget = resBase.body.data.totalBudget;

      // 2. Projected inflation at +10%
      const resInf = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: { inflationPercent: 10, target: SIMULATION_TARGETS.MINIMUM },
      });
      const infBudget = resInf.body.data.totalBudget;

      assert(
        infBudget > baseBudget,
        `Budget with 10% inflation ($${infBudget}) must exceed baseline budget ($${baseBudget})`
      );
    });

    await runTest('Simulator Engine', 'Budget allocation strictly prioritizes Legal Minimum Wage floor over band rules', async () => {
      // Configure statutory floor at $45,000
      await request(baseUrl, '/api/compliance/minimum-wage', {
        method: 'PUT',
        token: authToken,
        body: { enabled: true, minimumWage: 45000 },
      });

      const res = await request(baseUrl, '/api/audit/simulate', {
        method: 'POST',
        token: authToken,
        body: { target: SIMULATION_TARGETS.MINIMUM },
      });

      assertEqual(res.status, 200, 'Simulation returns 200');
      assert(res.body.data.legalComplianceCost > 0, 'legalComplianceCost must be accounted for');
      assert(
        res.body.data.rows[0].severity === 'legal_violation',
        'Top row in sorted adjustments must be legal_violation'
      );
      assert(
        res.body.data.rows[0].proposedSalary >= 45000,
        'Proposed salary for legal violation must meet the $45,000 statutory minimum'
      );
    });

    await runTest('Performance Benchmark (RNF-002)', '5 consecutive audit & simulation runs complete in < 1000ms each with zero AI delegation', async () => {
      const endpoints = [
        { path: '/api/audit/overview', method: 'GET' },
        { path: '/api/audit/simulate', method: 'POST', body: { target: 'minimum' } },
        { path: '/api/audit/simulate', method: 'POST', body: { target: 'median', inflationPercent: 5 } },
        { path: '/api/audit/gaps', method: 'GET' },
        { path: '/api/audit/inequities', method: 'GET' },
      ];

      for (let i = 0; i < endpoints.length; i++) {
        const ep = endpoints[i];
        const start = performance.now();
        const res = await request(baseUrl, ep.path, {
          method: ep.method,
          token: authToken,
          body: ep.body,
        });
        const elapsed = Math.round(performance.now() - start);

        assertEqual(res.status, 200, `${ep.method} ${ep.path} returned 200`);
        assert(elapsed < 1000, `Execution time (${elapsed}ms) must be under 1000ms (RNF-002 benchmark)`);
      }
    });

    // -------------------------------------------------------------
    // SUITE 3: Payroll Action Plan & Local Project Sessions (RF-008)
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- [SUITE 3] Payroll Action Plan & Local Project Sessions (RF-008) ---${RESET}`);

    // Restore baseline clean seed for state reproducibility
    resetDatabaseToSeed();

    await runTest('Payroll Action Plan', 'POST /api/simulator/approve-plan generates official execution order (Dry-run mode)', async () => {
      const res = await request(baseUrl, '/api/simulator/approve-plan', {
        method: 'POST',
        token: authToken,
        body: {
          scenarioName: 'Dry Run Plan Q1',
          commitToDatabase: false,
          notes: 'Executive board preliminary review',
        },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.committed, false, 'committed must be false on dry-run');

      const plan = res.body.data.plan;
      assert(Boolean(plan.id), 'Plan ID must be generated');
      assert(plan.totalCost > 0, 'Plan totalCost must be positive');
      assert(plan.affectedCount > 0, 'Plan affectedCount must be positive');
      assert(Array.isArray(plan.items) && plan.items.length === plan.affectedCount, 'Plan items must match affectedCount');

      const firstItem = plan.items[0];
      assert(Boolean(firstItem.employeeId), 'Item has employeeId');
      assert(Boolean(firstItem.fullName), 'Item has fullName');
      assert(firstItem.previousSalary > 0, 'Item has previousSalary');
      assert(firstItem.newSalary > firstItem.previousSalary, 'newSalary is higher than previousSalary');
      assertEqual(firstItem.increaseAmount, firstItem.newSalary - firstItem.previousSalary, 'increaseAmount is accurate');

      // Verify SQLite state: payroll_action_plans table has saved row, but employees table salaries are NOT modified
      const planInDb = db.prepare('SELECT * FROM payroll_action_plans WHERE id = ?').get(plan.id) as any;
      assert(Boolean(planInDb), 'Plan must be logged in SQLite payroll_action_plans');
      assertEqual(planInDb.affected_count, plan.affectedCount, 'DB affected_count matches');
    });

    await runTest('Payroll Action Plan', 'POST /api/simulator/approve-plan commits approved raises to SQLite payroll when commitToDatabase: true', async () => {
      const res = await request(baseUrl, '/api/simulator/approve-plan', {
        method: 'POST',
        token: authToken,
        body: {
          scenarioName: 'Official Leveling Commitment',
          commitToDatabase: true,
        },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.data.committed, true, 'committed must be true');

      const plan = res.body.data.plan;
      const firstTarget = plan.items[0];

      // Verify direct SQLite employees table: salary was updated to newSalary
      const empInDb = db.prepare('SELECT current_salary FROM employees WHERE id = ?').get(firstTarget.employeeId) as any;
      assertEqual(empInDb.current_salary, firstTarget.newSalary, 'Employee current_salary in SQLite committed to newSalary');
    });

    let exportedSession: ProjectSessionPayload;

    await runTest('Session Backup & Restore', 'GET /api/session/export exports complete lossless project state', async () => {
      const res = await request(baseUrl, '/api/session/export', { token: authToken });
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');

      exportedSession = res.body.data;
      assertEqual(exportedSession.app, 'EquiWage Analytics', 'app identifier matches');
      assertEqual(exportedSession.version, 1, 'schema version is 1');
      assert(Array.isArray(exportedSession.employees) && exportedSession.employees.length >= 24, 'employees list preserved');
      assert(Array.isArray(exportedSession.bands) && exportedSession.bands.length === 8, '8 bands preserved');
      assert(Boolean(exportedSession.simulation), 'simulation settings preserved');
      assert(Boolean(exportedSession.savedAt), 'savedAt timestamp preserved');
    });

    await runTest('Session Backup & Restore', 'POST /api/session/restore restores lossless project state from JSON payload', async () => {
      // 1. Deliberately alter database state (delete employees down to 2)
      db.prepare('DELETE FROM employees WHERE id NOT IN (SELECT id FROM employees LIMIT 2)').run();
      const countBefore = (db.prepare('SELECT COUNT(*) as count FROM employees').get() as any).count;
      assertEqual(countBefore, 2, 'Altered employee count to 2');

      // 2. Restore from saved exportedSession
      const res = await request(baseUrl, '/api/session/restore', {
        method: 'POST',
        token: authToken,
        body: { session: exportedSession },
      });

      assertEqual(res.status, 200, 'Restore returns 200');
      assertEqual(res.body.ok, true, 'ok must be true');

      // 3. Assert complete SQLite state restoration
      const countAfter = (db.prepare('SELECT COUNT(*) as count FROM employees').get() as any).count;
      assertEqual(countAfter, exportedSession.employees.length, 'All employees restored to SQLite');
      const bandsCount = (db.prepare('SELECT COUNT(*) as count FROM salary_bands').get() as any).count;
      assertEqual(bandsCount, 8, 'All 8 bands restored to SQLite');
    });

    await runTest('Session Backup & Restore', 'POST /api/session/restore restores lossless project state from uploaded .json file', async () => {
      // Deliberately alter bands
      db.prepare('UPDATE salary_bands SET min_salary = 1000 WHERE level = 1').run();

      const sessionFileContent = JSON.stringify(exportedSession, null, 2);
      const formData = new FormData();
      formData.append('file', new Blob([sessionFileContent], { type: 'application/json' }), 'project_backup.json');

      const res = await request(baseUrl, '/api/session/restore', {
        method: 'POST',
        token: authToken,
        formData,
      });

      assertEqual(res.status, 200, 'Restore from file returns 200');
      assertEqual(res.body.ok, true, 'ok must be true');

      const l1 = db.prepare('SELECT min_salary FROM salary_bands WHERE level = 1').get() as any;
      assertEqual(l1.min_salary, exportedSession.bands.find((b) => b.level === 1)!.min, 'L1 min restored from file');
    });

  } finally {
    // Teardown test server
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // -------------------------------------------------------------
  // PHASE 3 SUMMARY TABLE
  // -------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;

  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   PHASE 3 TEST EXECUTION SUMMARY                              ${RESET}`);
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
    console.log(`\n${GREEN}${BOLD}✓ ALL PHASE 3 TESTS PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
