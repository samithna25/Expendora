import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/formatters';

export function BudgetCard({ budget }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const pct = Math.min(100, (budget.spent / budget.limit) * 100);
  const isOver = pct >= 95;

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
      <View style={styles.top}>
        <View>
          <Text style={[styles.name, { color: themeColors.foreground[colorScheme] }]}>
            {budget.name}
          </Text>
          <Text style={[styles.spent, { color: themeColors.muted[colorScheme] }]}>
            {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)}
          </Text>
        </View>
        <Text
          style={[
            styles.pct,
            { color: isOver ? themeColors.warning : budget.color },
          ]}
        >
          {pct.toFixed(0)}%
        </Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: themeColors.secondary[colorScheme] }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct}%`,
              backgroundColor: isOver ? themeColors.warning : budget.color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: 12,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  spent: {
    fontSize: 11,
    marginTop: 1,
  },
  pct: {
    fontSize: 14,
    fontWeight: '700',
  },
  barBg: {
    marginTop: 8,
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
