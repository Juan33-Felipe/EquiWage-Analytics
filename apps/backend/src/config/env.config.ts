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
  get ai() {
    const key = (process.env.AI_API_KEY || '').trim();
    return {
      provider: (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase(),
      apiKey: key,
      model: (process.env.AI_MODEL || 'gemini-2.5-flash').trim(),
      apiBaseUrl: (process.env.AI_API_BASE_URL || '').trim(),
      timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 12000,
      isConfigured: key.length > 0,
    };
  },
  auth: {
    jwtSecret: (process.env.JWT_SECRET || 'equiwage-local-vault-secret-key-2026').trim(),
    tokenExpiresInHours: Number(process.env.JWT_EXPIRES_IN_HOURS) || 24,
  },
  get email() {
    const sHost = (process.env.SMTP_HOST || '').trim();
    const sUser = (process.env.SMTP_USER || '').trim();
    const sPass = (process.env.SMTP_PASS || '').trim();
    return {
      host: sHost || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
      user: sUser,
      pass: sPass,
      from: process.env.SMTP_FROM || (sUser ? `EquiWage Analytics <${sUser}>` : 'EquiWage Analytics <noreply@equiwage.local>'),
      isConfigured: Boolean(sUser && sPass),
    };
  },
};
