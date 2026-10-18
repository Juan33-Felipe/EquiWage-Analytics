import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/auth.api';
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearStoredAuthSession,
  getStoredAuthToken,
  getStoredAuthUser,
  setStoredAuthSession,
} from '../services/http.client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredAuthUser());
  const [token, setToken] = useState(() => getStoredAuthToken());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  const clearSessionState = useCallback(() => {
    clearStoredAuthSession();
    setToken(null);
    setUser(null);
  }, []);

  // Verify existing token on application startup
  useEffect(() => {
    let active = true;
    const storedToken = getStoredAuthToken();

    if (!storedToken) {
      setIsInitializing(false);
      return () => {
        active = false;
      };
    }

    authApi
      .verifySession()
      .then((status) => {
        if (!active) return;
        if (status?.authenticated && status?.user) {
          setUser(status.user);
          setToken(storedToken);
          setStoredAuthSession({
            token: storedToken,
            user: status.user,
            rememberMe: Boolean(localStorage.getItem('equiwage_auth_token')),
          });
        } else {
          clearSessionState();
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error?.status === 401) {
          clearSessionState();
        }
      })
      .finally(() => {
        if (active) {
          setIsInitializing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [clearSessionState]);

  // Automatically clear session if any protected API call returns 401 Unauthorized
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSessionState();
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [clearSessionState]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const login = useCallback(async ({ identifier, password, rememberMe = true }) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const session = await authApi.login({
        identifier: String(identifier || '').trim(),
        password: String(password || ''),
        rememberMe,
      });

      setStoredAuthSession({
        token: session.token,
        user: session.user,
        rememberMe,
      });

      setToken(session.token);
      setUser(session.user);
      return { ok: true, user: session.user };
    } catch (error) {
      const errorKey = error?.errorKey || 'auth.invalidCredentials';
      const message =
        error?.message ||
        'We could not verify those credentials. Please check your username or email and password.';
      setAuthError({ errorKey, message });
      return { ok: false, errorKey, message };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await authApi.register(payload);
      return { ok: true, data: result };
    } catch (error) {
      const errorKey = error?.errorKey || 'auth.registrationFailed';
      const message = error?.message || 'Could not complete registration. Please check your data.';
      setAuthError({ errorKey, message });
      return { ok: false, errorKey, message };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const verifyCode = useCallback(async ({ email, code, rememberMe = true }) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const session = await authApi.verifyCode({ email, code });

      setStoredAuthSession({
        token: session.token,
        user: session.user,
        rememberMe,
      });

      setToken(session.token);
      setUser(session.user);
      return { ok: true, user: session.user };
    } catch (error) {
      const errorKey = error?.errorKey || 'auth.invalidCode';
      const message = error?.message || 'Invalid or expired verification code.';
      setAuthError({ errorKey, message });
      return { ok: false, errorKey, message };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const resendCode = useCallback(async (email) => {
    try {
      const result = await authApi.resendCode(email);
      return { ok: true, data: result };
    } catch (error) {
      const errorKey = error?.errorKey || 'auth.resendFailed';
      const message = error?.message || 'Failed to resend code.';
      return { ok: false, errorKey, message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network/401 errors during logout cleanup
    } finally {
      clearSessionState();
      setAuthError(null);
    }
  }, [clearSessionState]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isInitializing,
      isAuthenticating,
      authError,
      login,
      register,
      verifyCode,
      resendCode,
      logout,
      clearAuthError,
    }),
    [user, token, isInitializing, isAuthenticating, authError, login, register, verifyCode, resendCode, logout, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
