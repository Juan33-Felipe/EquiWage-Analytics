import express, { type Express } from 'express';
import cors from 'cors';
import { APP_NAME } from '@equiwage/shared';
import { envConfig } from './config/env.config.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware.js';
import { apiRouter } from './routes/index.js';

/**
 * Builds and configures the Express HTTP application with base middlewares,
 * routes, and centralized error handlers.
 */
export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || envConfig.corsOrigins.includes('*') || envConfig.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        // Allow any localhost/127.0.0.1 port in local desktop development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
          return;
        }
        // Allow any local network IP / device on Wi-Fi or LAN (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
          callback(null, true);
          return;
        }
        // In non-production environments, allow any device connecting to the server
        if (envConfig.nodeEnv !== 'production') {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLoggerMiddleware);

  // Root welcome route
  app.get('/', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: `${APP_NAME} Local Backend Server`,
      healthEndpoint: '/api/health',
      dbDiagnosticsEndpoint: '/api/health/db',
    });
  });

  // Mount API routes
  app.use('/api', apiRouter);

  // 404 & global error handling middlewares
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
