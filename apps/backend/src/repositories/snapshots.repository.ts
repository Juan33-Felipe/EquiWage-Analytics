import { getDatabase } from '../database/sqlite.connection.js';
import type { AuditSnapshotDbRow } from '../models/db.models.js';

export interface CreateAuditSnapshotInput {
  name: string;
  payrollSource: string;
  headcount: number;
  marketGapsCount: number;
  inequitiesCount: number;
  totalBudget: number;
  payload: unknown;
}

export interface AuditSnapshotSummary {
  id: number;
  name: string;
  payrollSource: string;
  headcount: number;
  marketGapsCount: number;
  inequitiesCount: number;
  totalBudget: number;
  createdAt: string;
}

export class SnapshotsRepository {
  /**
   * Saves an audit or scenario snapshot to the audit_snapshots table.
   */
  createSnapshot(input: CreateAuditSnapshotInput): AuditSnapshotSummary {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO audit_snapshots (
          name, payroll_source, headcount, market_gaps_count, inequities_count, total_budget, payload_json, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.name,
        input.payrollSource,
        input.headcount,
        input.marketGapsCount,
        input.inequitiesCount,
        input.totalBudget,
        JSON.stringify(input.payload),
        now
      );

    return {
      id: Number(result.lastInsertRowid),
      name: input.name,
      payrollSource: input.payrollSource,
      headcount: input.headcount,
      marketGapsCount: input.marketGapsCount,
      inequitiesCount: input.inequitiesCount,
      totalBudget: input.totalBudget,
      createdAt: now,
    };
  }

  /**
   * Lists the most recent audit snapshots (without full payload_json for fast listing).
   */
  findRecentSnapshots(limit = 20): AuditSnapshotSummary[] {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT id, name, payroll_source, headcount, market_gaps_count, inequities_count, total_budget, created_at
        FROM audit_snapshots
        ORDER BY id DESC
        LIMIT ?
      `)
      .all(limit) as unknown as Omit<AuditSnapshotDbRow, 'payload_json'>[];

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      payrollSource: row.payroll_source,
      headcount: Number(row.headcount),
      marketGapsCount: Number(row.market_gaps_count),
      inequitiesCount: Number(row.inequities_count),
      totalBudget: Number(row.total_budget),
      createdAt: row.created_at,
    }));
  }

  /**
   * Returns total count of stored snapshots.
   */
  count(): number {
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(*) as count FROM audit_snapshots').get() as { count: number } | undefined;
    return Number(row?.count ?? 0);
  }
}

export const snapshotsRepository = new SnapshotsRepository();
