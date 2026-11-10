import pg from 'pg';
import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.js';

export const DEFAULT_NEON_DATABASE_URL = process.env.DATABASE_URL || '';

let poolInstance: pg.Pool | null = null;
let isInitialized = false;

export function getNeonPool(): pg.Pool | null {
  const connectionString = envConfig.databaseUrl || process.env.DATABASE_URL || DEFAULT_NEON_DATABASE_URL;

  if (!connectionString || connectionString.trim() === '') {
    return null;
  }

  if (poolInstance) {
    return poolInstance;
  }

  try {
    poolInstance = new pg.Pool({
      connectionString: connectionString.trim(),
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    poolInstance.on('error', (err) => {
      logger.warn('Unexpected Neon PostgreSQL pool error', { error: err.message });
    });

    logger.info('Neon Cloud PostgreSQL connection pool created', {
      url: connectionString.replace(/:[^:@]+@/, ':***@'),
    });

    return poolInstance;
  } catch (error) {
    logger.warn('Failed to initialize Neon PostgreSQL connection pool', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Executes a query against Neon PostgreSQL with automatic error handling.
 * Returns null if Neon is unreachable or encounters an error, allowing safe fallback.
 */
export async function queryNeon<T extends pg.QueryResultRow = any>(
  sql: string,
  params: any[] = []
): Promise<pg.QueryResult<T> | null> {
  const pool = getNeonPool();
  if (!pool) {
    return null;
  }

  try {
    const res = await pool.query<T>(sql, params);
    return res;
  } catch (error) {
    logger.warn('Neon query execution failed, falling back to local SQLite store', {
      error: error instanceof Error ? error.message : String(error),
      sqlSnippet: sql.slice(0, 80),
    });
    return null;
  }
}

/**
 * Ensures required authentication schema exists in Neon Cloud Database.
 */
export async function initNeonAuthSchema(): Promise<void> {
  if (isInitialized) return;

  const pool = getNeonPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT '',
        department TEXT NOT NULL DEFAULT '',
        location TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        license TEXT DEFAULT '',
        timezone TEXT DEFAULT '',
        initials TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_verified INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

      CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT '',
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_codes(LOWER(email));
    `);

    isInitialized = true;
    logger.info('Neon Cloud PostgreSQL authentication schema verified');
  } catch (error) {
    logger.warn('Could not initialize Neon Cloud PostgreSQL auth schema', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
