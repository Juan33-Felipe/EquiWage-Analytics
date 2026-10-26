import type { Employee } from '@equiwage/shared';
import { getDatabase, runInTransaction } from '../database/sqlite.connection.js';
import { mapRowToEmployee, type EmployeeDbRow } from '../models/db.models.js';
import { settingsRepository } from './settings.repository.js';

export interface EmployeeFilterOptions {
  department?: string;
  level?: number;
  search?: string;
}

export class EmployeesRepository {
  /**
   * Returns all employees, optionally filtered by department, level, or search query.
   */
  findAll(filters: EmployeeFilterOptions = {}): Employee[] {
    const db = getDatabase();
    const clauses: string[] = [];
    const params: Array<string | number> = [];

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
   * Finds a single employee by ID.
   */
  findById(id: string): Employee | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT id, name, role, department, level, current_salary, created_at, updated_at FROM employees WHERE id = ?')
      .get(id) as unknown as EmployeeDbRow | undefined;
    return row ? mapRowToEmployee(row) : null;
  }

  /**
   * Inserts or updates a single employee record.
   */
  upsertEmployee(employee: Employee): Employee {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO employees (id, name, role, department, level, current_salary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        department = excluded.department,
        level = excluded.level,
        current_salary = excluded.current_salary,
        updated_at = excluded.updated_at
    `).run(
      employee.id,
      employee.name,
      employee.role,
      employee.department,
      employee.level,
      employee.currentSalary,
      now,
      now
    );
    return employee;
  }

  /**
   * Atomically replaces the entire employee payroll table inside a transaction
   * and updates the active payroll_source metadata.
   */
  replaceAllEmployees(employees: Employee[], sourceName?: string): Employee[] {
    return runInTransaction((db) => {
      const now = new Date().toISOString();
      db.exec('DELETE FROM employees;');

      const stmt = db.prepare(`
        INSERT INTO employees (id, name, role, department, level, current_salary, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const emp of employees) {
        stmt.run(
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

      if (sourceName) {
        settingsRepository.setPayrollSource(sourceName);
      }

      return this.findAll();
    });
  }

  /**
   * Deletes a single employee record by ID.
   */
  deleteById(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  }

  /**
   * Returns total count of employees in the database.
   */
  count(): number {
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number } | undefined;
    return Number(row?.count ?? 0);
  }
}

export const employeesRepository = new EmployeesRepository();
