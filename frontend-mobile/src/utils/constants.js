import Constants from 'expo-constants';

export const APP_NAME = 'Expendora';
export const APP_VERSION = '1.0.0';
export const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:5000';

export const ONBOARDING_STORAGE_KEY = '@expendora_onboarding_done';
export const AUTH_TOKEN_KEY = '@expendora_auth_token';
export const THEME_STORAGE_KEY = '@expendora_theme';

export const CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Drinks', icon: 'UtensilsCrossed', color: '#FACC15' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: '#60A5FA' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#F472B6' },
  { id: 'bills', name: 'Bills', icon: 'Receipt', color: '#A78BFA' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Music', color: '#34D399' },
  { id: 'health', name: 'Health', icon: 'HeartPulse', color: '#FB7185' },
  { id: 'education', name: 'Education', icon: 'GraduationCap', color: '#FBBF24' },
  { id: 'other', name: 'Other', icon: 'Wallet', color: '#94A3B8' },
];

export const PERIOD_TABS = ['Weekly', 'Monthly', 'Yearly'];
