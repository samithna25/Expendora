import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';

export function LoadingSpinner({ message, inline }) {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, inline && styles.inline]}>
      <ActivityIndicator size={inline ? 'small' : 'large'} color={themeColors.gold} />
      {message && (
        <Text style={[styles.text, { color: isDark ? themeColors.white : themeColors.foreground.light }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  inline: {
    flex: 0,
    paddingVertical: 24,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
});
