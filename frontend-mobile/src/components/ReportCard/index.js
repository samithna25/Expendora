import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

export function ReportCard({ title, subtitle, children, onPress, insight }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card[colorScheme],
          borderColor: insight
            ? 'rgba(250,204,21,0.3)'
            : themeColors.border[colorScheme],
        },
      ]}
    >
      <View style={styles.header}>
        {insight ? (
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Sparkles size={14} color={themeColors.black} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightLabel, { color: themeColors.gold }]}>
                {title}
              </Text>
              <Text
                style={[styles.insightText, { color: themeColors.foreground[colorScheme] }]}
              >
                {insight}
              </Text>
            </View>
          </View>
        ) : (
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
        )}
        {onPress && (
          <TouchableOpacity onPress={onPress} style={styles.action}>
            <Text style={[styles.actionText, { color: themeColors.gold }]}>Details</Text>
            <ChevronRight size={12} color={themeColors.gold} />
          </TouchableOpacity>
        )}
      </View>
      {!insight && children}
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
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: themeColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
