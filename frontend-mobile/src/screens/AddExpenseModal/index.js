import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Check,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { expenseService } from '../../services/expenseService';
import { useExpenses } from '../../context/ExpenseContext';
import { formatDate } from '../../utils/formatters';

/**
 * AddExpenseModal
 *
 * Full-screen modal for creating OR editing an expense.
 * Route params:
 *   - expense (optional): existing expense object for edit mode
 *
 * On save: calls expenseService.create() or .update(), updates the
 * global ExpenseContext, then navigates back.
 */
export function AddExpenseModal({ navigation, route }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const { addExpense, updateExpense } = useExpenses();

  const existing = route?.params?.expense ?? null;
  const isEdit = !!existing;

  // ─── Form state ───────────────────────────────────────────────────────────
  const [merchant, setMerchant] = useState(existing?.merchant ?? '');
  const [amount, setAmount] = useState(existing?.amount != null ? String(existing.amount) : '');
  const [category, setCategory] = useState(existing?.category ?? 'other');
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState(existing?.method ?? 'Card');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const paymentMethods = ['Card', 'Cash', 'Apple Pay', 'Bank Transfer', 'Auto-debit'];

  // ─── Validation ───────────────────────────────────────────────────────────
  const isValid = merchant.trim().length > 0 && parseFloat(amount) > 0;

  // ─── Save handler ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Missing info', 'Please enter a merchant name and a valid amount.');
      return;
    }

    const payload = {
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      // Backend validates against Title Case: Food, Transport, Shopping, Bills, Entertainment, Other
      category: category.charAt(0).toUpperCase() + category.slice(1),
      date,
      method,
      notes: notes.trim(),
    };

    setSaving(true);
    try {
      if (isEdit) {
        const expenseId = existing.id ?? existing._id;
        const response = await expenseService.update(expenseId, payload);
        const updated = response?.data ?? { ...existing, ...payload };
        updateExpense({ ...(updated), id: expenseId });
      } else {
        const response = await expenseService.create(payload);
        const created = response?.data ?? { id: Date.now().toString(), ...payload };
        addExpense(created);
      }
      navigation?.goBack();
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: themeColors.background[colorScheme] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold }]}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
        >
          <X size={16} color={themeColors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isValid}
          style={[
            styles.headerBtn,
            {
              backgroundColor:
                isValid ? themeColors.gold : 'rgba(255,255,255,0.1)',
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={themeColors.black} />
          ) : (
            <Check size={16} color={isValid ? themeColors.black : 'rgba(255,255,255,0.4)'} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Amount — displayed prominently at top */}
        <View style={[styles.amountCard, { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] }]}>
          <Text style={[styles.amountLabel, { color: themeColors.muted[colorScheme] }]}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySign, { color: themeColors.gold }]}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={themeColors.muted[colorScheme]}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: themeColors.foreground[colorScheme] }]}
              autoFocus={!isEdit}
            />
          </View>
        </View>

        {/* Merchant */}
        <FieldRow
          icon={<DollarSign size={16} color={themeColors.gold} />}
          label="Merchant"
          isDark={isDark}
          colorScheme={colorScheme}
        >
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="e.g. Starbucks Coffee"
            placeholderTextColor={themeColors.muted[colorScheme]}
            style={[styles.fieldInput, { color: themeColors.foreground[colorScheme] }]}
          />
        </FieldRow>

        {/* Date */}
        <FieldRow
          icon={<Calendar size={16} color={themeColors.gold} />}
          label="Date"
          isDark={isDark}
          colorScheme={colorScheme}
        >
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={themeColors.muted[colorScheme]}
            style={[styles.fieldInput, { color: themeColors.foreground[colorScheme] }]}
          />
        </FieldRow>

        {/* Payment Method */}
        <FieldRow
          icon={<CreditCard size={16} color={themeColors.gold} />}
          label="Payment Method"
          isDark={isDark}
          colorScheme={colorScheme}
          noInput
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {paymentMethods.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethod(m)}
                style={[
                  styles.pill,
                  method === m
                    ? { backgroundColor: themeColors.gold }
                    : { backgroundColor: themeColors.secondary[colorScheme], borderColor: themeColors.border[colorScheme] },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: method === m ? themeColors.black : themeColors.muted[colorScheme] },
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FieldRow>

        {/* Category */}
        <View style={[styles.fieldCard, { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] }]}>
          <View style={styles.fieldLabelRow}>
            <Tag size={16} color={themeColors.gold} />
            <Text style={[styles.fieldLabel, { color: themeColors.muted[colorScheme] }]}>Category</Text>
          </View>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[
                  styles.catChip,
                  category === cat.id
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: themeColors.border[colorScheme],
                      },
                ]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    { color: category === cat.id ? themeColors.black : themeColors.foreground[colorScheme] },
                  ]}
                >
                  {cat.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <FieldRow
          icon={<FileText size={16} color={themeColors.gold} />}
          label="Notes (optional)"
          isDark={isDark}
          colorScheme={colorScheme}
        >
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note..."
            placeholderTextColor={themeColors.muted[colorScheme]}
            style={[styles.fieldInput, { color: themeColors.foreground[colorScheme] }]}
            multiline
          />
        </FieldRow>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isValid}
          style={[
            styles.saveBtn,
            { backgroundColor: isValid ? themeColors.gold : themeColors.secondary[colorScheme] },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={themeColors.black} />
          ) : (
            <>
              <Check size={18} color={isValid ? themeColors.black : themeColors.muted[colorScheme]} />
              <Text
                style={[styles.saveBtnText, { color: isValid ? themeColors.black : themeColors.muted[colorScheme] }]}
              >
                {isEdit ? 'Save Changes' : 'Add Expense'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Field Row helper ──────────────────────────────────────────────────────
function FieldRow({ icon, label, children, isDark, colorScheme, noInput }) {
  return (
    <View
      style={[
        styles.fieldCard,
        {
          backgroundColor: themeColors.card[colorScheme],
          borderColor: themeColors.border[colorScheme],
        },
      ]}
    >
      <View style={styles.fieldLabelRow}>
        {icon}
        <Text style={[styles.fieldLabel, { color: themeColors.muted[colorScheme] }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Form
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
    gap: 12,
  },

  // Amount card
  amountCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySign: {
    fontSize: 36,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 44,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
  },

  // Generic field card
  fieldCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fieldInput: {
    fontSize: 15,
    paddingVertical: 0,
  },

  // Pill row (payment method)
  pillRow: { flexDirection: 'row', marginTop: 4 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginRight: 8,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: '600' },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  catChipText: { fontSize: 12, fontWeight: '600' },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});
