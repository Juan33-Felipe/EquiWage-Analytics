import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '@equiwage/shared';
import { envConfig } from '../config/env.config.js';

const BCRYPT_SALT_ROUNDS = 10;

export interface JwtTokenPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export class AuthCryptoService {
  /**
   * Hashes a plain-text password using bcryptjs (10 salt rounds).
   * Never stores passwords in plain text.
   */
  public hashPasswordSync(plainPassword: string): string {
    return bcrypt.hashSync(plainPassword, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compares a plain-text password against a stored bcrypt hash.
   */
  public verifyPasswordSync(plainPassword: string, passwordHash: string): boolean {
    if (!plainPassword || !passwordHash) {
      return false;
    }
    return bcrypt.compareSync(plainPassword, passwordHash);
  }

  /**
   * Generates a signed JSON Web Token (JWT) for the authenticated local HR analyst.
   */
  public signSessionToken(user: AuthUser, rememberMe = true): {
    token: string;
    jti: string;
    expiresAt: string;
  } {
    const jti = crypto.randomUUID();
    const hours = rememberMe
      ? Math.max(envConfig.auth.tokenExpiresInHours, 24)
      : Math.min(envConfig.auth.tokenExpiresInHours, 12);
    const expiresInSeconds = Math.round(hours * 3600);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const payload: JwtTokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      jti,
    };

    const token = jwt.sign(payload, envConfig.auth.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: expiresInSeconds,
    });

    return {
      token,
      jti,
      expiresAt,
    };
  }

  /**
   * Verifies and decodes a JWT token using the configured local secret key.
   */
  public verifySessionToken(token: string): JwtTokenPayload | null {
    try {
      const decoded = jwt.verify(token, envConfig.auth.jwtSecret, {
        algorithms: ['HS256'],
      });
      if (!decoded || typeof decoded === 'string') {
        return null;
      }
      return decoded as JwtTokenPayload;
    } catch {
      return null;
    }
  }
}

export const authCryptoService = new AuthCryptoService();
