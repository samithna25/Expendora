import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Icons from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { useSettings } from '../../context/SettingsContext';

/**
 * ExpenseCard
 *
 * Renders a single expense row. Supports optional onEdit / onDelete callbacks
 * that reveal icon action buttons when the card is long-pressed.
 *
 * Props:
 *  - transaction  {object}   Expense object (id, merchant, category, amount, date, method)
 *  - onPress      {function} Called when the card is tapped normally
 *  - onEdit       {function} Called when the edit button is tapped
 *  - onDelete     {function} Called when the delete button is tapped
 */
export function ExpenseCard({ transaction, onPress, onEdit, onDelete }) {
  const { isDark } = useTheme();
  const { formatAmount, fontSizeScale } = useSettings();
  const colorScheme = isDark ? 'dark' : 'light';
  const [actionsVisible, setActionsVisible] = useState(false);

  const category = EXPENSE_CATEGORIES.find((c) => c.id === transaction.category) || EXPENSE_CATEGORIES.find((c) => c.id === 'other');
  const IconComponent = Icons[category.icon] || Icons.Wallet;

  const hasActions = onEdit || onDelete;

  return (
    <TouchableOpacity
      onPress={() => {
        if (actionsVisible) {
          setActionsVisible(false);
        } else {
          onPress?.(transaction);
        }
      }}
      onLongPress={() => hasActions && setActionsVisible((v) => !v)}
      delayLongPress={350}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card[colorScheme],
          borderColor: actionsVisible
            ? themeColors.gold
            : themeColors.border[colorScheme],
        },
      ]}
    >
      {/* ── Category icon ── */}
      <View style={[styles.iconWrap, { backgroundColor: `${category.color}22` }]}>
        <IconComponent size={20} color={category.color} />
      </View>

      {/* ── Merchant + meta ── */}
      <View style={styles.info}>
        <Text
          style={[styles.merchant, { color: themeColors.foreground[colorScheme], fontSize: 14 * fontSizeScale }]}
          numberOfLines={1}
        >
          {transaction.merchant}
        </Text>
        <Text style={[styles.meta, { color: themeColors.muted[colorScheme], fontSize: 11 * fontSizeScale }]}>
          {transaction.date} · {transaction.method}
        </Text>
      </View>

      {/* ── Amount / actions ── */}
      {actionsVisible && hasActions ? (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => {
                setActionsVisible(false);
                onEdit(transaction);
              }}
              style={[styles.actionBtn, { backgroundColor: 'rgba(250,204,21,0.15)' }]}
            >
              <Icons.Pencil size={14} color={themeColors.gold} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => {
                setActionsVisible(false);
                onDelete(transaction);
              }}
              style={[styles.actionBtn, { backgroundColor: 'rgba(251,113,133,0.15)' }]}
            >
              <Icons.Trash2 size={14} color="#FB7185" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.right}>
          <Text style={[styles.amount, { color: themeColors.foreground[colorScheme], fontSize: 14 * fontSizeScale }]}>
            -{formatAmount(transaction.amount)}
          </Text>
          <Text style={[styles.category, { color: themeColors.muted[colorScheme], fontSize: 10 * fontSizeScale }]}>
            {category.name}
          </Text>
        </View>
      )}
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
  // Action buttons (revealed on long-press)
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
