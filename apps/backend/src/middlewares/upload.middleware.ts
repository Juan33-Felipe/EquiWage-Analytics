import path from 'node:path';
import multer from 'multer';
import { AppError } from './error-handler.middleware.js';

const ALLOWED_EXTENSIONS = new Set(['.csv', '.xlsx', '.xls', '.json']);

/**
 * In-memory Multer middleware for receiving .CSV, .XLSX, and .JSON uploads locally.
 */
export const uploadFileMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max file size
  },
  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      callback(
        new AppError(
          `Unsupported file format '${ext || 'unknown'}'. Please upload a .CSV, .XLSX, or .JSON file.`,
          {
            statusCode: 400,
            errorKey: 'error.readError',
          }
        )
      );
      return;
    }
    callback(null, true);
  },
});
