import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { Search, Plus, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { ExpenseCard } from '../../components/ExpenseCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { borderRadius } from '../../theme/spacing';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { expenseService } from '../../services/expenseService';
import { useExpenses } from '../../context/ExpenseContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ExpenseListScreen
 *
 * Shows all expenses from the backend via ExpenseContext.
 * Supports:
 *  - Search by merchant name
 *  - Filter by category chip
 *  - Pull-to-refresh
 *  - Delete with confirmation alert
 *  - Edit (navigates to AddExpenseModal pre-filled)
 */
export function ExpenseListScreen({ navigation }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  const { expenses, loading, error, refresh, removeExpense } = useExpenses();

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const insets = useSafeAreaInsets();

  // ─── Normalise expense → ExpenseCard shape ─────────────────────────────
  const normalise = (e) => ({
    id: e.id ?? e._id ?? String(Math.random()),
    merchant: e.merchant ?? e.merchant_name ?? 'Unknown',
    category: e.category ?? 'other',
    amount: Number(e.amount) || 0,
    date: formatDate(e.date ?? e.created_at),
    method: e.method ?? e.payment_method ?? '—',
    // preserve original for edit
    _raw: e,
  });

  const normalised = expenses.map(normalise);

  // ─── Filter ────────────────────────────────────────────────────────────
  const filtered = normalised.filter(
    (t) =>
      (selectedCat === 'all' || t.category === selectedCat) &&
      t.merchant.toLowerCase().includes(query.toLowerCase()),
  );

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  // ─── Pull-to-refresh ────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // ─── Delete ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (expense) => {
      Alert.alert(
        'Delete Expense',
        `Remove "${expense.merchant}" (${formatCurrency(expense.amount)})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const id = expense.id;
              setDeletingId(id);
              try {
                await expenseService.delete(id);
                removeExpense(id);
              } catch (err) {
                Alert.alert('Error', err.message || 'Could not delete expense.');
              } finally {
                setDeletingId(null);
              }
            },
          },
        ],
      );
    },
    [removeExpense],
  );

  // ─── Edit ────────────────────────────────────────────────────────────
  const handleEdit = useCallback(
    (expense) => {
      // Pass the raw expense object so AddExpenseModal can pre-fill all fields
      navigation?.navigate('AddExpenseModal', { expense: expense._raw ?? expense });
    },
    [navigation],
  );

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]}
      contentContainerStyle={{ paddingBottom: 110 + Math.max(insets.bottom, 12) }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={themeColors.gold}
          colors={[themeColors.gold]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: themeColors.foreground[colorScheme] }]}>
              Expenses
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.muted[colorScheme] }]}>
              {filtered.length} transactions ·{' '}
              <Text style={[styles.subtitleBold, { color: themeColors.foreground[colorScheme] }]}>
                {formatCurrency(total)}
              </Text>
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation?.navigate('AddExpenseModal')}
              style={[styles.addBtn, { backgroundColor: themeColors.gold }]}
            >
              <Plus size={16} color={themeColors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] },
          ]}
        >
          <Search size={16} color={themeColors.muted[colorScheme]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search merchant..."
            placeholderTextColor={themeColors.muted[colorScheme]}
            style={[styles.searchInput, { color: themeColors.foreground[colorScheme] }]}
          />
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          <Chip active={selectedCat === 'all'} onPress={() => setSelectedCat('all')} label="All" isDark={isDark} />
          {EXPENSE_CATEGORIES.slice(0, 6).map((c) => (
            <Chip
              key={c.id}
              active={selectedCat === c.id}
              onPress={() => setSelectedCat(c.id)}
              label={c.name.split(' ')[0]}
              color={c.color}
              isDark={isDark}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Error banner ── */}
      {error && (
        <View
          style={[
            styles.errorCard,
            { borderColor: 'rgba(251,113,133,0.4)', backgroundColor: 'rgba(251,113,133,0.08)' },
          ]}
        >
          <AlertCircle size={16} color="#FB7185" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Expense list ── */}
      <View style={styles.list}>
        {loading && !refreshing ? (
          <LoadingSpinner inline />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: themeColors.foreground[colorScheme] }]}>
              {query || selectedCat !== 'all' ? 'No matches found' : 'No expenses yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.muted[colorScheme] }]}>
              {query || selectedCat !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Tap the + button to add your first expense.'}
            </Text>
          </View>
        ) : (
          filtered.map((t) => (
            <View key={t.id} style={{ opacity: deletingId === t.id ? 0.4 : 1 }}>
              <ExpenseCard
                transaction={t}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ─── Category chip ─────────────────────────────────────────────────────────
function Chip({ active, onPress, label, color, isDark }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: themeColors.gold, borderColor: themeColors.gold }
          : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: 'transparent' },
      ]}
    >
      {color && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Text
        style={[
          styles.chipText,
          { color: active ? themeColors.black : themeColors.muted[isDark ? 'dark' : 'light'] },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  subtitleBold: { fontWeight: '700' },

  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtn: { padding: 10, borderRadius: 16, borderWidth: 1 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },

  chips: { marginTop: 12, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginRight: 8,
    borderWidth: 1,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '600' },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 12, color: '#FB7185' },
  retryText: { fontSize: 12, fontWeight: '700', color: themeColors.gold },

  list: { paddingHorizontal: 20, marginTop: 16, gap: 8, paddingBottom: 120 },

  emptyState: { paddingVertical: 48, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
