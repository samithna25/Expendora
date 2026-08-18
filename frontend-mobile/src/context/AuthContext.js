import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { setOnSessionExpiredHandler } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

const DEV_MODE = false;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const expireSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessionExpired(true);
    tokenStorage.clearAll();
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  useEffect(() => {
    setOnSessionExpiredHandler(expireSession);
  }, [expireSession]);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const isAuthenticated = !!token;

  useEffect(() => {
    if (!isAuthenticated || sessionExpired) return;

    const check = async () => {
      try {
        const { user: userData } = await authService.checkSession();
        if (userData) setUser(userData);
      } catch {
        // session expiry is already handled by the api client
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, sessionExpired, token]);

  const loadStoredAuth = async () => {
    try {
      // Restore the persisted session so the user goes straight to their
      // homepage after tapping the app icon. The access token is short-lived
      // (24h); if it expired, the api client silently refreshes it using the
      // 20-day refresh token stored in the device keychain.
      const storedToken = await tokenStorage.getAccessToken();
      if (!storedToken) return;

      setToken(storedToken);
      try {
        const { user: userData } = await authService.getProfile();
        setUser(userData);
      } catch {
        // If the session truly expired the api client already cleared the
        // tokens and triggered expireSession. Fall back to the login screen.
        const stillToken = await tokenStorage.getAccessToken();
        if (!stillToken) {
          setToken(null);
          setUser(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const login = async (_email, _password) => {
    const { user: userData, token: newToken, refreshToken } = await authService.login(_email, _password);
    setUser(userData);
    setToken(newToken);
    setSessionExpired(false);
    await tokenStorage.setAccessToken(newToken);
    await tokenStorage.setRefreshToken(refreshToken);
  };

  const register = async (_name, _email, _password) => {
    const { user: userData, token: newToken, refreshToken } = await authService.register(_name, _email, _password);
    setUser(userData);
    setToken(newToken);
    setSessionExpired(false);
    await tokenStorage.setAccessToken(newToken);
    await tokenStorage.setRefreshToken(refreshToken);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // best-effort: still clear the local session if the server call fails
    }
    setUser(null);
    setToken(null);
    setSessionExpired(false);
    await tokenStorage.clearAll();
  };

  const uploadProfilePicture = async (uri) => {
    const { user: userData } = await authService.uploadProfilePicture(uri);
    if (userData) {
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sessionExpired, clearSessionExpired, login, register, logout, uploadProfilePicture, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
