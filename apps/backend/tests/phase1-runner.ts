import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/database/sqlite.connection.js';
import { runSchemaMigrations } from '../src/database/schema.migrations.js';
import { ensureDatabaseSeeded, resetDatabaseToSeed } from '../src/database/seed.runner.js';
import { envConfig } from '../src/config/env.config.js';
import { emailService } from '../src/services/email.service.js';
import { usersRepository } from '../src/repositories/users.repository.js';
import { DEFAULT_LOCAL_ADMIN_USER, DEFAULT_SEED_EMPLOYEES, DEFAULT_SALARY_BANDS } from '@equiwage/shared';

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
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const reqOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body !== undefined) {
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
  console.log(`${BOLD}${CYAN}   EQUIWAGE ANALYTICS — BACKEND API QA SUITE (PHASE 1)         ${RESET}`);
  console.log(`${BOLD}${CYAN}   Server Health, SQLite Persistence & Authentication Flow     ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  // 1. Initialize SQLite Database & Schema Migrations
  const db = getDatabase();
  runSchemaMigrations(db);
  ensureDatabaseSeeded(db);

  // Clean any leftover test users from prior runs
  db.prepare("DELETE FROM users WHERE email LIKE '%@company.com'").run();
  db.prepare("DELETE FROM verification_codes WHERE email LIKE '%@company.com'").run();

  // 2. Spin up test server on ephemeral port (port: 0)
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // SUITE 1: Server Health & SQLite Database Seed Verification
    // -------------------------------------------------------------
    console.log(`${BOLD}--- [SUITE 1] Server Health & SQLite Database Seed ---${RESET}`);

    await runTest('Health & DB', 'GET /api/health returns 200 with complete server readiness payload', async () => {
      const res = await request(baseUrl, '/api/health');
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assert(res.body.ok === true, 'ok must be true');
      assertEqual(res.body.service, 'EquiWage Analytics Backend API', 'service name matches');
      assert(res.body.database.connected === true, 'database connected must be true');
      assertEqual(res.body.database.engine, 'sqlite', 'database engine must be sqlite');
      assert(res.body.database.employeeCount >= 24, 'employeeCount must be >= 24');
      assertEqual(res.body.database.bandCount, 8, 'bandCount must be 8 (L1-L8)');
      assert(typeof res.body.uptimeSeconds === 'number', 'uptimeSeconds must be number');
      assert(Boolean(res.body.timestamp), 'timestamp must exist');
    });

    await runTest('Health & DB', 'GET /api/health/db returns 200 with granular database diagnostics', async () => {
      const res = await request(baseUrl, '/api/health/db');
      assertEqual(res.status, 200, 'HTTP status must be 200');
      assert(res.body.ok === true, 'ok must be true');
      assert(res.body.database.tables.salary_bands === 8, 'must report 8 bands in database');
      assert(res.body.database.tables.employees >= 24, 'must report at least 24 employees');
      assert(Array.isArray(res.body.database.salaryBandsPreview) && res.body.database.salaryBandsPreview.length === 8, 'must report 8 bands preview');
      assert(Boolean(res.body.database.departmentBreakdown), 'must report department distribution');
    });

    await runTest('Health & DB', 'SQLite tables verification: all 12 core tables exist in schema', () => {
      const expectedTables = [
        'salary_bands',
        'employees',
        'simulation_settings',
        'app_metadata',
        'audit_snapshots',
        'users',
        'revoked_tokens',
        'verification_codes',
        'legal_compliance_settings',
        'reference_countries',
        'employee_manual_adjustments',
        'payroll_action_plans',
      ];

      for (const table of expectedTables) {
        const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
        assert(Boolean(row), `Table '${table}' must exist in SQLite database`);
      }
    });

    await runTest('Health & DB', 'SQLite salary_bands seed: exactly 8 levels (L1–L8) with P25 <= P50 <= P75 monotonicity', () => {
      const bands = db.prepare('SELECT * FROM salary_bands ORDER BY level ASC').all() as any[];
      assertEqual(bands.length, 8, 'must have exactly 8 salary bands');
      for (let i = 0; i < 8; i++) {
        const band = bands[i];
        assertEqual(band.level, i + 1, `band level must be ${i + 1}`);
        assert(band.min_salary > 0, `min_salary for level ${band.level} must be > 0`);
        assert(band.median_salary >= band.min_salary, `median >= min for level ${band.level}`);
        assert(band.max_salary >= band.median_salary, `max >= median for level ${band.level}`);
      }
    });

    await runTest('Health & DB', 'SQLite employees seed: populated with active records and valid level foreign references', () => {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
      assert(countRow.count >= 24, `must have at least 24 seeded employees, got ${countRow.count}`);

      const invalidRows = db.prepare('SELECT id, current_salary, level FROM employees WHERE current_salary <= 0 OR level < 1 OR level > 8').all();
      assertEqual(invalidRows.length, 0, 'all seeded employees must have positive salary and level between 1 and 8');
    });

    await runTest('Health & DB', 'SQLite legal compliance seed: singleton row id=1 exists with valid statutory defaults', () => {
      const compliance = db.prepare('SELECT * FROM legal_compliance_settings WHERE id = 1').get() as any;
      assert(Boolean(compliance), 'legal_compliance_settings row id=1 must exist');
      assertEqual(compliance.id, 1, 'compliance row id must be 1');
      assert(compliance.enabled === 1 || compliance.enabled === 0, 'enabled must be boolean 0/1');
      assert(typeof compliance.country_code === 'string' && compliance.country_code.length >= 2, 'valid country code');
      assert(compliance.minimum_wage > 0, 'statutory minimum wage must be positive');
    });

    await runTest('Health & DB', 'SQLite users seed: default local admin account hr.admin exists', () => {
      const admin = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get('hr.admin', 'admin@equiwage.local') as any;
      assert(Boolean(admin), 'default local admin user must be seeded in SQLite');
      assertEqual(admin.username, 'hr.admin', 'admin username must be hr.admin');
      assertEqual(admin.email, 'admin@equiwage.local', 'admin email must match');
      assertEqual(admin.is_active, 1, 'admin must be active');
      assert(admin.password_hash.startsWith('$2'), 'admin password must be hashed with bcrypt');
    });

    await runTest('Health & DB', 'SQLite seed reset runner: resetDatabaseToSeed cleanly restores baseline dataset', () => {
      const resetResult = resetDatabaseToSeed();
      assertEqual(resetResult.bandCount, DEFAULT_SALARY_BANDS.length, 'restores 8 salary bands');
      assertEqual(resetResult.employeeCount, DEFAULT_SEED_EMPLOYEES.length, 'restores 24 baseline seed employees');
      assertEqual(resetResult.payrollSource, 'Sample dataset', 'resets payroll source metadata');

      const compliance = db.prepare('SELECT * FROM legal_compliance_settings WHERE id = 1').get() as any;
      assertEqual(compliance.country_code, 'US', 'resets compliance to US');
      assertEqual(compliance.minimum_wage, 42000, 'resets compliance to $42,000');
    });

    // -------------------------------------------------------------
    // SUITE 2: Registration & 4-Digit Email Verification Flow
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- [SUITE 2] Registration & 4-Digit Email Verification ---${RESET}`);

    await runTest('Auth Registration', 'POST /api/auth/register fails with 400 when missing first or last name', async () => {
      const res = await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: '',
          lastName: '',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
      });
      assertEqual(res.status, 400, 'HTTP status must be 400');
      assertEqual(res.body.ok, false, 'ok must be false');
      assertEqual(res.body.errorKey, 'auth.nameRequired', 'errorKey matches nameRequired');
    });

    await runTest('Auth Registration', 'POST /api/auth/register fails with 400 when email format is invalid', async () => {
      const res = await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'not-an-email',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
      });
      assertEqual(res.status, 400, 'HTTP status must be 400');
      assertEqual(res.body.ok, false, 'ok must be false');
      assertEqual(res.body.errorKey, 'auth.invalidEmail', 'errorKey matches invalidEmail');
    });

    await runTest('Auth Registration', 'POST /api/auth/register fails with 400 when password is under 6 characters', async () => {
      const res = await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com',
          password: '123',
          confirmPassword: '123',
        },
      });
      assertEqual(res.status, 400, 'HTTP status must be 400');
      assertEqual(res.body.ok, false, 'ok must be false');
      assertEqual(res.body.errorKey, 'auth.passwordTooShort', 'errorKey matches passwordTooShort');
    });

    await runTest('Auth Registration', 'POST /api/auth/register fails with 400 when passwords do not match', async () => {
      const res = await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword456!',
        },
      });
      assertEqual(res.status, 400, 'HTTP status must be 400');
      assertEqual(res.body.ok, false, 'ok must be false');
      assertEqual(res.body.errorKey, 'auth.passwordMismatch', 'errorKey matches passwordMismatch');
    });

    await runTest('Auth Registration', 'POST /api/auth/register fails with 409 when email already exists', async () => {
      const res = await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Elena',
          lastName: 'Vance',
          email: 'admin@equiwage.local', // already seeded
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
      });
      assertEqual(res.status, 409, 'HTTP status must be 409');
      assertEqual(res.body.ok, false, 'ok must be false');
      assertEqual(res.body.errorKey, 'auth.emailAlreadyRegistered', 'errorKey matches emailAlreadyRegistered');
    });

    await runTest('Auth Registration', 'POST /api/auth/register clean 502 error when SMTP credentials are intentionally missing', async () => {
      // Temporarily clear SMTP env credentials
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;
      process.env.SMTP_USER = '';
      process.env.SMTP_PASS = '';
      emailService.setTransporter(null);

      try {
        const res = await request(baseUrl, '/api/auth/register', {
          method: 'POST',
          body: {
            firstName: 'NoSmtp',
            lastName: 'User',
            email: 'nosmtp@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
          },
        });
        assertEqual(res.status, 502, 'HTTP status must be 502 Bad Gateway when SMTP is unconfigured');
        assertEqual(res.body.ok, false, 'ok must be false');
        assertEqual(res.body.errorKey, 'auth.emailDeliveryFailed', 'errorKey matches auth.emailDeliveryFailed');
        assert(res.body.message.includes('email service is not configured'), 'user-friendly message returned');
      } finally {
        process.env.SMTP_USER = originalUser;
        process.env.SMTP_PASS = originalPass;
        emailService.setTransporter(null);
      }
    });

    // Mock transporter for fast, deterministic test of registration & code delivery
    const sentMails: any[] = [];
    const mockTransporter: any = {
      sendMail: async (mailOptions: any) => {
        sentMails.push(mailOptions);
        return { messageId: `mock-${Date.now()}` };
      },
    };
    emailService.setTransporter(mockTransporter);

    const testCandidateEmail = 'marcus.vance@company.com';
    db.prepare('DELETE FROM users WHERE email = ?').run(testCandidateEmail);
    db.prepare('DELETE FROM verification_codes WHERE email = ?').run(testCandidateEmail);
    let extractedDevCode: string = '';

    await runTest('Auth Registration', 'POST /api/auth/register succeeds and triggers 4-digit email delivery', async () => {
      sentMails.length = 0;
      const res = await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Marcus',
          lastName: 'Vance',
          email: testCandidateEmail,
          password: 'SecurePassword2026!',
          confirmPassword: 'SecurePassword2026!',
          department: 'Engineering',
          role: 'Staff Compensation Partner',
        },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.email, testCandidateEmail, 'email matches candidate');
      assertEqual(res.body.data.expiresInSeconds, 900, 'expiresInSeconds is 900 (15m)');
      assert(sentMails.length === 1, 'email transporter sendMail was invoked once');
      assertEqual(sentMails[0].to, testCandidateEmail, 'mail dispatched to candidate email');
      assert(sentMails[0].subject.includes('Your EquiWage Verification Code:'), 'email subject formatted correctly');

      // Extract generated 4-digit code from SQLite verification_codes table
      const codeRow = db.prepare('SELECT code FROM verification_codes WHERE email = ?').get(testCandidateEmail) as { code: string };
      assert(Boolean(codeRow), 'verification_codes row must be saved in SQLite');
      assert(/^\d{4}$/.test(codeRow.code), `code must be a 4-digit numeric string, got '${codeRow.code}'`);
      extractedDevCode = codeRow.code;
    });

    await runTest('Auth Security', 'SECURITY LEAK AUDIT: Neither /register nor /resend-code leaks devCode or secret code in JSON payload', async () => {
      // 1. Verify /register response
      const regRes = await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Audit',
          lastName: 'Target',
          email: 'audit.leak.test@company.com',
          password: 'Password2026!',
          confirmPassword: 'Password2026!',
        },
      });

      assertEqual(regRes.status, 200, 'Register returns 200');
      const regPayloadStr = JSON.stringify(regRes.body);

      // Check SQLite code for this email
      const codeRow = db.prepare('SELECT code FROM verification_codes WHERE email = ?').get('audit.leak.test@company.com') as { code: string };
      const secretCode = codeRow.code;

      assert(!regPayloadStr.includes('"devCode"'), 'JSON payload MUST NOT contain "devCode" key');
      assert(!regPayloadStr.includes(`"${secretCode}"`), 'JSON payload MUST NOT leak the 4-digit numeric code');
      assert(regRes.body.data.devCode === undefined, 'devCode field in data must be undefined');
      assert(regRes.body.devCode === undefined, 'devCode field in root must be undefined');

      // 2. Verify /resend-code response
      const resendRes = await request(baseUrl, '/api/auth/resend-code', {
        method: 'POST',
        body: { email: 'audit.leak.test@company.com' },
      });

      assertEqual(resendRes.status, 200, 'Resend-code returns 200');
      const resendPayloadStr = JSON.stringify(resendRes.body);
      assert(!resendPayloadStr.includes('"devCode"'), 'Resend payload MUST NOT contain "devCode" key');
      assert(resendRes.body.data.devCode === undefined, 'Resend devCode field must be undefined');

      // Clean up test verification codes
      db.prepare('DELETE FROM verification_codes WHERE email = ?').run('audit.leak.test@company.com');
    });

    await runTest('Auth Verification', 'POST /api/auth/verify fails with 404 when email has no pending verification', async () => {
      const res = await request(baseUrl, '/api/auth/verify', {
        method: 'POST',
        body: { email: 'nonexistent@company.com', code: '1234' },
      });
      assertEqual(res.status, 404, 'HTTP status must be 404');
      assertEqual(res.body.errorKey, 'auth.codeNotFound', 'errorKey matches codeNotFound');
    });

    await runTest('Auth Verification', 'POST /api/auth/verify fails with 400 on incorrect 4-digit code and increments attempts', async () => {
      const initialRow = db.prepare('SELECT attempts FROM verification_codes WHERE email = ?').get(testCandidateEmail) as { attempts: number };
      const initialAttempts = initialRow.attempts;

      const res = await request(baseUrl, '/api/auth/verify', {
        method: 'POST',
        body: { email: testCandidateEmail, code: '0000' },
      });

      assertEqual(res.status, 400, 'HTTP status must be 400 for incorrect code');
      assertEqual(res.body.errorKey, 'auth.invalidCode', 'errorKey matches invalidCode');

      const updatedRow = db.prepare('SELECT attempts FROM verification_codes WHERE email = ?').get(testCandidateEmail) as { attempts: number };
      assertEqual(updatedRow.attempts, initialAttempts + 1, 'attempts counter in SQLite must increment by 1');
    });

    await runTest('Auth Verification', 'POST /api/auth/verify fails with 429 when max attempts (5) exceeded', async () => {
      // Artificially set attempts to 5 in SQLite
      db.prepare('UPDATE verification_codes SET attempts = 5 WHERE email = ?').run(testCandidateEmail);

      const res = await request(baseUrl, '/api/auth/verify', {
        method: 'POST',
        body: { email: testCandidateEmail, code: extractedDevCode },
      });

      assertEqual(res.status, 429, 'HTTP status must be 429 Too Many Requests');
      assertEqual(res.body.errorKey, 'auth.tooManyAttempts', 'errorKey matches tooManyAttempts');

      // Reset attempts back to 0 for subsequent test
      db.prepare('UPDATE verification_codes SET attempts = 0 WHERE email = ?').run(testCandidateEmail);
    });

    let activatedUserToken: string = '';

    await runTest('Auth Verification', 'POST /api/auth/verify activates account with correct 4-digit code and returns JWT session', async () => {
      const res = await request(baseUrl, '/api/auth/verify', {
        method: 'POST',
        body: { email: testCandidateEmail, code: extractedDevCode },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assert(Boolean(res.body.data.token), 'JWT token must be returned');
      assertEqual(res.body.data.user.email, testCandidateEmail, 'returned user email matches');
      assertEqual(res.body.data.user.fullName, 'Marcus Vance', 'full name matches');
      assertEqual(res.body.data.user.department, 'Engineering', 'department matches');

      activatedUserToken = res.body.data.token;

      // Verify SQLite state: user exists and verification_codes cleaned
      const userInDb = db.prepare('SELECT * FROM users WHERE email = ?').get(testCandidateEmail) as any;
      assert(Boolean(userInDb), 'New user must exist in SQLite users table');
      assertEqual(userInDb.is_active, 1, 'user must be active');
      assertEqual(userInDb.is_verified, 1, 'user must be verified');

      const codeInDb = db.prepare('SELECT * FROM verification_codes WHERE email = ?').get(testCandidateEmail);
      assert(!codeInDb, 'verification_codes row must be deleted upon successful activation');
    });

    await runTest('Auth Verification', 'POST /api/auth/verify-code endpoint alias functions identically to /verify', async () => {
      // Register a temporary user to test /verify-code alias
      await request(baseUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Alias',
          lastName: 'User',
          email: 'alias.test@company.com',
          password: 'Password2026!',
          confirmPassword: 'Password2026!',
        },
      });

      const row = db.prepare('SELECT code FROM verification_codes WHERE email = ?').get('alias.test@company.com') as { code: string };
      assert(Boolean(row), 'verification code exists');

      const res = await request(baseUrl, '/api/auth/verify-code', {
        method: 'POST',
        body: { email: 'alias.test@company.com', code: row.code },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200 on /api/auth/verify-code');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.user.email, 'alias.test@company.com', 'user activated successfully');

      // Cleanup alias user
      db.prepare('DELETE FROM users WHERE email = ?').run('alias.test@company.com');
    });

    // -------------------------------------------------------------
    // SUITE 3: Login, Session Verification & Route Protection
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- [SUITE 3] Login & Route Protection ---${RESET}`);

    await runTest('Auth Login', 'POST /api/auth/login fails with 400 when identifier or password is missing', async () => {
      const res = await request(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: { identifier: '', password: '' },
      });
      assertEqual(res.status, 400, 'HTTP status must be 400');
      assertEqual(res.body.errorKey, 'auth.missingCredentials', 'errorKey matches missingCredentials');
    });

    await runTest('Auth Login', 'POST /api/auth/login fails with 401 on non-existent identifier', async () => {
      const res = await request(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: { identifier: 'ghost@equiwage.local', password: 'AnyPassword123!' },
      });
      assertEqual(res.status, 401, 'HTTP status must be 401');
      assertEqual(res.body.errorKey, 'auth.invalidCredentials', 'errorKey matches invalidCredentials');
    });

    await runTest('Auth Login', 'POST /api/auth/login fails with 401 on incorrect password', async () => {
      const res = await request(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: { identifier: 'admin@equiwage.local', password: 'WrongPassword999!' },
      });
      assertEqual(res.status, 401, 'HTTP status must be 401');
      assertEqual(res.body.errorKey, 'auth.invalidCredentials', 'errorKey matches invalidCredentials');
    });

    let adminJwtToken: string = '';

    await runTest('Auth Login', 'POST /api/auth/login succeeds with default admin credentials and updates last_login_at in SQLite', async () => {
      const res = await request(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: {
          identifier: DEFAULT_LOCAL_ADMIN_USER.email,
          password: DEFAULT_LOCAL_ADMIN_USER.defaultPassword,
        },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assert(Boolean(res.body.data.token), 'JWT token must be issued');
      assertEqual(res.body.data.user.username, DEFAULT_LOCAL_ADMIN_USER.username, 'admin username matches');
      assertEqual(res.body.data.user.role, DEFAULT_LOCAL_ADMIN_USER.role, 'admin role matches');

      adminJwtToken = res.body.data.token;

      const postAdmin = db.prepare('SELECT last_login_at FROM users WHERE email = ?').get(DEFAULT_LOCAL_ADMIN_USER.email) as any;
      assert(Boolean(postAdmin.last_login_at), 'last_login_at must be populated in SQLite');
    });

    await runTest('Auth Login', 'POST /api/auth/login succeeds with newly registered & verified user', async () => {
      const res = await request(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: {
          identifier: testCandidateEmail,
          password: 'SecurePassword2026!',
        },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.user.email, testCandidateEmail, 'new user signs in cleanly');
    });

    await runTest('Session Verification', 'GET /api/auth/session returns 200 with user profile when valid Bearer token provided', async () => {
      const res = await request(baseUrl, '/api/auth/session', {
        headers: { Authorization: `Bearer ${adminJwtToken}` },
      });

      assertEqual(res.status, 200, 'HTTP status must be 200');
      assertEqual(res.body.ok, true, 'ok must be true');
      assertEqual(res.body.data.authenticated, true, 'authenticated must be true');
      assertEqual(res.body.data.user.username, DEFAULT_LOCAL_ADMIN_USER.username, 'user profile returned');
    });

    await runTest('Session Verification', 'GET /api/auth/session rejects with 401 when no token is provided', async () => {
      const res = await request(baseUrl, '/api/auth/session');
      assertEqual(res.status, 401, 'HTTP status must be 401');
      assertEqual(res.body.errorKey, 'auth.unauthorized', 'errorKey matches unauthorized');
    });

    await runTest('Route Protection', 'Protected endpoints reject unauthenticated requests with 401', async () => {
      const protectedEndpoints = [
        { path: '/api/employees', method: 'GET' },
        { path: '/api/bands', method: 'GET' },
        { path: '/api/audit', method: 'GET' },
        { path: '/api/simulation', method: 'GET' },
        { path: '/api/compliance/minimum-wage', method: 'GET' },
        { path: '/api/session/export', method: 'GET' },
      ];

      for (const endpoint of protectedEndpoints) {
        const res = await request(baseUrl, endpoint.path, { method: endpoint.method });
        assertEqual(res.status, 401, `${endpoint.method} ${endpoint.path} must return 401 without token`);
        assertEqual(res.body.ok, false, 'ok must be false');
        assertEqual(res.body.errorKey, 'auth.unauthorized', 'errorKey must be auth.unauthorized');
      }
    });

    await runTest('Route Protection', 'Protected endpoints reject forged / invalid Bearer token with 401', async () => {
      const res = await request(baseUrl, '/api/employees', {
        headers: { Authorization: 'Bearer forged.fake.jwt.token' },
      });
      assertEqual(res.status, 401, 'HTTP status must be 401');
      assertEqual(res.body.errorKey, 'auth.unauthorized', 'errorKey must be auth.unauthorized');
    });

    await runTest('Route Protection', 'Protected endpoints succeed with valid Bearer token', async () => {
      const res = await request(baseUrl, '/api/employees', {
        headers: { Authorization: `Bearer ${adminJwtToken}` },
      });
      assertEqual(res.status, 200, 'HTTP status must be 200 when authenticated');
      assertEqual(res.body.ok, true, 'ok must be true');
      assert(Array.isArray(res.body.data.employees), 'employees list must be an array');
      assert(res.body.data.employees.length >= 24, 'must return at least 24 employees');
    });

    await runTest('Auth Logout', 'POST /api/auth/logout revokes JWT token and subsequent calls with that token are rejected with 401', async () => {
      // 1. Issue a dedicated disposable login session
      const loginRes = await request(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: {
          identifier: DEFAULT_LOCAL_ADMIN_USER.email,
          password: DEFAULT_LOCAL_ADMIN_USER.defaultPassword,
        },
      });
      const disposableToken = loginRes.body.data.token;

      // 2. Verify token works before logout
      const beforeLogout = await request(baseUrl, '/api/bands', {
        headers: { Authorization: `Bearer ${disposableToken}` },
      });
      assertEqual(beforeLogout.status, 200, 'Token is valid prior to logout');

      // 3. Perform logout
      const logoutRes = await request(baseUrl, '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${disposableToken}` },
      });
      assertEqual(logoutRes.status, 200, 'Logout succeeds with 200');
      assertEqual(logoutRes.body.data.loggedOut, true, 'loggedOut is true');

      // 4. Verify token is stored in SQLite revoked_tokens table
      const revokedCount = db.prepare('SELECT COUNT(*) as count FROM revoked_tokens').get() as { count: number };
      assert(revokedCount.count > 0, 'revoked_tokens table must contain the revoked token jti');

      // 5. Subsequent request using revoked token must be rejected with 401
      const afterLogout = await request(baseUrl, '/api/bands', {
        headers: { Authorization: `Bearer ${disposableToken}` },
      });
      assertEqual(afterLogout.status, 401, 'Revoked token must be rejected with 401');
      assertEqual(afterLogout.body.errorKey, 'auth.unauthorized', 'errorKey must be auth.unauthorized');
    });

  } finally {
    // Teardown test server
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // -------------------------------------------------------------
  // PHASE 1 SUMMARY TABLE
  // -------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;

  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   PHASE 1 TEST EXECUTION SUMMARY                              ${RESET}`);
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
    console.log(`\n${GREEN}${BOLD}✓ ALL PHASE 1 TESTS PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
