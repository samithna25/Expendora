import Constants from 'expo-constants';

export const APP_NAME = 'Expendora';
export const APP_VERSION = '1.0.0';
export const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:5000';

export const ONBOARDING_STORAGE_KEY = '@expendora_onboarding_done';
export const AUTH_TOKEN_KEY = '@expendora_auth_token';
export const AUTH_REFRESH_TOKEN_KEY = 'expendora_refresh_token';
export const THEME_STORAGE_KEY = '@expendora_theme';
export const BUDGET_STORAGE_KEY = '@expendora_monthly_budget';

export const CURRENCY = 'LKR';
export const CURRENCY_SYMBOL = 'Rs ';

export const EXPENSE_CATEGORIES = [
  { id: 'food',          name: 'Food & Drinks',  icon: 'UtensilsCrossed', color: '#FACC15' },  // Pure Gold
  { id: 'transport',     name: 'Transport',       icon: 'Car',             color: '#D4A017' },  // Dark Gold
  { id: 'shopping',      name: 'Shopping',        icon: 'ShoppingBag',     color: '#C8973A' },  // Amber Gold
  { id: 'bills',         name: 'Bills',           icon: 'Receipt',         color: '#92703A' },  // Bronze
  { id: 'entertainment', name: 'Entertainment',   icon: 'Music',           color: '#B8860B' },  // Goldenrod
  { id: 'health',        name: 'Health',          icon: 'HeartPulse',      color: '#E8C547' },  // Bright Gold
  { id: 'education',     name: 'Education',       icon: 'GraduationCap',   color: '#6B5320' },  // Deep Bronze
  { id: 'phone',         name: 'Phone',           icon: 'Smartphone',      color: '#A08040' },
  { id: 'beauty',        name: 'Beauty',          icon: 'Scissors',        color: '#D6B475' },
  { id: 'sports',        name: 'Sports',          icon: 'Dumbbell',        color: '#8C7A4A' },
  { id: 'travel',        name: 'Travel',          icon: 'Plane',           color: '#C7A76D' },
  { id: 'pets',          name: 'Pets',            icon: 'Dog',             color: '#B59458' },
  { id: 'donations',     name: 'Donations',       icon: 'Heart',           color: '#F0D49C' },
  { id: 'other',         name: 'Other',           icon: 'Wallet',          color: '#4A3720' },  // Dark Umber
];

export const PERIOD_TABS = ['Weekly', 'Monthly', 'Yearly'];
