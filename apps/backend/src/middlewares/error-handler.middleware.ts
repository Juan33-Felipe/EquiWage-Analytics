import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorResponse } from '@equiwage/shared';
import { logger } from '../config/logger.js';

export interface AppErrorOptions {
  statusCode?: number;
  errorKey?: string;
  missingColumns?: string[];
  details?: Array<{
    row?: number;
    field?: string;
    issue: string;
  }>;
}

/**
 * Structured domain/application error that translates cleanly into user-friendly
 * HR validation responses (RNF-003).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorKey: string;
  public readonly missingColumns?: string[];
  public readonly details?: Array<{ row?: number; field?: string; issue: string }>;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 400;
    this.errorKey = options.errorKey ?? 'error.badRequest';
    this.missingColumns = options.missingColumns;
    this.details = options.details;
  }
}

/**
 * Centralized Express error-handling middleware.
 * Ensures user-friendly error messages without leaking raw stack traces.
 */
export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    // For 5xx server-level errors, ensure a general, safe message is sent to clients without technical details
    const safeMessage =
      err.statusCode >= 500
        ? 'An error occurred while processing your request. Please try again later.'
        : err.message;

    const response: ApiErrorResponse = {
      ok: false,
      errorKey: err.errorKey,
      message: safeMessage,
      missingColumns: err.missingColumns,
      details: err.details,
      timestamp: new Date().toISOString(),
    };
    res.status(err.statusCode).json(response);
    return;
  }

  logger.error('Unhandled backend error', err);

  const response: ApiErrorResponse = {
    ok: false,
    errorKey: 'error.internalServer',
    message: 'An unexpected error occurred while processing your request. Please try again later.',
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
}
