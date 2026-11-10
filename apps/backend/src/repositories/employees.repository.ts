import type { Employee } from '@equiwage/shared';
import { DEFAULT_LOCAL_ADMIN_USER, DEFAULT_SEED_EMPLOYEES } from '@equiwage/shared';
import { getDatabase, runInTransaction } from '../database/sqlite.connection.js';
import { mapRowToEmployee, type EmployeeDbRow } from '../models/db.models.js';
import { settingsRepository } from './settings.repository.js';

export interface EmployeeFilterOptions {
  department?: string;
  level?: number;
  search?: string;
  userId?: string;
}

export class EmployeesRepository {
  /**
   * Returns all employees, optionally filtered by department, level, search query, or user.
   */
  findAll(filters: EmployeeFilterOptions = {}, userId?: string): Employee[] {
    const db = getDatabase();
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    const effectiveUserId = userId || filters.userId;
    if (effectiveUserId) {
      if (effectiveUserId === DEFAULT_LOCAL_ADMIN_USER.id) {
        clauses.push('(user_id = ? OR user_id IS NULL)');
        params.push(effectiveUserId);
      } else {
        clauses.push('user_id = ?');
        params.push(effectiveUserId);
      }
    }

    if (filters.department && filters.department !== 'all') {
      clauses.push('department = ?');
      params.push(filters.department);
    }

    if (filters.level !== undefined && Number.isFinite(filters.level)) {
      clauses.push('level = ?');
      params.push(filters.level);
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      clauses.push('(LOWER(name) LIKE ? OR LOWER(role) LIKE ? OR LOWER(department) LIKE ? OR LOWER(id) LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `
      SELECT id, name, role, department, level, current_salary, created_at, updated_at
      FROM employees
      ${whereClause}
      ORDER BY id ASC
    `;

    const rows = db.prepare(sql).all(...params) as unknown as EmployeeDbRow[];
    return rows.map(mapRowToEmployee);
  }

  /**
   * Finds a single employee by ID, optionally scoped to a user.
   */
  findById(id: string, userId?: string): Employee | null {
    const db = getDatabase();
    if (userId) {
      const sql =
        userId === DEFAULT_LOCAL_ADMIN_USER.id
          ? 'SELECT id, name, role, department, level, current_salary, created_at, updated_at FROM employees WHERE id = ? AND (user_id = ? OR user_id IS NULL)'
          : 'SELECT id, name, role, department, level, current_salary, created_at, updated_at FROM employees WHERE id = ? AND user_id = ?';
      const row = db.prepare(sql).get(id, userId) as unknown as EmployeeDbRow | undefined;
      return row ? mapRowToEmployee(row) : null;
    }

    const row = db
      .prepare('SELECT id, name, role, department, level, current_salary, created_at, updated_at FROM employees WHERE id = ?')
      .get(id) as unknown as EmployeeDbRow | undefined;
    return row ? mapRowToEmployee(row) : null;
  }

  /**
   * Inserts or updates a single employee record.
   */
  upsertEmployee(employee: Employee, userId?: string): Employee {
    const db = getDatabase();
    const now = new Date().toISOString();
    const effectiveUserId = userId || DEFAULT_LOCAL_ADMIN_USER.id;

    db.prepare(`
      INSERT INTO employees (id, name, role, department, level, current_salary, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        department = excluded.department,
        level = excluded.level,
        current_salary = excluded.current_salary,
        user_id = COALESCE(excluded.user_id, employees.user_id),
        updated_at = excluded.updated_at
    `).run(
      employee.id,
      employee.name,
      employee.role,
      employee.department,
      employee.level,
      employee.currentSalary,
      effectiveUserId,
      now,
      now
    );
    return employee;
  }

  /**
   * Atomically replaces the user's employee payroll inside a transaction
   * and updates the active payroll_source metadata.
   */
  replaceAllEmployees(employees: Employee[], sourceName?: string, userId?: string): Employee[] {
    return runInTransaction((db) => {
      const now = new Date().toISOString();
      const effectiveUserId = userId || DEFAULT_LOCAL_ADMIN_USER.id;

      if (effectiveUserId === DEFAULT_LOCAL_ADMIN_USER.id) {
        db.prepare('DELETE FROM employees WHERE user_id = ? OR user_id IS NULL').run(effectiveUserId);
      } else {
        db.prepare('DELETE FROM employees WHERE user_id = ?').run(effectiveUserId);
      }

      const stmt = db.prepare(`
        INSERT INTO employees (id, name, role, department, level, current_salary, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const emp of employees) {
        stmt.run(
          emp.id,
          emp.name,
          emp.role,
          emp.department,
          emp.level,
          emp.currentSalary,
          effectiveUserId,
          now,
          now
        );
      }

      if (sourceName) {
        settingsRepository.setPayrollSource(sourceName);
      }

      return this.findAll({}, effectiveUserId);
    });
  }

  /**
   * Deletes a single employee record by ID, optionally scoped to user.
   */
  deleteById(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const sql =
        userId === DEFAULT_LOCAL_ADMIN_USER.id
          ? 'DELETE FROM employees WHERE id = ? AND (user_id = ? OR user_id IS NULL)'
          : 'DELETE FROM employees WHERE id = ? AND user_id = ?';
      const result = db.prepare(sql).run(id, userId);
      return Number(result.changes) > 0;
    }

    const result = db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  }

  /**
   * Returns total count of employees in the database for the given user.
   */
  count(userId?: string): number {
    const db = getDatabase();
    if (userId) {
      const sql =
        userId === DEFAULT_LOCAL_ADMIN_USER.id
          ? 'SELECT COUNT(*) as count FROM employees WHERE user_id = ? OR user_id IS NULL'
          : 'SELECT COUNT(*) as count FROM employees WHERE user_id = ?';
      const row = db.prepare(sql).get(userId) as { count: number } | undefined;
      return Number(row?.count ?? 0);
    }

    const row = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number } | undefined;
    return Number(row?.count ?? 0);
  }

  /**
   * Seeds realistic demo employees for a specific user upon explicit request.
   */
  loadDemoEmployees(userId: string): Employee[] {
    const userEmployees = DEFAULT_SEED_EMPLOYEES.map((e, idx) => ({
      ...e,
      id: `DEMO-${idx + 1}`,
    }));
    return this.replaceAllEmployees(userEmployees, 'Datos de Demostración', userId);
  }
}

export const employeesRepository = new EmployeesRepository();
