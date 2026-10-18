import { API_ENDPOINTS } from '@equiwage/shared';
import { apiRequest } from './http.client';

/**
 * Frontend HTTP service for local authentication and session verification.
 */
export const authApi = {
  /**
   * Authenticates the HR analyst with email/username and password.
   */
  login({ identifier, password, rememberMe = true }) {
    return apiRequest(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: {
        identifier,
        password,
        rememberMe,
      },
    });
  },

  /**
   * Validates the active Bearer token against the local SQLite backend.
   */
  verifySession() {
    return apiRequest(API_ENDPOINTS.AUTH_SESSION, {
      method: 'GET',
    });
  },

  /**
   * Logs out and revokes the current JWT token on the local backend.
   */
  logout() {
    return apiRequest(API_ENDPOINTS.AUTH_LOGOUT, {
      method: 'POST',
    });
  },

  /**
   * Registers a new HR analyst profile and requests a 4-digit email verification code.
   */
  register({ firstName, lastName, email, password, confirmPassword, department, role }) {
    return apiRequest(API_ENDPOINTS.AUTH_REGISTER, {
      method: 'POST',
      body: {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        department,
        role,
      },
    });
  },

  /**
   * Validates the 4-digit code and activates the account.
   */
  verifyCode({ email, code }) {
    return apiRequest(API_ENDPOINTS.AUTH_VERIFY_CODE, {
      method: 'POST',
      body: {
        email,
        code,
      },
    });
  },

  /**
   * Resends a fresh 4-digit code to the pending email.
   */
  resendCode(email) {
    return apiRequest(API_ENDPOINTS.AUTH_RESEND_CODE, {
      method: 'POST',
      body: {
        email,
      },
    });
  },
};
