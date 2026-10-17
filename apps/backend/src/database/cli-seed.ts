import { closeDatabase, getDatabase } from './sqlite.connection.js';
import { runSchemaMigrations } from './schema.migrations.js';
import { ensureDatabaseSeeded, resetDatabaseToSeed } from './seed.runner.js';
import { logger } from '../config/logger.js';

const forceReset = process.argv.includes('--reset');

try {
  const db = getDatabase();
  runSchemaMigrations(db);

  if (forceReset) {
    const res = resetDatabaseToSeed();
    logger.info('Database forcefully reset to initial seed', res);
  } else {
    const res = ensureDatabaseSeeded(db);
    logger.info('Database seed check completed', res);
  }
} finally {
  closeDatabase();
}
