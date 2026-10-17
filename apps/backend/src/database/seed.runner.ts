import type { DatabaseSync } from 'node:sqlite';
import {
  DEFAULT_SALARY_BANDS,
  DEFAULT_SEED_EMPLOYEES,
  DEPARTMENTS,
  SESSION_SCHEMA_VERSION,
  SIMULATION_TARGETS,
} from '@equiwage/shared';
import { logger } from '../config/logger.js';
import { runInTransaction } from './sqlite.connection.js';

/**
 * Populates the database with the comprehensive initial seed if tables are empty,
 * ensuring the application is 100% functional on first launch.
 */
export function ensureDatabaseSeeded(db: DatabaseSync): { seeded: boolean; employeeCount: number; bandCount: number } {
  const bandCountRow = db.prepare('SELECT COUNT(*) as count FROM salary_bands').get() as { count: number } | undefined;
  const empCountRow = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number } | undefined;

  const existingBands = Number(bandCountRow?.count ?? 0);
  const existingEmployees = Number(empCountRow?.count ?? 0);

  if (existingBands > 0 && existingEmployees > 0) {
    ensureDefaultSettingsAndMetadata(db);
    return {
      seeded: false,
      employeeCount: existingEmployees,
      bandCount: existingBands,
    };
  }

  logger.info('Database is empty — populating initial salary bands (L1-L8) and employee payroll seed...');
  const result = resetDatabaseToSeed();

  return {
    seeded: true,
    employeeCount: result.employeeCount,
    bandCount: result.bandCount,
  };
}

/**
 * Ensures singleton simulation_settings and app_metadata keys exist even when DB already had rows.
 */
function ensureDefaultSettingsAndMetadata(db: DatabaseSync): void {
  const now = new Date().toISOString();

  const simRow = db.prepare('SELECT id FROM simulation_settings WHERE id = 1').get();
  if (!simRow) {
    db.prepare(`
      INSERT INTO simulation_settings (id, target, rollout_quarters, departments_json, custom_adjustment_percent, updated_at)
      VALUES (1, ?, 1, ?, 0, ?)
    `).run(SIMULATION_TARGETS.MINIMUM, JSON.stringify(DEPARTMENTS), now);
  }

  const sourceRow = db.prepare("SELECT key FROM app_metadata WHERE key = 'payroll_source'").get();
  if (!sourceRow) {
    db.prepare(`
      INSERT INTO app_metadata (key, value, updated_at)
      VALUES ('payroll_source', 'Sample dataset', ?)
    `).run(now);
  }
}

/**
 * Resets the SQLite database to the initial realistic seed dataset inside an atomic transaction.
 */
export function resetDatabaseToSeed(): { employeeCount: number; bandCount: number; payrollSource: string } {
  return runInTransaction((db) => {
    const now = new Date().toISOString();

    db.exec('DELETE FROM employees;');
    db.exec('DELETE FROM salary_bands;');

    const insertBand = db.prepare(`
      INSERT INTO salary_bands (level, min_salary, median_salary, max_salary, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const band of DEFAULT_SALARY_BANDS) {
      insertBand.run(band.level, band.min, band.median, band.max, now);
    }

    const insertEmployee = db.prepare(`
      INSERT INTO employees (id, name, role, department, level, current_salary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const emp of DEFAULT_SEED_EMPLOYEES) {
      insertEmployee.run(
        emp.id,
        emp.name,
        emp.role,
        emp.department,
        emp.level,
        emp.currentSalary,
        now,
        now
      );
    }

    db.prepare(`
      INSERT INTO simulation_settings (id, target, rollout_quarters, departments_json, custom_adjustment_percent, updated_at)
      VALUES (1, ?, 1, ?, 0, ?)
      ON CONFLICT(id) DO UPDATE SET
        target = excluded.target,
        rollout_quarters = excluded.rollout_quarters,
        departments_json = excluded.departments_json,
        custom_adjustment_percent = excluded.custom_adjustment_percent,
        updated_at = excluded.updated_at
    `).run(SIMULATION_TARGETS.MINIMUM, JSON.stringify(DEPARTMENTS), now);

    const upsertMeta = db.prepare(`
      INSERT INTO app_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    upsertMeta.run('payroll_source', 'Sample dataset', now);
    upsertMeta.run('schema_version', String(SESSION_SCHEMA_VERSION), now);
    upsertMeta.run('seeded_at', now, now);

    logger.info('SQLite seed completed', {
      bandsSeeded: DEFAULT_SALARY_BANDS.length,
      employeesSeeded: DEFAULT_SEED_EMPLOYEES.length,
    });

    return {
      employeeCount: DEFAULT_SEED_EMPLOYEES.length,
      bandCount: DEFAULT_SALARY_BANDS.length,
      payrollSource: 'Sample dataset',
    };
  });
}
