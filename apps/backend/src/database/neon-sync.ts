import pg from 'pg';
import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.js';
import { getDatabase } from './sqlite.connection.js';

export const NEON_DEFAULT_URL = process.env.DATABASE_URL || '';

export async function syncLocalToNeon(connectionString?: string): Promise<void> {
  const dbUrl = connectionString || process.env.DATABASE_URL || envConfig.databaseUrl || NEON_DEFAULT_URL;
  logger.info('Connecting to Neon PostgreSQL for sync...', { url: dbUrl.replace(/:[^:@]+@/, ':***@') });

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const localDb = getDatabase();

    // 1. Sync Users
    const users = localDb.prepare('SELECT * FROM users').all() as any[];
    for (const u of users) {
      await client.query(
        `
        INSERT INTO users (
          id, username, email, full_name, role, department, location, phone, license, timezone, initials, password_hash, is_active, is_verified, last_login_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          location = EXCLUDED.location,
          phone = EXCLUDED.phone,
          license = EXCLUDED.license,
          timezone = EXCLUDED.timezone,
          initials = EXCLUDED.initials,
          password_hash = EXCLUDED.password_hash,
          is_active = EXCLUDED.is_active,
          is_verified = EXCLUDED.is_verified,
          last_login_at = EXCLUDED.last_login_at,
          updated_at = EXCLUDED.updated_at;
      `,
        [
          u.id,
          u.username,
          u.email,
          u.full_name,
          u.role || '',
          u.department || '',
          u.location || '',
          u.phone || '',
          u.license || '',
          u.timezone || '',
          u.initials,
          u.password_hash,
          u.is_active ?? 1,
          u.is_verified ?? 1,
          u.last_login_at,
          u.created_at,
          u.updated_at,
        ]
      );
    }
    logger.info(`Synced ${users.length} users to Neon PostgreSQL`);

    // 2. Sync Salary Bands
    const bands = localDb.prepare('SELECT * FROM salary_bands').all() as any[];
    for (const b of bands) {
      await client.query(
        `
        INSERT INTO salary_bands (level, min_salary, median_salary, max_salary, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (level) DO UPDATE SET
          min_salary = EXCLUDED.min_salary,
          median_salary = EXCLUDED.median_salary,
          max_salary = EXCLUDED.max_salary,
          updated_at = EXCLUDED.updated_at;
      `,
        [b.level, b.min_salary, b.median_salary, b.max_salary, b.updated_at]
      );
    }
    logger.info(`Synced ${bands.length} salary bands to Neon PostgreSQL`);

    // 3. Sync Simulation Settings
    const sim = localDb.prepare('SELECT * FROM simulation_settings WHERE id = 1').get() as any;
    if (sim) {
      await client.query(
        `
        INSERT INTO simulation_settings (
          id, target, rollout_quarters, departments_json, custom_adjustment_percent, inflation_percent, include_legal_compliance, updated_at
        ) VALUES (1, $1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          target = EXCLUDED.target,
          rollout_quarters = EXCLUDED.rollout_quarters,
          departments_json = EXCLUDED.departments_json,
          custom_adjustment_percent = EXCLUDED.custom_adjustment_percent,
          inflation_percent = EXCLUDED.inflation_percent,
          include_legal_compliance = EXCLUDED.include_legal_compliance,
          updated_at = EXCLUDED.updated_at;
      `,
        [
          sim.target,
          sim.rollout_quarters,
          sim.departments_json,
          sim.custom_adjustment_percent,
          sim.inflation_percent,
          sim.include_legal_compliance,
          sim.updated_at,
        ]
      );
    }

    // 4. Sync Employees
    const emps = localDb.prepare('SELECT * FROM employees').all() as any[];
    for (const e of emps) {
      await client.query(
        `
        INSERT INTO employees (id, name, role, department, level, current_salary, user_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          level = EXCLUDED.level,
          current_salary = EXCLUDED.current_salary,
          user_id = EXCLUDED.user_id,
          updated_at = EXCLUDED.updated_at;
      `,
        [
          e.id,
          e.name,
          e.role,
          e.department,
          e.level,
          e.current_salary,
          e.user_id,
          e.created_at,
          e.updated_at,
        ]
      );
    }
    logger.info(`Synced ${emps.length} employees to Neon PostgreSQL`);

    logger.info('Neon PostgreSQL database successfully synchronized with all local data!');
  } finally {
    await client.end();
  }
}

// Execute sync when run as entry script
syncLocalToNeon()
  .then(() => {
    logger.info('Neon sync script completed.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('Neon sync script failed', { error: String(err) });
    process.exit(1);
  });

