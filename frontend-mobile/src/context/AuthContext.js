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

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        const userData = await authService.getProfile(storedToken);
        setUser(userData);
      }
    } catch {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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

  return (
    <AuthContext.Provider value={{ user, token, loading, sessionExpired, clearSessionExpired, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
