/**
 * Shared authentication and local session contracts for EquiWage Analytics.
 */

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  initials: string;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface LoginCredentials {
  /** Username or email address of the local HR analyst/admin */
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthSessionPayload {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: AuthUser | null;
  expiresAt?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department?: string;
  role?: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export interface RegistrationInitiatedResponse {
  email: string;
  message: string;
  expiresInSeconds: number;
  devCode?: string;
}
