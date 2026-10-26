import type { PayrollActionPlan } from '@equiwage/shared';
import { getDatabase } from '../database/sqlite.connection.js';
import { mapRowToPayrollActionPlan, type PayrollActionPlanDbRow } from '../models/db.models.js';

export class PayrollPlansRepository {
  /**
   * Persists an approved payroll action plan in SQLite.
   */
  saveActionPlan(plan: PayrollActionPlan): PayrollActionPlan {
    const db = getDatabase();
    const now = plan.createdAt || new Date().toISOString();

    db.prepare(`
      INSERT INTO payroll_action_plans (
        id, target, inflation_percent, total_previous_payroll, total_new_payroll, total_cost, affected_count, items_json, approved_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        target = excluded.target,
        inflation_percent = excluded.inflation_percent,
        total_previous_payroll = excluded.total_previous_payroll,
        total_new_payroll = excluded.total_new_payroll,
        total_cost = excluded.total_cost,
        affected_count = excluded.affected_count,
        items_json = excluded.items_json,
        approved_by = excluded.approved_by,
        created_at = excluded.created_at
    `).run(
      plan.id,
      plan.target,
      plan.inflationPercent ?? 0,
      plan.totalPreviousPayroll,
      plan.totalNewPayroll,
      plan.totalCost,
      plan.affectedCount,
      JSON.stringify(plan.items),
      plan.approvedBy ?? null,
      now
    );

    return {
      ...plan,
      createdAt: now,
    };
  }

  /**
   * Retrieves the most recently approved payroll action plan.
   */
  findLatestPlan(): PayrollActionPlan | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT id, target, inflation_percent, total_previous_payroll, total_new_payroll, total_cost, affected_count, items_json, approved_by, created_at
        FROM payroll_action_plans
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .get() as unknown as PayrollActionPlanDbRow | undefined;

    return row ? mapRowToPayrollActionPlan(row) : null;
  }

  /**
   * Retrieves a payroll action plan by ID.
   */
  findById(id: string): PayrollActionPlan | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT id, target, inflation_percent, total_previous_payroll, total_new_payroll, total_cost, affected_count, items_json, approved_by, created_at
        FROM payroll_action_plans
        WHERE id = ?
      `)
      .get(id) as unknown as PayrollActionPlanDbRow | undefined;

    return row ? mapRowToPayrollActionPlan(row) : null;
  }

  /**
   * Returns all historical approved payroll action plans.
   */
  findAllPlans(): PayrollActionPlan[] {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT id, target, inflation_percent, total_previous_payroll, total_new_payroll, total_cost, affected_count, items_json, approved_by, created_at
        FROM payroll_action_plans
        ORDER BY created_at DESC
      `)
      .all() as unknown as PayrollActionPlanDbRow[];

    return rows.map(mapRowToPayrollActionPlan);
  }
}

export const payrollPlansRepository = new PayrollPlansRepository();
