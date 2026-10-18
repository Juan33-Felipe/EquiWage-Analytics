import type { AuthUser } from '@equiwage/shared';
import { getDatabase } from '../database/sqlite.connection.js';
import { mapRowToAuthUser, type UserDbRow, type VerificationCodeDbRow } from '../models/db.models.js';

export class UsersRepository {
  /**
   * Finds an active local user record by either username or email (case-insensitive).
   */
  public findByIdentifier(identifier: string): UserDbRow | null {
    const clean = (identifier || '').trim();
    if (!clean) {
      return null;
    }

    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT *
        FROM users
        WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))
          AND is_active = 1
        LIMIT 1
      `)
      .get(clean, clean) as UserDbRow | undefined;

    return row ?? null;
  }

  /**
   * Finds an active local user by ID and returns the safe AuthUser representation.
   */
  public findUserById(id: string): AuthUser | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1')
      .get(id) as UserDbRow | undefined;

    return row ? mapRowToAuthUser(row) : null;
  }

  /**
   * Updates the last_login_at timestamp for a user after successful authentication.
   */
  public recordLoginTimestamp(userId: string): AuthUser | null {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET last_login_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, userId);

    return this.findUserById(userId);
  }

  /**
   * Records a revoked JWT token ID (jti) on logout and prunes expired tokens.
   */
  public revokeToken(jti: string, userId: string, expiresAt: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Prune already expired tokens to keep SQLite clean
    db.prepare('DELETE FROM revoked_tokens WHERE expires_at < ?').run(now);

    db.prepare(`
      INSERT INTO revoked_tokens (jti, user_id, expires_at, revoked_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(jti) DO UPDATE SET
        revoked_at = excluded.revoked_at
    `).run(jti, userId, expiresAt, now);
  }

  /**
   * Checks whether a JWT token ID (jti) has been revoked.
   */
  public isTokenRevoked(jti: string): boolean {
    if (!jti) {
      return false;
    }
    const db = getDatabase();
    const row = db
      .prepare('SELECT jti FROM revoked_tokens WHERE jti = ? LIMIT 1')
      .get(jti) as { jti: string } | undefined;

    return Boolean(row);
  }
  /**
   * Finds a user record by email (case-insensitive) regardless of active state.
   */
  public findByEmail(email: string): UserDbRow | null {
    const clean = (email || '').trim();
    if (!clean) return null;

    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1')
      .get(clean) as UserDbRow | undefined;

    return row ?? null;
  }

  /**
   * Saves a temporary 4-digit verification code with registration data.
   */
  public saveVerificationCode(data: {
    email: string;
    code: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    department?: string;
    role?: string;
    expiresInMinutes?: number;
  }): void {
    const db = getDatabase();
    const now = new Date();
    const minutes = data.expiresInMinutes || 15;
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
    const createdAt = now.toISOString();

    // Clean any prior pending verification requests for this email
    db.prepare('DELETE FROM verification_codes WHERE LOWER(email) = LOWER(?)').run(data.email.trim());

    db.prepare(`
      INSERT INTO verification_codes (
        email, code, first_name, last_name, password_hash, department, role, attempts, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      data.email.trim(),
      data.code.trim(),
      data.firstName.trim(),
      data.lastName.trim(),
      data.passwordHash,
      data.department || 'HR',
      data.role || 'Compensation Analyst',
      expiresAt,
      createdAt
    );
  }

  /**
   * Retrieves the latest active verification code row for an email.
   */
  public getLatestVerificationCode(email: string): VerificationCodeDbRow | null {
    const clean = (email || '').trim();
    if (!clean) return null;

    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT *
        FROM verification_codes
        WHERE LOWER(email) = LOWER(?)
        ORDER BY id DESC
        LIMIT 1
      `)
      .get(clean) as VerificationCodeDbRow | undefined;

    return row ?? null;
  }

  /**
   * Increments failed attempts counter for a verification code.
   */
  public incrementVerificationAttempts(id: number): void {
    const db = getDatabase();
    db.prepare('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?').run(id);
  }

  /**
   * Deletes verification code rows for an email once verified.
   */
  public deleteVerificationCodes(email: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM verification_codes WHERE LOWER(email) = LOWER(?)').run((email || '').trim());
  }

  /**
   * Creates and activates a new user profile upon successful 4-digit code verification.
   */
  public createUser(data: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    initials: string;
    passwordHash: string;
  }): AuthUser {
    const db = getDatabase();
    const now = new Date().toISOString();

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

    const user = this.findUserById(data.id);
    if (!user) {
      throw new Error('Failed to create user record.');
    }
    return user;
  }
}

export const usersRepository = new UsersRepository();
