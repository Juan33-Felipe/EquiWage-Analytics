import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

/**
 * Logs incoming HTTP requests and their execution time in milliseconds.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startNs = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
}
