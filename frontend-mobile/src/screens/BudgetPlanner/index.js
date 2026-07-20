import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, Target, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { BudgetCard } from '../../components/BudgetCard';
import { borderRadius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/formatters';
import { useExpenses } from '../../context/ExpenseContext';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Default monthly budget limits per category (in $).
 * These are static defaults — a future budget settings endpoint will make them editable.
 */
const DEFAULT_LIMITS = {
  food: 500,
  transport: 250,
  shopping: 300,
  bills: 400,
  entertainment: 150,
  health: 200,
  education: 100,
  other: 100,
};

/**
 * BudgetPlannerScreen
 *
 * Replaces all mock data with live spending from ExpenseContext.
 *  - Category budgets: `spent` is derived from real expense data grouped by category.
 *  - The alert card dynamically identifies the category closest to its limit.
 *  - Savings Goals section shows a "Coming Soon" placeholder (Phase 4).
 */
export function BudgetPlannerScreen({ navigation }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const { expenses, loading, error, refresh } = useExpenses();

  // ─── Derive live spending per category ───────────────────────────────────
  const categorySpending = useMemo(() => {
    return expenses.reduce((acc, e) => {
      const cat = e.category || 'other';
      acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});
  }, [expenses]);

  // ─── Build budget list from EXPENSE_CATEGORIES + live spending ───────────
  const budgets = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      limit: DEFAULT_LIMITS[cat.id] ?? 100,
      spent: categorySpending[cat.id] ?? 0,
    })).filter((b) => b.spent > 0 || b.limit > 0); // only show active categories
  }, [categorySpending]);

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // ─── Find the category that is closest to/over its limit ─────────────────
  const nearLimitBudget = useMemo(() => {
    return budgets
      .map((b) => ({ ...b, ratio: b.spent / b.limit }))
      .filter((b) => b.ratio > 0)
      .sort((a, b) => b.ratio - a.ratio)[0] ?? null;
  }, [budgets]);

  const showAlert = nearLimitBudget && nearLimitBudget.ratio >= 0.7;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]}
      contentContainerStyle={{ paddingBottom: 110 + Math.max(insets.bottom, 12) }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold, paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.headerOrb} />
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: themeColors.white }]}>Budget Planner</Text>
            <Text style={[styles.headerSub, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={refresh}
            style={[styles.refreshBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          >
            <RefreshCw size={16} color={themeColors.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={themeColors.gold} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.overview}>
            <View style={styles.overviewRow}>
              <Text style={[styles.totalSpent, { color: themeColors.white }]}>
                <Text style={{ color: themeColors.gold }}>$</Text>
                {totalSpent.toFixed(0)}
              </Text>
              <Text style={[styles.ofBudget, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
                of ${totalBudget}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={[styles.progressFill, { width: `${Math.min(100, pct)}%` }]} />
            </View>
            <Text style={[styles.progressLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
              {(100 - pct).toFixed(0)}% remaining · {formatCurrency(totalBudget - totalSpent)} left
            </Text>
          </View>
        )}
      </View>

      {/* ── Near-limit alert (dynamic) ── */}
      {showAlert && (
        <View
          style={[
            styles.alertCard,
            { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.1)' },
          ]}
        >
          <AlertTriangle size={16} color={themeColors.warning} />
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: themeColors.foreground[colorScheme] }]}>
              {nearLimitBudget.spent >= nearLimitBudget.limit
                ? `${nearLimitBudget.name} over budget!`
                : `${nearLimitBudget.name} near limit`}
            </Text>
            <Text style={[styles.alertDesc, { color: themeColors.muted[colorScheme] }]}>
              {formatCurrency(nearLimitBudget.spent)} spent of {formatCurrency(nearLimitBudget.limit)} budget
              {nearLimitBudget.spent < nearLimitBudget.limit
                ? ` · ${formatCurrency(nearLimitBudget.limit - nearLimitBudget.spent)} remaining`
                : ' — consider reducing spending.'}
            </Text>
          </View>
        </View>
      )}

      {/* ── Error banner ── */}
      {error && (
        <View
          style={[
            styles.alertCard,
            { borderColor: 'rgba(251,113,133,0.4)', backgroundColor: 'rgba(251,113,133,0.08)' },
          ]}
        >
          <AlertTriangle size={16} color="#FB7185" />
          <Text style={[styles.alertDesc, { color: '#FB7185', flex: 1 }]}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={{ color: themeColors.gold, fontWeight: '700', fontSize: 12 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Category Budgets ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.foreground[colorScheme] }]}>
            Category Budgets
          </Text>
          <TouchableOpacity style={styles.addBtn}>
            <Plus size={12} color={themeColors.gold} />
            <Text style={[styles.addText, { color: themeColors.gold }]}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.budgetList}>
          {loading ? (
            <ActivityIndicator color={themeColors.gold} style={{ paddingVertical: 24 }} />
          ) : budgets.length > 0 ? (
            budgets.map((b) => <BudgetCard key={b.id} budget={b} />)
          ) : (
            <Text style={[styles.emptyText, { color: themeColors.muted[colorScheme] }]}>
              No expenses recorded yet. Start adding expenses to see your budget breakdown.
            </Text>
          )}
        </View>
      </View>

      {/* ── Savings Goals (Phase 4 placeholder) ── */}
      <View style={[styles.section, styles.sectionLast]}>
        <View style={styles.sectionHeader}>
          <View style={styles.goalHeader}>
            <Target size={16} color={themeColors.gold} />
            <Text style={[styles.sectionTitle, { color: themeColors.foreground[colorScheme] }]}>
              Savings Goals
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={[styles.addText, { color: themeColors.gold }]}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* Coming soon placeholder */}
        <View
          style={[
            styles.comingSoonCard,
            { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] },
          ]}
        >
          <Text style={styles.comingSoonEmoji}>🎯</Text>
          <Text style={[styles.comingSoonTitle, { color: themeColors.foreground[colorScheme] }]}>
            Coming in Phase 4
          </Text>
          <Text style={[styles.comingSoonSub, { color: themeColors.muted[colorScheme] }]}>
            Set personalised savings goals and track your progress — launching soon!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerOrb: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(250,204,21,0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  overview: { marginTop: 16 },
  overviewRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  totalSpent: { fontSize: 28, fontWeight: '700' },
  ofBudget: { fontSize: 12, paddingBottom: 4 },
  progressBar: {
    marginTop: 8,
    height: 10,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: themeColors.gold,
  },
  progressLabel: { fontSize: 11, marginTop: 6 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 12, fontWeight: '700' },
  alertDesc: { fontSize: 12, marginTop: 2 },

  section: { marginHorizontal: 20, marginTop: 20 },
  sectionLast: { paddingBottom: 100 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 12, fontWeight: '600' },

  budgetList: { gap: 8 },

  emptyText: { textAlign: 'center', paddingVertical: 24, fontSize: 13, lineHeight: 20 },

  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Coming soon card
  comingSoonCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  comingSoonEmoji: { fontSize: 36 },
  comingSoonTitle: { fontSize: 15, fontWeight: '700' },
  comingSoonSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
