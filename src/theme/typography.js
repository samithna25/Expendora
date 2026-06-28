import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  fontFamily,
  display: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  tab: {
    fontSize: 10,
    fontWeight: '600',
  },
};
