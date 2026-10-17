import type { SalaryBand } from '@equiwage/shared';
import { getDatabase, runInTransaction } from '../database/sqlite.connection.js';
import { mapRowToSalaryBand, type SalaryBandDbRow } from '../models/db.models.js';

export class BandsRepository {
  /**
   * Returns all market salary bands ordered by level ascending (L1 -> L8+).
   */
  findAll(): SalaryBand[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT level, min_salary, median_salary, max_salary, updated_at FROM salary_bands ORDER BY level ASC')
      .all() as unknown as SalaryBandDbRow[];
    return rows.map(mapRowToSalaryBand);
  }

  /**
   * Finds a single salary band by job level.
   */
  findByLevel(level: number): SalaryBand | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT level, min_salary, median_salary, max_salary, updated_at FROM salary_bands WHERE level = ?')
      .get(level) as unknown as SalaryBandDbRow | undefined;
    return row ? mapRowToSalaryBand(row) : null;
  }

  /**
   * Inserts or updates a single salary band by job level.
   */
  upsertBand(band: SalaryBand): SalaryBand {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO salary_bands (level, min_salary, median_salary, max_salary, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(level) DO UPDATE SET
        min_salary = excluded.min_salary,
        median_salary = excluded.median_salary,
        max_salary = excluded.max_salary,
        updated_at = excluded.updated_at
    `).run(band.level, band.min, band.median, band.max, now);

    return {
      level: band.level,
      min: band.min,
      median: band.median,
      max: band.max,
      spread: band.max - band.min,
      updatedAt: now,
    };
  }

  /**
   * Atomically replaces the entire salary bands matrix inside a transaction.
   */
  replaceAllBands(bands: SalaryBand[]): SalaryBand[] {
    return runInTransaction((db) => {
      const now = new Date().toISOString();
      db.exec('DELETE FROM salary_bands;');

      const stmt = db.prepare(`
        INSERT INTO salary_bands (level, min_salary, median_salary, max_salary, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      const sorted = [...bands].sort((a, b) => a.level - b.level);
      for (const band of sorted) {
        stmt.run(band.level, band.min, band.median, band.max, now);
      }

      return this.findAll();
    });
  }

  /**
   * Deletes a salary band by level.
   */
  deleteByLevel(level: number): boolean {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM salary_bands WHERE level = ?').run(level);
    return Number(res.changes) > 0;
  }

  /**
   * Returns total count of configured salary bands.
   */
  count(): number {
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(*) as count FROM salary_bands').get() as { count: number } | undefined;
    return Number(row?.count ?? 0);
  }
}

export const bandsRepository = new BandsRepository();
