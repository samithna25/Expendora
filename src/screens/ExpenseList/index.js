import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { ExpenseCard } from '../../components/ExpenseCard';
import { borderRadius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

const mockTransactions = [
  { id: '1', merchant: 'Starbucks Coffee', category: 'food', amount: 6.75, date: 'Today, 09:12', method: 'Apple Pay' },
  { id: '2', merchant: 'Uber Ride', category: 'transport', amount: 14.30, date: 'Today, 08:40', method: 'Card •• 4218' },
  { id: '3', merchant: 'Spotify Premium', category: 'entertainment', amount: 9.99, date: 'Yesterday', method: 'Auto-debit' },
  { id: '4', merchant: 'Whole Foods', category: 'food', amount: 78.42, date: 'Yesterday', method: 'Card •• 4218' },
  { id: '5', merchant: 'Netflix', category: 'entertainment', amount: 15.49, date: 'Mar 24', method: 'Auto-debit' },
  { id: '6', merchant: 'Pharmacy Plus', category: 'health', amount: 22.10, date: 'Mar 23', method: 'Cash' },
  { id: '7', merchant: 'Zara', category: 'shopping', amount: 124.00, date: 'Mar 22', method: 'Card •• 4218' },
  { id: '8', merchant: 'Electricity Bill', category: 'bills', amount: 89.50, date: 'Mar 20', method: 'Bank Transfer' },
  { id: '9', merchant: 'Coursera', category: 'education', amount: 49.00, date: 'Mar 18', method: 'Card •• 4218' },
];

export function ExpenseListScreen() {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const filtered = mockTransactions.filter(
    (t) =>
      (selectedCat === 'all' || t.category === selectedCat) &&
      t.merchant.toLowerCase().includes(query.toLowerCase()),
  );
  const total = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: themeColors.foreground[colorScheme] }]}>Expenses</Text>
            <Text style={[styles.subtitle, { color: themeColors.muted[colorScheme] }]}>
              {filtered.length} transactions ·{' '}
              <Text style={[styles.subtitleBold, { color: themeColors.foreground[colorScheme] }]}>
                {formatCurrency(total)}
              </Text>
            </Text>
          </View>
          <TouchableOpacity style={[styles.filterBtn, { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] }]}>
            <SlidersHorizontal size={16} color={themeColors.foreground[colorScheme]} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] }]}>
          <Search size={16} color={themeColors.muted[colorScheme]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search merchant..."
            placeholderTextColor={themeColors.muted[colorScheme]}
            style={[styles.searchInput, { color: themeColors.foreground[colorScheme] }]}
          />
        </View>

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

      <View style={styles.list}>
        {filtered.map((t) => (
          <ExpenseCard key={t.id} transaction={t} />
        ))}
        {filtered.length === 0 && (
          <Text style={[styles.empty, { color: themeColors.muted[colorScheme] }]}>No matches</Text>
        )}
      </View>
    </ScrollView>
  );
}

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
  list: { paddingHorizontal: 20, marginTop: 16, gap: 8, paddingBottom: 120 },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});
