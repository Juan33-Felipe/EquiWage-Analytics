/**
 * Structured logger utility for the EquiWage Analytics Backend.
 */

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [INFO] ${message}${suffix}`);
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${suffix}`);
  },

  error(message: string, error?: unknown): void {
    const timestamp = new Date().toISOString();
    if (error instanceof Error) {
      console.error(`[${timestamp}] [ERROR] ${message} — ${error.message}`);
    } else if (error !== undefined) {
      console.error(`[${timestamp}] [ERROR] ${message}`, error);
    } else {
      console.error(`[${timestamp}] [ERROR] ${message}`);
    }
  },
};
