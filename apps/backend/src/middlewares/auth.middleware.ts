import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '@equiwage/shared';
import { authService } from '../services/auth.service.js';
import { AppError } from './error-handler.middleware.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  authToken?: string;
}

/**
 * Extracts a Bearer token from the Authorization header or query parameter.
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const [scheme, token] = authHeader.trim().split(/\s+/);
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token.trim();
    }
  }

  const headerToken = req.headers['x-auth-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }

  return null;
}

/**
 * Authorization middleware that protects sensitive payroll, compensation bands,
 * audit engine, simulation, and report endpoints on the local server.
 */
export function requireAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError(
        'Your local session has expired or is not authenticated. Please sign in to continue.',
        {
          statusCode: 401,
          errorKey: 'auth.unauthorized',
        }
      );
    }

    const status = authService.verifySession(token);
    if (!status.authenticated || !status.user) {
      throw new AppError(
        'Your local session is invalid or has expired. Please sign in again.',
        {
          statusCode: 401,
          errorKey: 'auth.unauthorized',
        }
      );
    }

    req.user = status.user;
    req.authToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
