import type { DatabaseSync } from 'node:sqlite';
import { logger } from '../config/logger.js';

/**
 * Automatically creates all required SQLite tables and performance indexes
 * if they do not already exist.
 */
export function runSchemaMigrations(db: DatabaseSync): void {
  db.exec(`
    -- 1. Market Salary Bands Table (Job Levels L1-L8+, P25/P50/P75)
    CREATE TABLE IF NOT EXISTS salary_bands (
      level INTEGER PRIMARY KEY,
      min_salary REAL NOT NULL CHECK (min_salary >= 0),
      median_salary REAL NOT NULL CHECK (median_salary >= min_salary),
      max_salary REAL NOT NULL CHECK (max_salary >= median_salary),
      updated_at TEXT NOT NULL
    );

    -- 2. Employee Payroll Table
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      level INTEGER NOT NULL,
      current_salary REAL NOT NULL CHECK (current_salary > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Performance indexes for < 1s audit and simulation queries (RNF-002)
    CREATE INDEX IF NOT EXISTS idx_employees_level ON employees(level);
    CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
    CREATE INDEX IF NOT EXISTS idx_employees_role_level ON employees(role, level);

    -- 3. Active Budget Simulator Settings (Singleton Row id = 1)
    CREATE TABLE IF NOT EXISTS simulation_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      target TEXT NOT NULL CHECK (target IN ('minimum', 'median')),
      rollout_quarters INTEGER NOT NULL CHECK (rollout_quarters BETWEEN 1 AND 4),
      departments_json TEXT NOT NULL,
      custom_adjustment_percent REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- 4. Application Metadata Key-Value Store (payroll_source, schema_version, etc.)
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 5. Auxiliary Audit & Scenario History Table
    CREATE TABLE IF NOT EXISTS audit_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      payroll_source TEXT NOT NULL,
      headcount INTEGER NOT NULL,
      market_gaps_count INTEGER NOT NULL,
      inequities_count INTEGER NOT NULL,
      total_budget REAL NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 6. Local HR Analysts & Administrators Table (RNF-001 Local Access Control)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      initials TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- 7. Revoked Session Tokens Table (Clean local logout & token invalidation)
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      jti TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT NOT NULL
    );

    -- 8. Temporary 4-Digit Email Verification Codes (User Registration & Account Activation)
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE,
      code TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'HR',
      role TEXT NOT NULL DEFAULT 'Compensation Analyst',
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_codes(email);
  `);

  // Ensure is_verified column exists in users table (non-destructive migration)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 1;`);
  } catch {
    // Column already exists, safe to ignore
  }

  logger.info('SQLite schema migrations and indexes verified');
}
