import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY } from '../utils/constants';
import { authService } from '../services/authService';
import { setOnSessionExpiredHandler } from '../services/api';

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
    AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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
        await authService.checkSession();
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
      // The user requested to always load the sign in page when the app opens.
      // Therefore, we do NOT restore the token, and we clear it.
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const login = async (_email, _password) => {
    const { user: userData, token: newToken } = await authService.login(_email, _password);
    setUser(userData);
    setToken(newToken);
    setSessionExpired(false);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
  };

  const register = async (_name, _email, _password) => {
    const { user: userData, token: newToken } = await authService.register(_name, _email, _password);
    setUser(userData);
    setToken(newToken);
    setSessionExpired(false);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setSessionExpired(false);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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
