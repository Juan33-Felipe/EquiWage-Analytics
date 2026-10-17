import { envConfig } from './config/env.config.js';
import { logger } from './config/logger.js';
import { closeDatabase, getDatabase } from './database/sqlite.connection.js';
import { runSchemaMigrations } from './database/schema.migrations.js';
import { ensureDatabaseSeeded } from './database/seed.runner.js';
import { createApp } from './app.js';

function bootstrap(): void {
  // 1. Initialize SQLite connection, schema migrations, and initial seed
  const db = getDatabase();
  runSchemaMigrations(db);
  const seedStatus = ensureDatabaseSeeded(db);

  logger.info('SQLite database ready', {
    seededOnStartup: seedStatus.seeded,
    employeesCount: seedStatus.employeeCount,
    bandsCount: seedStatus.bandCount,
  });

  // 2. Create Express app and start listening
  const app = createApp();
  const server = app.listen(envConfig.port, envConfig.host, () => {
    logger.info(`EquiWage Analytics Backend listening at http://${envConfig.host}:${envConfig.port}`, {
      healthcheck: `http://${envConfig.host}:${envConfig.port}/api/health`,
      dbDiagnostics: `http://${envConfig.host}:${envConfig.port}/api/health/db`,
    });
  });

  // 3. Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal} — shutting down backend server...`);
    server.close(() => {
      closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
