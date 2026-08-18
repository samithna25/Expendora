import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '../utils/constants';

/**
 * Token storage.
 * - Access token (short-lived, 24h): AsyncStorage, keeps existing behavior.
 * - Refresh token (long-lived, 20 days, grants persistent login): SecureStore
 *   (iOS Keychain / Android Keystore).
 */
export const tokenStorage = {
  async getAccessToken() {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  async setAccessToken(token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  async clearAccessToken() {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token) {
    await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, token);
  },

  async clearRefreshToken() {
    await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
  },

  async clearAll() {
    await Promise.all([this.clearAccessToken(), this.clearRefreshToken()]);
  },
};
