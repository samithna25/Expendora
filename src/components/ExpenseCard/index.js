import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Icons from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export function ExpenseCard({ transaction, onPress, onEdit, onDelete }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const category = EXPENSE_CATEGORIES.find((c) => c.id === transaction.category) || EXPENSE_CATEGORIES[7];
  const IconComponent = Icons[category.icon] || Icons.Wallet;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card[colorScheme],
          borderColor: themeColors.border[colorScheme],
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${category.color}20}` }]}>
        <IconComponent size={20} color={category.color} />
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.merchant, { color: themeColors.foreground[colorScheme] }]}
          numberOfLines={1}
        >
          {transaction.merchant}
        </Text>
        <Text style={[styles.meta, { color: themeColors.muted[colorScheme] }]}>
          {transaction.date} · {transaction.method}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: themeColors.foreground[colorScheme] }]}>
          -{formatCurrency(transaction.amount)}
        </Text>
        <Text style={[styles.category, { color: themeColors.muted[colorScheme] }]}>
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  merchant: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  category: {
    fontSize: 10,
    marginTop: 1,
  },
});
