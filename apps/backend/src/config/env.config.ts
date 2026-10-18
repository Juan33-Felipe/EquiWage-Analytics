import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');

dotenv.config({ path: path.resolve(BACKEND_ROOT, '.env') });

function resolveDatabasePath(rawPath?: string): string {
  if (!rawPath || rawPath.trim() === '') {
    return path.resolve(BACKEND_ROOT, 'data', 'equiwage.sqlite');
  }
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }
  return path.resolve(BACKEND_ROOT, rawPath);
}

export interface BackendEnvConfig {
  nodeEnv: string;
  host: string;
  port: number;
  corsOrigins: string[];
  sqliteDbPath: string;
  ai: {
    provider: string;
    apiKey: string;
    model: string;
    apiBaseUrl: string;
    timeoutMs: number;
    isConfigured: boolean;
  };
  auth: {
    jwtSecret: string;
    tokenExpiresInHours: number;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    isConfigured: boolean;
  };
}

const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173';
const aiApiKey = (process.env.AI_API_KEY || '').trim();
const smtpHost = (process.env.SMTP_HOST || '').trim();
const smtpUser = (process.env.SMTP_USER || '').trim();

export const envConfig: BackendEnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT) || 4000,
  corsOrigins: rawOrigins.split(',').map((origin) => origin.trim()).filter(Boolean),
  sqliteDbPath: resolveDatabasePath(process.env.SQLITE_DB_PATH),
  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase(),
    apiKey: aiApiKey,
    model: (process.env.AI_MODEL || 'gemini-2.5-flash').trim(),
    apiBaseUrl: (process.env.AI_API_BASE_URL || '').trim(),
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 12000,
    isConfigured: aiApiKey.length > 0,
  },
  auth: {
    jwtSecret: (process.env.JWT_SECRET || 'equiwage-local-vault-secret-key-2026').trim(),
    tokenExpiresInHours: Number(process.env.JWT_EXPIRES_IN_HOURS) || 24,
  },
  email: {
    host: smtpHost || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: smtpUser,
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'EquiWage Analytics <security@equiwage.local>',
    isConfigured: Boolean(smtpHost && smtpUser),
  },
};
