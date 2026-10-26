import type { CountryMinimumWageReference, LegalComplianceConfig } from '@equiwage/shared';
import { DEFAULT_LEGAL_COMPLIANCE_CONFIG } from '@equiwage/shared';
import { getDatabase } from '../database/sqlite.connection.js';
import {
  mapRowToLegalComplianceConfig,
  mapRowToReferenceCountry,
  type LegalComplianceSettingsDbRow,
  type ReferenceCountryDbRow,
} from '../models/db.models.js';

export class ComplianceRepository {
  /**
   * Retrieves the active Legal Minimum Wage Compliance configuration from SQLite.
   */
  getLegalComplianceConfig(): LegalComplianceConfig {
    const db = getDatabase();
    const row = db
      .prepare('SELECT id, enabled, country_code, country_name, minimum_wage, currency, notes, updated_at FROM legal_compliance_settings WHERE id = 1')
      .get() as unknown as LegalComplianceSettingsDbRow | undefined;
    return mapRowToLegalComplianceConfig(row);
  }

  /**
   * Updates the legal minimum wage compliance configuration.
   */
  updateLegalComplianceConfig(patch: Partial<LegalComplianceConfig>): LegalComplianceConfig {
    const db = getDatabase();
    const current = this.getLegalComplianceConfig();
    const merged: LegalComplianceConfig = {
      enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : current.enabled,
      countryCode: patch.countryCode ?? current.countryCode,
      countryName: patch.countryName ?? current.countryName,
      minimumWage:
        patch.minimumWage !== undefined && Number.isFinite(patch.minimumWage)
          ? Math.max(0, Number(patch.minimumWage))
          : current.minimumWage,
      currency: patch.currency ?? current.currency ?? 'USD',
      notes: patch.notes !== undefined ? patch.notes : current.notes,
    };

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO legal_compliance_settings (
        id, enabled, country_code, country_name, minimum_wage, currency, notes, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        enabled = excluded.enabled,
        country_code = excluded.country_code,
        country_name = excluded.country_name,
        minimum_wage = excluded.minimum_wage,
        currency = excluded.currency,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(
      merged.enabled ? 1 : 0,
      merged.countryCode,
      merged.countryName,
      merged.minimumWage,
      merged.currency || 'USD',
      merged.notes ?? null,
      now
    );

    return {
      ...merged,
      updatedAt: now,
    };
  }

  /**
   * Returns all preloaded and customized reference countries with statutory minimum wages.
   */
  getReferenceCountries(): CountryMinimumWageReference[] {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT code, name, currency, default_minimum_wage, monthly_equivalent, region, notes, updated_at
        FROM reference_countries
        ORDER BY region ASC, name ASC
      `)
      .all() as unknown as ReferenceCountryDbRow[];

    return rows.map(mapRowToReferenceCountry);
  }

  /**
   * Retrieves a single reference country by ISO alpha-2 code.
   */
  getReferenceCountryByCode(code: string): CountryMinimumWageReference | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT code, name, currency, default_minimum_wage, monthly_equivalent, region, notes, updated_at FROM reference_countries WHERE UPPER(code) = UPPER(?)')
      .get(code) as unknown as ReferenceCountryDbRow | undefined;

    return row ? mapRowToReferenceCountry(row) : null;
  }

  /**
   * Upserts or customizes a reference country entry.
   */
  upsertReferenceCountry(country: CountryMinimumWageReference): CountryMinimumWageReference {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO reference_countries (
        code, name, currency, default_minimum_wage, monthly_equivalent, region, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        currency = excluded.currency,
        default_minimum_wage = excluded.default_minimum_wage,
        monthly_equivalent = excluded.monthly_equivalent,
        region = excluded.region,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(
      country.code.toUpperCase(),
      country.name,
      country.currency,
      Math.max(0, country.defaultMinimumWage),
      country.monthlyEquivalent ?? null,
      country.region,
      country.notes ?? null,
      now
    );

    return country;
  }
}

export const complianceRepository = new ComplianceRepository();
