import type { SimulationParams } from '@equiwage/shared';
import { getDatabase } from '../database/sqlite.connection.js';
import {
  mapRowToSimulationParams,
  type AppMetadataDbRow,
  type SimulationSettingsDbRow,
} from '../models/db.models.js';

export class SettingsRepository {
  /**
   * Retrieves the active budget simulator settings from SQLite.
   */
  getSimulationParams(): SimulationParams {
    const db = getDatabase();
    const row = db
      .prepare('SELECT id, target, rollout_quarters, departments_json, custom_adjustment_percent, inflation_percent, include_legal_compliance, updated_at FROM simulation_settings WHERE id = 1')
      .get() as unknown as SimulationSettingsDbRow | undefined;
    return mapRowToSimulationParams(row);
  }

  /**
   * Updates the active budget simulator settings and returns the updated configuration.
   */
  updateSimulationParams(patch: Partial<SimulationParams>): SimulationParams {
    const db = getDatabase();
    const current = this.getSimulationParams();
    const merged: SimulationParams = {
      target: patch.target ?? current.target,
      rolloutQuarters:
        patch.rolloutQuarters !== undefined
          ? Math.min(Math.max(Number(patch.rolloutQuarters) || 1, 1), 4)
          : current.rolloutQuarters,
      departments: Array.isArray(patch.departments) ? patch.departments : current.departments,
      customAdjustmentPercent:
        patch.customAdjustmentPercent !== undefined
          ? Number(patch.customAdjustmentPercent) || 0
          : current.customAdjustmentPercent ?? 0,
      inflationPercent:
        patch.inflationPercent !== undefined
          ? Math.min(Math.max(Number(patch.inflationPercent) || 0, 0), 25)
          : current.inflationPercent ?? 0,
      includeLegalCompliance:
        patch.includeLegalCompliance !== undefined
          ? Boolean(patch.includeLegalCompliance)
          : current.includeLegalCompliance ?? true,
    };

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO simulation_settings (id, target, rollout_quarters, departments_json, custom_adjustment_percent, inflation_percent, include_legal_compliance, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        target = excluded.target,
        rollout_quarters = excluded.rollout_quarters,
        departments_json = excluded.departments_json,
        custom_adjustment_percent = excluded.custom_adjustment_percent,
        inflation_percent = excluded.inflation_percent,
        include_legal_compliance = excluded.include_legal_compliance,
        updated_at = excluded.updated_at
    `).run(
      merged.target,
      merged.rolloutQuarters,
      JSON.stringify(merged.departments),
      merged.customAdjustmentPercent ?? 0,
      merged.inflationPercent ?? 0,
      merged.includeLegalCompliance ? 1 : 0,
      now
    );

    return merged;
  }

  /**
   * Gets an application metadata value by key.
   */
  getMetadata(key: string): string | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT key, value, updated_at FROM app_metadata WHERE key = ?')
      .get(key) as unknown as AppMetadataDbRow | undefined;
    return row ? row.value : null;
  }

  /**
   * Sets an application metadata key-value pair.
   */
  setMetadata(key: string, value: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO app_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, value, now);
  }

  /**
   * Retrieves the active payroll dataset source name.
   */
  getPayrollSource(): string {
    return this.getMetadata('payroll_source') || 'Sample dataset';
  }

  /**
   * Updates the active payroll dataset source name.
   */
  setPayrollSource(sourceName: string): void {
    this.setMetadata('payroll_source', sourceName);
    this.setMetadata('last_import_at', new Date().toISOString());
  }
}

export const settingsRepository = new SettingsRepository();
