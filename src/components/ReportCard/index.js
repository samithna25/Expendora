import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

export function ReportCard({ title, subtitle, children, onPress }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card[colorScheme],
          borderColor: themeColors.border[colorScheme],
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: themeColors.foreground[colorScheme] }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.sub, { color: themeColors.muted[colorScheme] }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {onPress && (
          <TouchableOpacity onPress={onPress} style={styles.action}>
            <Text style={[styles.actionText, { color: themeColors.gold }]}>Details</Text>
            <ChevronRight size={12} color={themeColors.gold} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
