import type { AuthUser } from '@equiwage/shared';
import { logger } from '../config/logger.js';
import { queryNeon } from '../database/neon.connection.js';
import { getDatabase } from '../database/sqlite.connection.js';
import {
  mapRowToAuthUser,
  type UserDbRow,
  type VerificationCodeDbRow,
} from '../models/db.models.js';

export class UsersRepository {
  /**
   * Caches a user row retrieved from Neon into the local SQLite store
   * so that subsequent reads and offline scenarios work instantly (< 1s RNF-002).
   */
  private cacheUserLocally(row: UserDbRow): void {
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO users (
          id, username, email, full_name, role, department, location, phone, license, timezone, initials, password_hash, is_active, is_verified, last_login_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username = excluded.username,
          email = excluded.email,
          full_name = excluded.full_name,
          role = excluded.role,
          department = excluded.department,
          location = excluded.location,
          phone = excluded.phone,
          license = excluded.license,
          timezone = excluded.timezone,
          initials = excluded.initials,
          password_hash = excluded.password_hash,
          is_active = excluded.is_active,
          is_verified = excluded.is_verified,
          last_login_at = excluded.last_login_at,
          updated_at = excluded.updated_at
      `).run(
        row.id,
        row.username,
        row.email,
        row.full_name,
        row.role || '',
        row.department || '',
        row.location || '',
        row.phone || '',
        row.license || '',
        row.timezone || '',
        row.initials,
        row.password_hash,
        row.is_active ?? 1,
        row.is_verified ?? 1,
        row.last_login_at || null,
        row.created_at,
        row.updated_at
      );
    } catch {
      // Local cache error non-fatal
    }
  }

  /**
   * Finds an active user record by either username or email (case-insensitive).
   * Checks local SQLite first, then checks Neon Cloud Database for global accounts.
   */
  public async findByIdentifier(identifier: string): Promise<UserDbRow | null> {
    const clean = (identifier || '').trim();
    if (!clean) {
      return null;
    }

    // 1. Check local SQLite store
    const db = getDatabase();
    const localRow = db
      .prepare(`
        SELECT *
        FROM users
        WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))
          AND is_active = 1
        LIMIT 1
      `)
      .get(clean, clean) as UserDbRow | undefined;

    if (localRow) {
      return localRow;
    }

    // 2. Query Neon Cloud Database for accounts created on other devices
    const neonRes = await queryNeon<UserDbRow>(
      `
      SELECT *
      FROM users
      WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1))
        AND is_active = 1
      LIMIT 1;
    `,
      [clean]
    );

    if (neonRes && neonRes.rows.length > 0) {
      const neonUser = neonRes.rows[0];
      this.cacheUserLocally(neonUser);
      logger.info('User resolved from global Neon database and cached locally', {
        userId: neonUser.id,
        username: neonUser.username,
      });
      return neonUser;
    }

    return null;
  }

  /**
   * Finds an active user by ID and returns the safe AuthUser representation.
   */
  public async findUserById(id: string): Promise<AuthUser | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    const db = getDatabase();
    const localRow = db
      .prepare('SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1')
      .get(cleanId) as UserDbRow | undefined;

    if (localRow) {
      return mapRowToAuthUser(localRow);
    }

    const neonRes = await queryNeon<UserDbRow>(
      'SELECT * FROM users WHERE id = $1 AND is_active = 1 LIMIT 1;',
      [cleanId]
    );

    if (neonRes && neonRes.rows.length > 0) {
      const row = neonRes.rows[0];
      this.cacheUserLocally(row);
      return mapRowToAuthUser(row);
    }

    return null;
  }

  /**
   * Retrieves all active registered users across all devices.
   */
  public async listActiveUsers(): Promise<AuthUser[]> {
    // 1. Attempt global Neon fetch first
    const neonRes = await queryNeon<UserDbRow>(
      'SELECT * FROM users WHERE is_active = 1 ORDER BY created_at ASC;'
    );

    if (neonRes && neonRes.rows.length > 0) {
      for (const row of neonRes.rows) {
        this.cacheUserLocally(row);
      }
      return neonRes.rows.map(mapRowToAuthUser);
    }

    // 2. Fallback to local SQLite store
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY created_at ASC')
      .all() as unknown as UserDbRow[];

    return rows.map(mapRowToAuthUser);
  }

  /**
   * Updates the last_login_at timestamp for a user after successful authentication.
   */
  public async recordLoginTimestamp(userId: string): Promise<AuthUser | null> {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET last_login_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, userId);

    // Update Neon Cloud asynchronously
    await queryNeon(
      `
      UPDATE users
      SET last_login_at = $1, updated_at = $2
      WHERE id = $3;
    `,
      [now, now, userId]
    );

    return this.findUserById(userId);
  }

  /**
   * Records a revoked JWT token ID (jti) on logout and prunes expired tokens.
   */
  public async revokeToken(jti: string, userId: string, expiresAt: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare('DELETE FROM revoked_tokens WHERE expires_at < ?').run(now);
    db.prepare(`
      INSERT INTO revoked_tokens (jti, user_id, expires_at, revoked_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(jti) DO UPDATE SET
        revoked_at = excluded.revoked_at
    `).run(jti, userId, expiresAt, now);

    // Replicate to Neon Cloud
    await queryNeon('DELETE FROM revoked_tokens WHERE expires_at < $1;', [now]);
    await queryNeon(
      `
      INSERT INTO revoked_tokens (jti, user_id, expires_at, revoked_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(jti) DO UPDATE SET revoked_at = EXCLUDED.revoked_at;
    `,
      [jti, userId, expiresAt, now]
    );
  }

  /**
   * Checks whether a JWT token ID (jti) has been revoked locally or globally.
   */
  public async isTokenRevoked(jti: string): Promise<boolean> {
    if (!jti) {
      return false;
    }

    const db = getDatabase();
    const localRow = db
      .prepare('SELECT jti FROM revoked_tokens WHERE jti = ? LIMIT 1')
      .get(jti) as { jti: string } | undefined;

    if (localRow) {
      return true;
    }

    const neonRes = await queryNeon<{ jti: string }>(
      'SELECT jti FROM revoked_tokens WHERE jti = $1 LIMIT 1;',
      [jti]
    );

    return Boolean(neonRes && neonRes.rows.length > 0);
  }

  /**
   * Finds a user record by email (case-insensitive) regardless of active state.
   */
  public async findByEmail(email: string): Promise<UserDbRow | null> {
    const clean = (email || '').trim();
    if (!clean) return null;

    const db = getDatabase();
    const localRow = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1')
      .get(clean) as UserDbRow | undefined;

    if (localRow) {
      return localRow;
    }

    const neonRes = await queryNeon<UserDbRow>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
      [clean]
    );

    if (neonRes && neonRes.rows.length > 0) {
      const row = neonRes.rows[0];
      this.cacheUserLocally(row);
      return row;
    }

    return null;
  }

  /**
   * Saves a temporary 4-digit verification code with registration data.
   */
  public async saveVerificationCode(data: {
    email: string;
    code: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    department?: string;
    role?: string;
    expiresInMinutes?: number;
  }): Promise<void> {
    const db = getDatabase();
    const now = new Date();
    const minutes = data.expiresInMinutes || 15;
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
    const createdAt = now.toISOString();

    const cleanEmail = data.email.trim();

    // 1. Save locally
    db.prepare('DELETE FROM verification_codes WHERE LOWER(email) = LOWER(?)').run(cleanEmail);
    db.prepare(`
      INSERT INTO verification_codes (
        email, code, first_name, last_name, password_hash, department, role, attempts, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      cleanEmail,
      data.code.trim(),
      data.firstName.trim(),
      data.lastName.trim(),
      data.passwordHash,
      data.department || 'HR',
      data.role || 'Compensation Analyst',
      expiresAt,
      createdAt
    );

    // 2. Save globally to Neon Cloud
    await queryNeon('DELETE FROM verification_codes WHERE LOWER(email) = LOWER($1);', [cleanEmail]);
    await queryNeon(
      `
      INSERT INTO verification_codes (
        email, code, first_name, last_name, password_hash, department, role, attempts, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9);
    `,
      [
        cleanEmail,
        data.code.trim(),
        data.firstName.trim(),
        data.lastName.trim(),
        data.passwordHash,
        data.department || 'HR',
        data.role || 'Compensation Analyst',
        expiresAt,
        createdAt,
      ]
    );
  }

  /**
   * Retrieves the latest active verification code row for an email.
   */
  public async getLatestVerificationCode(email: string): Promise<VerificationCodeDbRow | null> {
    const clean = (email || '').trim();
    if (!clean) return null;

    const db = getDatabase();
    const localRow = db
      .prepare(`
        SELECT *
        FROM verification_codes
        WHERE LOWER(email) = LOWER(?)
        ORDER BY id DESC
        LIMIT 1
      `)
      .get(clean) as VerificationCodeDbRow | undefined;

    if (localRow) {
      return localRow;
    }

    const neonRes = await queryNeon<VerificationCodeDbRow>(
      `
      SELECT *
      FROM verification_codes
      WHERE LOWER(email) = LOWER($1)
      ORDER BY id DESC
      LIMIT 1;
    `,
      [clean]
    );

    if (neonRes && neonRes.rows.length > 0) {
      return neonRes.rows[0];
    }

    return null;
  }

  /**
   * Increments failed attempts counter for a verification code.
   */
  public async incrementVerificationAttempts(id: number, email?: string): Promise<void> {
    const db = getDatabase();
    db.prepare('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?').run(id);

    if (email) {
      await queryNeon('UPDATE verification_codes SET attempts = attempts + 1 WHERE LOWER(email) = LOWER($1);', [email.trim()]);
    }
  }

  /**
   * Deletes verification code rows for an email once verified.
   */
  public async deleteVerificationCodes(email: string): Promise<void> {
    const clean = (email || '').trim();
    const db = getDatabase();
    db.prepare('DELETE FROM verification_codes WHERE LOWER(email) = LOWER(?)').run(clean);

    await queryNeon('DELETE FROM verification_codes WHERE LOWER(email) = LOWER($1);', [clean]);
  }

  /**
   * Creates and activates a new user profile upon successful 4-digit code verification.
   */
  public async createUser(data: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    initials: string;
    passwordHash: string;
  }): Promise<AuthUser> {
    const db = getDatabase();
    const now = new Date().toISOString();

    // 1. Insert into local SQLite
    db.prepare(`
      INSERT INTO users (
        id, username, email, full_name, role, department, initials, password_hash, is_active, is_verified, last_login_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
    `).run(
      data.id,
      data.username,
      data.email,
      data.fullName,
      data.role,
      data.department,
      data.initials,
      data.passwordHash,
      now,
      now,
      now
    );

    // 2. Insert into Neon Cloud Database globally
    await queryNeon(
      `
      INSERT INTO users (
        id, username, email, full_name, role, department, initials, password_hash, is_active, is_verified, last_login_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        initials = EXCLUDED.initials,
        password_hash = EXCLUDED.password_hash,
        is_active = EXCLUDED.is_active,
        is_verified = EXCLUDED.is_verified,
        last_login_at = EXCLUDED.last_login_at,
        updated_at = EXCLUDED.updated_at;
    `,
      [
        data.id,
        data.username,
        data.email,
        data.fullName,
        data.role,
        data.department,
        data.initials,
        data.passwordHash,
        now,
        now,
        now,
      ]
    );

    const user = await this.findUserById(data.id);
    if (!user) {
      throw new Error('Failed to create user record.');
    }
    return user;
  }

  /**
   * Updates an existing user's profile information.
   */
  public async updateUserProfile(
    userId: string,
    data: {
      fullName?: string;
      role?: string;
      department?: string;
      location?: string;
      phone?: string;
      license?: string;
      timezone?: string;
    }
  ): Promise<AuthUser | null> {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const fullName = data.fullName !== undefined ? data.fullName : user.fullName;
    const role = data.role !== undefined ? data.role : user.role;
    const department = data.department !== undefined ? data.department : user.department;
    const location = data.location !== undefined ? data.location : user.location || '';
    const phone = data.phone !== undefined ? data.phone : user.phone || '';
    const license = data.license !== undefined ? data.license : user.license || '';
    const timezone = data.timezone !== undefined ? data.timezone : user.timezone || '';

    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] || 'E';
    const second = parts[1]?.[0] || parts[0]?.[1] || 'A';
    const initials = (first + second).toUpperCase();
    const now = new Date().toISOString();

    const db = getDatabase();
    db.prepare(`
      UPDATE users
      SET full_name = ?, role = ?, department = ?, location = ?, phone = ?, license = ?, timezone = ?, initials = ?, updated_at = ?
      WHERE id = ?
    `).run(fullName, role, department, location, phone, license, timezone, initials, now, userId);

    await queryNeon(
      `
      UPDATE users
      SET full_name = $1, role = $2, department = $3, location = $4, phone = $5, license = $6, timezone = $7, initials = $8, updated_at = $9
      WHERE id = $10;
    `,
      [fullName, role, department, location, phone, license, timezone, initials, now, userId]
    );

    return this.findUserById(userId);
  }
}

export const usersRepository = new UsersRepository();
