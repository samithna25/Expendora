import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { X, Sparkles, Check, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ReceiptPreview
 *
 * Displays the OCR-extracted receipt data returned from the backend.
 *
 * Props:
 *  - data       {object|null}  The `data` field from the /receipts/upload response.
 *                              Shape: { merchant_name, amount, currency, date, category, image_url }
 *  - onClose    {function}     Called when the user taps "Retake".
 *  - onSave     {function}     Called when the user taps "Save Expense".
 */
export function ReceiptPreview({ data, onClose, onSave }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const insets = useSafeAreaInsets();

  const merchantName = data?.merchant_name || 'Unknown Merchant';
  const amount       = data?.amount != null ? Number(data.amount).toFixed(2) : null;
  const currency     = data?.currency || 'LKR';  // Default to Sri Lankan Rupee
  const date         = data?.date || null;
  const category     = data?.category || 'Other';
  const imageUrl     = data?.image_url || null;

  const hasOcrData = data?.merchant_name || data?.amount || data?.date;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]}
      contentContainerStyle={{ paddingBottom: 40 + Math.max(insets.bottom, 16) }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold, paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <X size={16} color={themeColors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Preview</Text>
          <View style={[styles.badge, { backgroundColor: hasOcrData ? 'rgba(34,197,94,0.2)' : 'rgba(251,113,133,0.2)' }]}>
            <Text style={[styles.badgeText, { color: hasOcrData ? themeColors.success : '#FB7185' }]}>
              {hasOcrData ? 'DETECTED' : 'NO TEXT'}
            </Text>
          </View>
        </View>
        <View style={styles.confidence}>
          <Sparkles size={14} color={themeColors.gold} />
          <Text style={styles.confidenceText}>
            {hasOcrData ? `Auto-classified · ${category}` : 'OCR could not extract data from this image'}
          </Text>
        </View>
      </View>

      {/* ── Receipt image thumbnail ── */}
      {imageUrl && (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUrl }} style={styles.receiptImage} resizeMode="cover" />
        </View>
      )}

      {/* ── No OCR data warning ── */}
      {!hasOcrData && (
        <View style={[styles.warningCard, { backgroundColor: 'rgba(251,113,133,0.1)', borderColor: '#FB7185' }]}>
          <AlertCircle size={18} color="#FB7185" />
          <Text style={styles.warningText}>
            The OCR could not read text from this image. Try a clearer, well-lit photo of the receipt.
          </Text>
        </View>
      )}

      {/* ── Main receipt card ── */}
      <View style={[styles.receiptCard, { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] }]}>

        {/* Merchant + category row */}
        <View style={styles.merchantRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.metaLabel, { color: themeColors.muted[colorScheme] }]}>Merchant</Text>
            <Text style={[styles.merchantName, { color: themeColors.foreground[colorScheme] }]} numberOfLines={2}>
              {merchantName}
            </Text>
            {date && (
              <Text style={[styles.merchantDate, { color: themeColors.muted[colorScheme] }]}>
                {date}
              </Text>
            )}
          </View>
          <View style={[styles.categoryTag, { backgroundColor: themeColors.gold }]}>
            <Text style={styles.categoryTagText}>{category}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Amount row */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: themeColors.muted[colorScheme] }]}>Currency</Text>
          <Text style={[styles.totalValue, { color: themeColors.foreground[colorScheme] }]}>{currency}</Text>
        </View>

        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={[styles.grandLabel, { color: themeColors.foreground[colorScheme] }]}>Total</Text>
          <Text style={[styles.grandValue, { color: themeColors.gold }]}>
            {amount != null ? `${currency} ${amount}` : '—'}
          </Text>
        </View>
      </View>

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.actionBtn, { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] }]}
        >
          <Text style={[styles.actionText, { color: themeColors.foreground[colorScheme] }]}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          style={[styles.actionBtn, styles.saveBtn, { backgroundColor: themeColors.foreground[colorScheme] }]}
        >
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
    flexShrink: 1,
  },
  imageWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 160,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FB7185',
    lineHeight: 18,
  },
  receiptCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    padding: 20,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    alignSelf: 'flex-start',
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
