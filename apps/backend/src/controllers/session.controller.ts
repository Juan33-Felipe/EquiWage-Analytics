import type { Request, Response } from 'express';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { sessionService } from '../services/index.js';

export class SessionController {
  /**
   * GET /api/session/export
   * Exports the complete project state as a portable JSON session (RF-008).
   */
  exportSession = (req: Request, res: Response): void => {
    const sessionPayload = sessionService.exportProjectSession();
    const download = req.query.download === 'true';

    if (download) {
      const fileName = `equiwage-session-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(JSON.stringify(sessionPayload, null, 2));
      return;
    }

    res.status(200).json({
      ok: true,
      data: sessionPayload,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/session/restore
   * Restores a complete project state from a .json file upload or JSON body (RF-008).
   */
  restoreSession = (req: Request, res: Response): void => {
    let payload: unknown = req.body;

    if (req.file?.buffer) {
      try {
        payload = JSON.parse(req.file.buffer.toString('utf-8'));
      } catch {
        throw new AppError('The uploaded file is not a valid JSON project session.', {
          statusCode: 400,
          errorKey: 'settings.invalidSession',
        });
      }
    } else if (payload && typeof payload === 'object' && 'session' in (payload as Record<string, unknown>)) {
      payload = (payload as Record<string, unknown>).session;
    }

    const restoredAudit = sessionService.restoreProjectSession(payload);

    res.status(200).json({
      ok: true,
      data: restoredAudit,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/session/reset
   * Resets the SQLite database back to the initial realistic seed dataset.
   */
  resetSession = (_req: Request, res: Response): void => {
    const freshAudit = sessionService.resetProjectSession();
    res.status(200).json({
      ok: true,
      data: freshAudit,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /api/session/snapshots
   * Lists recent audit/scenario snapshots stored in SQLite.
   */
  listSnapshots = (req: Request, res: Response): void => {
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 20;
    const snapshots = sessionService.listSnapshots(Number.isFinite(limit) ? limit : 20);
    res.status(200).json({
      ok: true,
      data: snapshots,
      timestamp: new Date().toISOString(),
    });
  };
}

export const sessionController = new SessionController();
