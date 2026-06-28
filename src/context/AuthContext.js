import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY } from '../utils/constants';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email, password) => {
    const { user: userData, token: newToken } = await authService.login(email, password);
    setUser(userData);
    setToken(newToken);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
  };

  const register = async (name, email, password) => {
    const { user: userData, token: newToken } = await authService.register(name, email, password);
    setUser(userData);
    setToken(newToken);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
