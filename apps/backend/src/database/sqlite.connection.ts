import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.js';

let dbInstance: DatabaseSync | null = null;

/**
 * Initializes or returns the singleton SQLite database connection.
 * Configured with WAL mode and memory temp store for sub-millisecond local queries (< 1s RNF-002).
 */
export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbFilePath = envConfig.sqliteDbPath;
  const dbDir = path.dirname(dbFilePath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(dbFilePath);

  // Configure SQLite pragmas for local embedded performance and data integrity
  dbInstance.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA temp_store = MEMORY;
  `);

  logger.info('SQLite database connection established', {
    path: dbFilePath,
    journalMode: 'WAL',
  });

  return dbInstance;
}

/**
 * Executes a synchronous callback inside an atomic SQLite transaction (BEGIN IMMEDIATE ... COMMIT/ROLLBACK).
 */
export function runInTransaction<T>(work: (db: DatabaseSync) => T): T {
  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = work(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // Ignore rollback error if transaction was already rolled back
    }
    throw error;
  }
}

/**
 * Cleanly closes the SQLite connection when shutting down the server.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    logger.info('SQLite database connection closed');
  }
}
