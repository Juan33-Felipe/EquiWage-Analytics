import type { ManualAdjustment } from '@equiwage/shared';
import { getDatabase } from '../database/sqlite.connection.js';
import { mapRowToManualAdjustment, type ManualAdjustmentDbRow } from '../models/db.models.js';

export class ManualAdjustmentsRepository {
  /**
   * Returns all active individual manual salary adjustments.
   */
  findAll(): ManualAdjustment[] {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT employee_id, adjustment_type, adjustment_value, proposed_salary, notes, created_at, updated_at
        FROM employee_manual_adjustments
        ORDER BY employee_id ASC
      `)
      .all() as unknown as ManualAdjustmentDbRow[];

    return rows.map(mapRowToManualAdjustment);
  }

  /**
   * Finds proposed manual adjustment for a specific employee.
   */
  findByEmployeeId(employeeId: string): ManualAdjustment | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT employee_id, adjustment_type, adjustment_value, proposed_salary, notes, created_at, updated_at
        FROM employee_manual_adjustments
        WHERE employee_id = ?
      `)
      .get(employeeId) as unknown as ManualAdjustmentDbRow | undefined;

    return row ? mapRowToManualAdjustment(row) : null;
  }

  /**
   * Upserts a proposed manual salary adjustment for an employee.
   */
  upsertAdjustment(adjustment: ManualAdjustment): ManualAdjustment {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO employee_manual_adjustments (
        employee_id, adjustment_type, adjustment_value, proposed_salary, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(employee_id) DO UPDATE SET
        adjustment_type = excluded.adjustment_type,
        adjustment_value = excluded.adjustment_value,
        proposed_salary = excluded.proposed_salary,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(
      adjustment.employeeId,
      adjustment.type,
      adjustment.value,
      adjustment.proposedSalary ?? 0,
      adjustment.notes ?? null,
      now,
      now
    );

    return {
      ...adjustment,
      updatedAt: now,
    };
  }

  /**
   * Deletes a manual adjustment for an employee.
   */
  deleteAdjustment(employeeId: string): boolean {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM employee_manual_adjustments WHERE employee_id = ?')
      .run(employeeId);

    return Number(result.changes) > 0;
  }

  /**
   * Removes all active manual adjustments.
   */
  clearAll(): void {
    const db = getDatabase();
    db.exec('DELETE FROM employee_manual_adjustments;');
  }
}

export const manualAdjustmentsRepository = new ManualAdjustmentsRepository();
