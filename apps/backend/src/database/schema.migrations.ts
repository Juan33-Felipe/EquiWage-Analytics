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
  `);

  logger.info('SQLite schema migrations and indexes verified');
}
