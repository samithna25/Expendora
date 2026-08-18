import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = '@expendora_settings';

// ─── Defaults ────────────────────────────────────────────────────────────────
export const CURRENCIES = [
  { code: 'LKR', symbol: 'Rs', label: 'Sri Lankan Rupee' },
  { code: 'USD', symbol: '$',  label: 'US Dollar' },
  { code: 'EUR', symbol: '€',  label: 'Euro' },
  { code: 'GBP', symbol: '£',  label: 'British Pound' },
  { code: 'INR', symbol: '₹',  label: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥',  label: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
];

export const FONT_SIZES = [
  { key: 'small',   label: 'Small',   scale: 0.85 },
  { key: 'medium',  label: 'Medium',  scale: 1.0  },
  { key: 'large',   label: 'Large',   scale: 1.15 },
  { key: 'xlarge',  label: 'X-Large', scale: 1.3  },
];

export const NUMBER_FORMATS = [
  { key: 'comma_dot',   label: '1,000.00',  separator: ',', decimal: '.' },
  { key: 'dot_comma',   label: '1.000,00',  separator: '.', decimal: ',' },
  { key: 'space_dot',   label: '1 000.00',  separator: ' ', decimal: '.' },
  { key: 'none_dot',    label: '1000.00',   separator: '',  decimal: '.' },
];

const DEFAULT_SETTINGS = {
  currency:      CURRENCIES[0],       // LKR
  fontSizeKey:   'medium',
  numberFormatKey: 'comma_dot',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [currency, setCurrencyState]       = useState(DEFAULT_SETTINGS.currency);
  const [fontSizeKey, setFontSizeKeyState] = useState(DEFAULT_SETTINGS.fontSizeKey);
  const [numberFormatKey, setNumberFormatKeyState] = useState(DEFAULT_SETTINGS.numberFormatKey);

  // ── Load from storage on mount ────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.currency)       setCurrencyState(saved.currency);
        if (saved.fontSizeKey)    setFontSizeKeyState(saved.fontSizeKey);
        if (saved.numberFormatKey) setNumberFormatKeyState(saved.numberFormatKey);
      } catch { /* ignore corrupt data */ }
    });
  }, []);

  // ── Save helpers ──────────────────────────────────────────────────────────
  const persist = async (patch) => {
    const current = { currency, fontSizeKey, numberFormatKey, ...patch };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(current));
  };

  const setCurrency = async (c) => {
    setCurrencyState(c);
    await persist({ currency: c });
  };

  const setFontSize = async (key) => {
    setFontSizeKeyState(key);
    await persist({ fontSizeKey: key });
  };

  const setNumberFormat = async (key) => {
    setNumberFormatKeyState(key);
    await persist({ numberFormatKey: key });
  };

  // ── Derived helpers ───────────────────────────────────────────────────────
  const fontSizeScale = FONT_SIZES.find((f) => f.key === fontSizeKey)?.scale ?? 1.0;
  const numberFormat  = NUMBER_FORMATS.find((f) => f.key === numberFormatKey) ?? NUMBER_FORMATS[0];

  /**
   * Format a numeric amount using the current currency + number format settings.
   * e.g. formatAmount(1234.5) → "Rs 1,234.50"
   */
  const formatAmount = (amount) => {
    const abs = Math.abs(amount);
    const [intPart, decPart] = abs.toFixed(2).split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, numberFormat.separator);
    const number = `${formattedInt}${numberFormat.decimal}${decPart}`;
    const sym = currency.symbol;
    const space = sym.length > 1 ? ' ' : '';
    return `${sym}${space}${number}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        currency, setCurrency,
        fontSizeKey, setFontSize, fontSizeScale,
        numberFormatKey, setNumberFormat, numberFormat,
        formatAmount,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
