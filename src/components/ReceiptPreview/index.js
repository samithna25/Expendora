import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { X, Sparkles, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

const items = [
  { name: 'Oat Milk Latte', price: 5.5 },
  { name: 'Avocado Toast', price: 9.95 },
  { name: 'Sparkling Water', price: 3.0 },
];
const subtotal = items.reduce((s, i) => s + i.price, 0);
const tax = +(subtotal * 0.08).toFixed(2);
const total = +(subtotal + tax).toFixed(2);

export function ReceiptPreview({ onClose, onSave }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <X size={16} color={themeColors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Preview</Text>
          <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
            <Text style={[styles.badgeText, { color: themeColors.success }]}>DETECTED</Text>
          </View>
        </View>
        <View style={styles.confidence}>
          <Sparkles size={14} color={themeColors.gold} />
          <Text style={styles.confidenceText}>Auto-classified · 98% confidence</Text>
        </View>
      </View>

      <View style={[styles.receiptCard, { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] }]}>
        <View style={styles.merchantRow}>
          <View>
            <Text style={[styles.metaLabel, { color: themeColors.muted[colorScheme] }]}>Merchant</Text>
            <Text style={[styles.merchantName, { color: themeColors.foreground[colorScheme] }]}>Blue Bottle Coffee</Text>
            <Text style={[styles.merchantDate, { color: themeColors.muted[colorScheme] }]}>Mar 27, 2026 · 09:14 AM</Text>
          </View>
          <View style={[styles.categoryTag, { backgroundColor: themeColors.gold }]}>
            <Text style={styles.categoryTagText}>Food</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {items.map((it) => (
          <View key={it.name} style={styles.itemRow}>
            <Text style={[styles.itemName, { color: themeColors.muted[colorScheme] }]}>{it.name}</Text>
            <Text style={[styles.itemPrice, { color: themeColors.foreground[colorScheme] }]}>${it.price.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: themeColors.muted[colorScheme] }]}>Subtotal</Text>
          <Text style={[styles.totalValue, { color: themeColors.foreground[colorScheme] }]}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: themeColors.muted[colorScheme] }]}>Tax</Text>
          <Text style={[styles.totalValue, { color: themeColors.foreground[colorScheme] }]}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={[styles.grandLabel, { color: themeColors.foreground[colorScheme] }]}>Total</Text>
          <Text style={[styles.grandValue, { color: themeColors.gold }]}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onClose} style={[styles.actionBtn, { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] }]}>
          <Text style={[styles.actionText, { color: themeColors.foreground[colorScheme] }]}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSave} style={[styles.actionBtn, styles.saveBtn, { backgroundColor: themeColors.foreground[colorScheme] }]}>
          <Check size={16} color={themeColors.background[colorScheme]} />
          <Text style={[styles.actionText, { color: themeColors.background[colorScheme] }]}>Save Expense</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    padding: 8,
    borderRadius: borderRadius.full,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.white,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  confidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  receiptCard: {
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    padding: 20,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    paddingBottom: 12,
  },
  metaLabel: {
    fontSize: 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  merchantDate: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.xl,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeColors.black,
  },
  divider: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 13,
  },
  totalValue: {
    fontSize: 13,
  },
  grandTotal: {
    marginTop: 8,
  },
  grandLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  grandValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
  },
  saveBtn: {
    borderWidth: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
