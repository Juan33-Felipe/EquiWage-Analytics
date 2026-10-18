import type { NextFunction, Request, Response } from 'express';
import type {
  ApiSuccessResponse,
  AuthSessionPayload,
  AuthStatusResponse,
} from '@equiwage/shared';
import { extractBearerToken } from '../middlewares/auth.middleware.js';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { authService } from '../services/auth.service.js';

export class AuthController {
  /**
   * POST /api/auth/login
   * Validates local HR analyst credentials and returns a signed JWT session.
   */
  public login(req: Request, res: Response, next: NextFunction): void {
    try {
      const { identifier, email, username, password, rememberMe } = req.body ?? {};
      const resolvedIdentifier = String(identifier || email || username || '').trim();

      const session = authService.login({
        identifier: resolvedIdentifier,
        password: String(password || ''),
        rememberMe: rememberMe !== false,
      });

      const response: ApiSuccessResponse<AuthSessionPayload> = {
        ok: true,
        data: session,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/session
   * Verifies the current Bearer token and returns the authenticated user profile.
   */
  public getSession(req: Request, res: Response, next: NextFunction): void {
    try {
      const token = extractBearerToken(req);
      const status = authService.verifySession(token);

      if (!status.authenticated || !status.user) {
        throw new AppError(
          'No active local session found. Please sign in to access EquiWage Analytics.',
          {
            statusCode: 401,
            errorKey: 'auth.unauthorized',
          }
        );
      }

      const response: ApiSuccessResponse<AuthStatusResponse> = {
        ok: true,
        data: status,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Revokes the current JWT token in SQLite and closes the local session.
   */
  public logout(req: Request, res: Response, next: NextFunction): void {
    try {
      const token = extractBearerToken(req);
      authService.logout(token);

      const response: ApiSuccessResponse<{ loggedOut: true }> = {
        ok: true,
        data: { loggedOut: true },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/register
   * Validates inputs, saves pending verification, and delivers 4-digit email code.
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body || {});
      const response: ApiSuccessResponse<typeof result> = {
        ok: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-code
   * Validates the 4-digit code, activates the account, and returns an authenticated JWT session.
   */
  public verifyCode(req: Request, res: Response, next: NextFunction): void {
    try {
      const { email, code } = req.body || {};
      const session = authService.verifyCode(email, code);
      const response: ApiSuccessResponse<AuthSessionPayload> = {
        ok: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/resend-code
   * Resends a fresh 4-digit verification code to the pending email.
   */
  public async resendCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body || {};
      const result = await authService.resendCode(email);
      const response: ApiSuccessResponse<typeof result> = {
        ok: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
