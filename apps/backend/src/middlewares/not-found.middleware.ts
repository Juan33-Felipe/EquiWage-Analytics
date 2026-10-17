import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@equiwage/shared';

/**
 * Returns a clean 404 JSON response for unknown API routes.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  const response: ApiErrorResponse = {
    ok: false,
    errorKey: 'error.routeNotFound',
    message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on the EquiWage Analytics server.`,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
}
