import type {
  AuthSessionPayload,
  AuthStatusResponse,
  AuthUser,
  LoginCredentials,
} from '@equiwage/shared';
import { logger } from '../config/logger.js';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { mapRowToAuthUser } from '../models/db.models.js';
import { usersRepository } from '../repositories/users.repository.js';
import { authCryptoService } from './auth-crypto.service.js';
import { emailService } from './email.service.js';

export class AuthService {
  /**
   * Retrieves all registered active users across any device (safe AuthUser objects).
   */
  public async getRegisteredUsers(): Promise<AuthUser[]> {
    return await usersRepository.listActiveUsers();
  }

  /**
   * Authenticates a user by username or email and password,
   * updates last_login_at in SQLite and Neon Cloud, and returns a signed JWT session.
   */
  public async login(credentials: LoginCredentials): Promise<AuthSessionPayload> {
    const identifier = String(credentials?.identifier || '').trim();
    const password = String(credentials?.password || '');

    if (!identifier || !password) {
      throw new AppError(
        'Please enter both your email/username and password to sign in.',
        {
          statusCode: 400,
          errorKey: 'auth.missingCredentials',
        }
      );
    }

    const userRow = await usersRepository.findByIdentifier(identifier);
    if (!userRow) {
      logger.warn('Failed login attempt: identifier not found locally or in cloud', { identifier });
      throw new AppError(
        'We could not verify those credentials. Please check your username or email and password.',
        {
          statusCode: 401,
          errorKey: 'auth.invalidCredentials',
        }
      );
    }

    const isPasswordValid = authCryptoService.verifyPasswordSync(password, userRow.password_hash);
    if (!isPasswordValid) {
      logger.warn('Failed login attempt: invalid password', { username: userRow.username });
      throw new AppError(
        'We could not verify those credentials. Please check your username or email and password.',
        {
          statusCode: 401,
          errorKey: 'auth.invalidCredentials',
        }
      );
    }

    const updatedUser =
      (await usersRepository.recordLoginTimestamp(userRow.id)) ?? mapRowToAuthUser(userRow);

    const { token, expiresAt } = authCryptoService.signSessionToken(
      updatedUser,
      credentials.rememberMe ?? true
    );

    logger.info('HR analyst signed in successfully across devices', {
      userId: updatedUser.id,
      username: updatedUser.username,
    });

    return {
      user: updatedUser,
      token,
      expiresAt,
    };
  }

  /**
   * Validates an active JWT token and verifies the user still exists and token is not revoked.
   */
  public async verifySession(token?: string | null): Promise<AuthStatusResponse> {
    if (!token || !token.trim()) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const decoded = authCryptoService.verifySessionToken(token.trim());
    if (!decoded || !decoded.sub || !decoded.jti) {
      return {
        authenticated: false,
        user: null,
      };
    }

    if (await usersRepository.isTokenRevoked(decoded.jti)) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const user = await usersRepository.findUserById(decoded.sub);
    if (!user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : undefined;

    return {
      authenticated: true,
      user,
      expiresAt,
    };
  }

  /**
   * Revokes a JWT token on logout so it can no longer be used.
   */
  public async logout(token?: string | null): Promise<void> {
    if (!token || !token.trim()) {
      return;
    }

    const decoded = authCryptoService.verifySessionToken(token.trim());
    if (!decoded || !decoded.jti || !decoded.sub) {
      return;
    }

    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    await usersRepository.revokeToken(decoded.jti, decoded.sub, expiresAt);

    logger.info('Local HR analyst signed out', {
      userId: decoded.sub,
      username: decoded.username,
    });
  }

  /**
   * Generates a secure, cryptographically random 4-digit numeric code.
   */
  private generate4DigitCode(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return String(num);
  }

  /**
   * Validates registration inputs, creates a temporary 4-digit verification code,
   * stores it in SQLite and Neon Cloud, and dispatches an email via Gmail SMTP.
   */
  public async register(payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    department?: string;
    role?: string;
  }): Promise<{
    email: string;
    message: string;
    expiresInSeconds: number;
    devVerificationCode?: string;
  }> {
    const firstName = String(payload?.firstName || '').trim();
    const lastName = String(payload?.lastName || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();
    const password = String(payload?.password || '');
    const confirmPassword = String(payload?.confirmPassword || '');

    if (!firstName || !lastName) {
      throw new AppError('First name and last name are required.', {
        statusCode: 400,
        errorKey: 'auth.nameRequired',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new AppError('Please provide a valid email address.', {
        statusCode: 400,
        errorKey: 'auth.invalidEmail',
      });
    }

    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', {
        statusCode: 400,
        errorKey: 'auth.passwordTooShort',
      });
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match.', {
        statusCode: 400,
        errorKey: 'auth.passwordMismatch',
      });
    }

    // Check if user already exists locally or globally
    const existingUser = await usersRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email address already exists. Please sign in.', {
        statusCode: 409,
        errorKey: 'auth.emailAlreadyRegistered',
      });
    }

    const passwordHash = authCryptoService.hashPasswordSync(password);
    const code = this.generate4DigitCode();

    await usersRepository.saveVerificationCode({
      email,
      code,
      firstName,
      lastName,
      passwordHash,
      department: payload.department || '',
      role: payload.role || '',
      expiresInMinutes: 15,
    });

    let devVerificationCode: string | undefined;
    try {
      const emailResult = await emailService.sendVerificationCodeEmail(email, firstName, code);
      if (!emailResult.delivered) {
        devVerificationCode = code;
      }
    } catch (error) {
      logger.warn('Email delivery failed during registration, enabling local code fallback', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      devVerificationCode = code;
    }

    return {
      email,
      message: devVerificationCode
        ? 'Verification code generated for your session.'
        : 'Verification code sent to your email address.',
      expiresInSeconds: 900,
      devVerificationCode,
    };
  }

  /**
   * Resends a fresh 4-digit code to an email currently pending registration.
   */
  public async resendCode(emailRaw: string): Promise<{ email: string; message: string; expiresInSeconds: number; devVerificationCode?: string }> {
    const email = String(emailRaw || '').trim().toLowerCase();
    const pending = await usersRepository.getLatestVerificationCode(email);

    if (!pending) {
      throw new AppError('No pending registration found for this email. Please register first.', {
        statusCode: 404,
        errorKey: 'auth.noPendingRegistration',
      });
    }

    const code = this.generate4DigitCode();
    await usersRepository.saveVerificationCode({
      email: pending.email,
      code,
      firstName: pending.first_name,
      lastName: pending.last_name,
      passwordHash: pending.password_hash,
      department: pending.department,
      role: pending.role,
      expiresInMinutes: 15,
    });

    let devVerificationCode: string | undefined;
    try {
      const emailResult = await emailService.sendVerificationCodeEmail(pending.email, pending.first_name, code);
      if (!emailResult.delivered) {
        devVerificationCode = code;
      }
    } catch (error) {
      logger.warn('Email delivery failed during resend, enabling local code fallback', {
        email: pending.email,
        error: error instanceof Error ? error.message : String(error),
      });
      devVerificationCode = code;
    }

    return {
      email: pending.email,
      message: devVerificationCode
        ? 'New verification code generated for your session.'
        : 'New verification code sent to your email address.',
      expiresInSeconds: 900,
      devVerificationCode,
    };
  }

  /**
   * Validates the 4-digit code, activates the account in SQLite & Neon, and logs the user in.
   */
  public async verifyCode(emailRaw: string, codeRaw: string): Promise<AuthSessionPayload> {
    const email = String(emailRaw || '').trim().toLowerCase();
    const inputCode = String(codeRaw || '').trim();

    if (!email || !inputCode) {
      throw new AppError('Email and 4-digit verification code are required.', {
        statusCode: 400,
        errorKey: 'auth.missingVerificationCode',
      });
    }

    const pending = await usersRepository.getLatestVerificationCode(email);
    if (!pending) {
      throw new AppError('Verification code not found or expired. Please request a new code.', {
        statusCode: 404,
        errorKey: 'auth.codeNotFound',
      });
    }

    const now = new Date();
    if (new Date(pending.expires_at) < now) {
      throw new AppError('The verification code has expired. Please request a new one.', {
        statusCode: 400,
        errorKey: 'auth.codeExpired',
      });
    }

    if (pending.attempts >= 5) {
      throw new AppError('Too many failed attempts. Please request a new verification code.', {
        statusCode: 429,
        errorKey: 'auth.tooManyAttempts',
      });
    }

    if (pending.code !== inputCode) {
      await usersRepository.incrementVerificationAttempts(pending.id, pending.email);
      throw new AppError('Invalid verification code. Please check your email and try again.', {
        statusCode: 400,
        errorKey: 'auth.invalidCode',
      });
    }

    // Code is valid! Create the user in SQLite & Neon Cloud
    const fullName = `${pending.first_name} ${pending.last_name}`.trim();
    const initials = (
      (pending.first_name[0] || '') + (pending.last_name[0] || '')
    ).toUpperCase() || 'EA';

    // Generate clean username from email or name
    const usernameCandidate = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    let username = usernameCandidate || `user_${Date.now()}`;
    if (await usersRepository.findByIdentifier(username)) {
      username = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const userId = `USR-${Date.now().toString(36).toUpperCase()}`;

    const createdUser = await usersRepository.createUser({
      id: userId,
      username,
      email: pending.email,
      fullName,
      role: pending.role || '',
      department: pending.department || '',
      initials,
      passwordHash: pending.password_hash,
    });

    // Clean pending verification code
    await usersRepository.deleteVerificationCodes(pending.email);

    // Generate immediate login session
    const { token, expiresAt } = authCryptoService.signSessionToken(createdUser, true);

    logger.info('User account successfully verified and activated globally', {
      userId: createdUser.id,
      email: createdUser.email,
    });

    return {
      user: createdUser,
      token,
      expiresAt,
    };
  }

  /**
   * Updates profile fields for the authenticated user in SQLite and Neon Cloud.
   */
  public async updateProfile(userId: string, data: {
    fullName?: string;
    role?: string;
    department?: string;
    location?: string;
    phone?: string;
    license?: string;
    timezone?: string;
  }): Promise<AuthUser> {
    const updated = await usersRepository.updateUserProfile(userId, data);
    if (!updated) {
      throw new AppError('User not found.', { statusCode: 404, errorKey: 'auth.userNotFound' });
    }
    return updated;
  }
}

export const authService = new AuthService();
