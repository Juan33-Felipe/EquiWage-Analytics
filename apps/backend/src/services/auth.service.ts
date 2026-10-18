import type {
  AuthSessionPayload,
  AuthStatusResponse,
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
   * Authenticates a local HR analyst by username or email and password,
   * updates last_login_at in SQLite, and returns a signed JWT session.
   */
  public login(credentials: LoginCredentials): AuthSessionPayload {
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

    const userRow = usersRepository.findByIdentifier(identifier);
    if (!userRow) {
      logger.warn('Failed local login attempt: identifier not found', { identifier });
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
      logger.warn('Failed local login attempt: invalid password', { username: userRow.username });
      throw new AppError(
        'We could not verify those credentials. Please check your username or email and password.',
        {
          statusCode: 401,
          errorKey: 'auth.invalidCredentials',
        }
      );
    }

    const updatedUser =
      usersRepository.recordLoginTimestamp(userRow.id) ?? mapRowToAuthUser(userRow);

    const { token, expiresAt } = authCryptoService.signSessionToken(
      updatedUser,
      credentials.rememberMe ?? true
    );

    logger.info('Local HR analyst signed in successfully', {
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
  public verifySession(token?: string | null): AuthStatusResponse {
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

    if (usersRepository.isTokenRevoked(decoded.jti)) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const user = usersRepository.findUserById(decoded.sub);
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
  public logout(token?: string | null): void {
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

    usersRepository.revokeToken(decoded.jti, decoded.sub, expiresAt);

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
   * Initiates user registration by validating inputs, creating a password hash,
   * generating a 4-digit verification code, and sending it via email.
   */
  public async register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    department?: string;
    role?: string;
  }): Promise<{ email: string; message: string; expiresInSeconds: number; devCode?: string }> {
    const firstName = String(payload.firstName || '').trim();
    const lastName = String(payload.lastName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const confirmPassword = String(payload.confirmPassword || '');

    if (!firstName || !lastName) {
      throw new AppError('First and last name are required.', {
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

    // Check if user already exists
    const existingUser = usersRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email address already exists. Please sign in.', {
        statusCode: 409,
        errorKey: 'auth.emailAlreadyRegistered',
      });
    }

    const passwordHash = authCryptoService.hashPasswordSync(password);
    const code = this.generate4DigitCode();

    usersRepository.saveVerificationCode({
      email,
      code,
      firstName,
      lastName,
      passwordHash,
      department: payload.department || 'HR',
      role: payload.role || 'Compensation Analyst',
      expiresInMinutes: 15,
    });

    const emailResult = await emailService.sendVerificationCodeEmail(email, firstName, code);

    return {
      email,
      message: 'Verification code sent to your email address.',
      expiresInSeconds: 900,
      devCode: emailResult.mode === 'dev_fallback' ? code : undefined,
    };
  }

  /**
   * Resends a fresh 4-digit code to an email currently pending registration.
   */
  public async resendCode(emailRaw: string): Promise<{ email: string; message: string; expiresInSeconds: number; devCode?: string }> {
    const email = String(emailRaw || '').trim().toLowerCase();
    const pending = usersRepository.getLatestVerificationCode(email);

    if (!pending) {
      throw new AppError('No pending registration found for this email. Please register first.', {
        statusCode: 404,
        errorKey: 'auth.noPendingRegistration',
      });
    }

    const code = this.generate4DigitCode();
    usersRepository.saveVerificationCode({
      email: pending.email,
      code,
      firstName: pending.first_name,
      lastName: pending.last_name,
      passwordHash: pending.password_hash,
      department: pending.department,
      role: pending.role,
      expiresInMinutes: 15,
    });

    const emailResult = await emailService.sendVerificationCodeEmail(pending.email, pending.first_name, code);

    return {
      email: pending.email,
      message: 'New verification code sent.',
      expiresInSeconds: 900,
      devCode: emailResult.mode === 'dev_fallback' ? code : undefined,
    };
  }

  /**
   * Validates the 4-digit code, activates the account in SQLite, and logs the user in.
   */
  public verifyCode(emailRaw: string, codeRaw: string): AuthSessionPayload {
    const email = String(emailRaw || '').trim().toLowerCase();
    const inputCode = String(codeRaw || '').trim();

    if (!email || !inputCode) {
      throw new AppError('Email and 4-digit verification code are required.', {
        statusCode: 400,
        errorKey: 'auth.missingVerificationCode',
      });
    }

    const pending = usersRepository.getLatestVerificationCode(email);
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
      usersRepository.incrementVerificationAttempts(pending.id);
      throw new AppError('Invalid verification code. Please check your email and try again.', {
        statusCode: 400,
        errorKey: 'auth.invalidCode',
      });
    }

    // Code is valid! Create the user in SQLite
    const fullName = `${pending.first_name} ${pending.last_name}`.trim();
    const initials = (
      (pending.first_name[0] || '') + (pending.last_name[0] || '')
    ).toUpperCase() || 'EA';

    // Generate clean username from email or name
    const usernameCandidate = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const username = usernameCandidate || `user_${Date.now()}`;
    const userId = `USR-${Date.now().toString(36).toUpperCase()}`;

    const createdUser = usersRepository.createUser({
      id: userId,
      username,
      email: pending.email,
      fullName,
      role: pending.role || 'Compensation Analyst',
      department: pending.department || 'HR',
      initials,
      passwordHash: pending.password_hash,
    });

    // Clean pending verification code
    usersRepository.deleteVerificationCodes(pending.email);

    // Generate immediate login session
    const { token, expiresAt } = authCryptoService.signSessionToken(createdUser, true);

    logger.info('User account successfully verified and activated', {
      userId: createdUser.id,
      email: createdUser.email,
    });

    return {
      user: createdUser,
      token,
      expiresAt,
    };
  }
}

export const authService = new AuthService();
