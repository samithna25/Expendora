import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

export function CustomButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  style,
  textStyle,
}) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  const isPrimary = variant === 'primary';
  const isGold = variant === 'gold';

  const bgColor = isGold
    ? themeColors.gold
    : isPrimary
      ? themeColors.foreground[colorScheme]
      : 'transparent';

  const txtColor = isGold
    ? themeColors.black
    : isPrimary
      ? themeColors.background[colorScheme]
      : themeColors.foreground[colorScheme];

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          height,
          borderWidth: isPrimary || isGold ? 0 : 1,
          borderColor: themeColors.border[colorScheme],
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={txtColor} />
      ) : (
        <>
          {Icon && <Icon size={16} color={txtColor} />}
          <Text style={[styles.text, { color: txtColor }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
