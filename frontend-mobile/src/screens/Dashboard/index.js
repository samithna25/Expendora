import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Bell, ArrowUpRight, Sparkles, Plus, ScanLine, Send, PiggyBank, TrendingUp, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { CategoryChart } from '../../components/CategoryChart';
import { ExpenseCard } from '../../components/ExpenseCard';
import { borderRadius, spacing } from '../../theme/spacing';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { CURRENCY_SYMBOL } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '../../components/BrandLogo';

// ─── Default budget limit for "remaining" display ─────────────────────────
const MONTHLY_BUDGET = 15000;

export function DashboardScreen({ navigation }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const { user } = useAuth();
  const { expenses, loading, error, totalSpent, categoryBreakdown, refresh } = useExpenses();
  const insets = useSafeAreaInsets();

  // 4 most recent expenses for the "Recent Transactions" strip
  const recentExpenses = expenses.slice(0, 4);

  const budgetRemaining = Math.max(0, MONTHLY_BUDGET - totalSpent);

  // Normalise each expense to the shape ExpenseCard expects
  const normalise = (e) => ({
    id: e.id ?? e._id ?? String(Math.random()),
    merchant: e.merchant ?? e.merchant_name ?? 'Unknown',
    category: e.category ?? 'other',
    amount: Number(e.amount) || 0,
    date: formatDate(e.date ?? e.created_at),
    method: e.method ?? e.payment_method ?? '—',
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]}
      contentContainerStyle={{ paddingBottom: 110 + Math.max(insets.bottom, 12) }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold, paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.bgOrb1} />
        <View style={styles.bgOrb2} />

        <View style={styles.topRow}>
          <BrandLogo size={22} variant={isDark ? 'white' : 'original'} animated={false} showSubtitle={false} />
          <TouchableOpacity style={[styles.notifBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Bell size={16} color={themeColors.white} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={[styles.greeting, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
            {user?.name ? `Good morning, ${user.name.split(' ')[0]} 👋` : 'Good morning 👋'}
          </Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={[styles.balanceLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                MONTHLY BUDGET
              </Text>
              <Text style={[styles.balanceAmount, { color: themeColors.foreground[colorScheme] }]}>
                <Text style={{ color: themeColors.gold }}>{CURRENCY_SYMBOL.trim()} </Text>
                {String(MONTHLY_BUDGET.toFixed(0))}
              </Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <TrendingUp size={12} color={themeColors.success} />
              <Text style={[styles.trendText, { color: themeColors.success }]}>Live</Text>
            </View>
          </View>
        </View>

        <View style={styles.miniStats}>
          <MiniStat
            label="Spent"
            value={loading ? '...' : formatCurrency(totalSpent)}
            sub="this month"
            isDark={isDark}
          />
          <MiniStat
            label="Budget"
            value={loading ? '...' : formatCurrency(budgetRemaining)}
            sub="remaining"
            isDark={isDark}
            gold
          />
          <MiniStat
            label="Expenses"
            value={loading ? '...' : String(expenses.length)}
            sub="total entries"
            isDark={isDark}
            success
          />
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.quickActions}>
        {[
          {
            Icon: ScanLine,
            label: 'Scan',
            gold: true,
            onPress: () => navigation?.navigate('UploadReceipt'),
          },
          {
            Icon: Plus,
            label: 'Add',
            onPress: () => navigation?.navigate('AddExpenseModal'),
          },
          { Icon: Send, label: 'Send', onPress: () => {} },
          { Icon: PiggyBank, label: 'Save', onPress: () => {} },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionItem} onPress={a.onPress}>
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: a.gold ? themeColors.gold : themeColors.secondary[colorScheme],
                },
              ]}
            >
              <a.Icon
                size={20}
                color={a.gold ? themeColors.black : themeColors.foreground[colorScheme]}
              />
            </View>
            <Text style={[styles.actionLabel, { color: themeColors.muted[colorScheme] }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── AI Insight ── */}
      <View
        style={[
          styles.insightCard,
          { borderColor: 'rgba(250,204,21,0.3)', backgroundColor: isDark ? 'rgba(250,204,21,0.08)' : 'rgba(250,204,21,0.12)' },
        ]}
      >
        <View style={styles.insightIcon}>
          <Sparkles size={16} color={themeColors.black} />
        </View>
        <View style={styles.insightContent}>
          <Text style={[styles.insightTitle, { color: themeColors.gold }]}>AI INSIGHT</Text>
          <Text style={[styles.insightText, { color: themeColors.foreground[colorScheme] }]}>
            {loading
              ? 'Analysing your spending…'
              : totalSpent > MONTHLY_BUDGET * 0.8
              ? `You've used ${((totalSpent / MONTHLY_BUDGET) * 100).toFixed(0)}% of your budget. Consider reviewing recurring expenses.`
              : `You're on track! ${formatCurrency(budgetRemaining)} left in your budget this month.`}
          </Text>
        </View>
      </View>

      {/* ── Error banner ── */}
      {error && (
        <View style={[styles.errorCard, { borderColor: 'rgba(251,113,133,0.4)', backgroundColor: 'rgba(251,113,133,0.08)' }]}>
          <AlertCircle size={16} color="#FB7185" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Spending by Category Chart ── */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] },
        ]}
      >
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: themeColors.foreground[colorScheme] }]}>
              Spending by Category
            </Text>
            <Text style={[styles.chartSub, { color: themeColors.muted[colorScheme] }]}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chartAction}
            onPress={() => navigation?.navigate('Expenses')}
          >
            <Text style={[styles.chartActionText, { color: themeColors.gold }]}>Details</Text>
            <ArrowUpRight size={12} color={themeColors.gold} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={themeColors.gold} style={{ paddingVertical: 24 }} />
        ) : categoryBreakdown.length > 0 ? (
          <CategoryChart data={categoryBreakdown} />
        ) : (
          <Text style={[styles.emptyChart, { color: themeColors.muted[colorScheme] }]}>
            No spending data yet
          </Text>
        )}
      </View>

      {/* ── Recent Transactions ── */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: themeColors.foreground[colorScheme] }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Expenses')}>
            <Text style={[styles.recentSeeAll, { color: themeColors.gold }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentList}>
          {loading ? (
            <ActivityIndicator color={themeColors.gold} style={{ paddingVertical: 20 }} />
          ) : recentExpenses.length > 0 ? (
            recentExpenses.map((e) => (
              <ExpenseCard key={e.id ?? e._id} transaction={normalise(e)} />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: themeColors.muted[colorScheme] }]}>
              No expenses yet — tap Add or Scan to get started.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── MiniStat sub-component ───────────────────────────────────────────────
function MiniStat({ label, value, sub, isDark, gold, success }) {
  const colorScheme = isDark ? 'dark' : 'light';
  return (
    <View
      style={[
        styles.statBox,
        {
          borderColor: gold ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.1)',
          backgroundColor: gold ? 'rgba(250,204,21,0.1)' : 'rgba(255,255,255,0.05)',
        },
      ]}
    >
      <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.statValue,
          {
            color: gold
              ? themeColors.gold
              : success
              ? themeColors.success
              : themeColors.foreground[colorScheme],
          },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statSub, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
        {sub}
      </Text>
    </View>
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
    position: 'relative',
  },
  bgOrb1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(250,204,21,0.3)',
  },
  bgOrb2: {
    position: 'absolute',
    left: '33%',
    bottom: -64,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(250,204,21,0.1)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  logo: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  notifBtn: {
    padding: 10,
    borderRadius: borderRadius.full,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.gold,
  },
  balanceSection: { marginTop: 20, position: 'relative' },
  greeting: { fontSize: 12 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  balanceLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  balanceAmount: { fontSize: 34, fontWeight: '700', marginTop: 4 },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  trendText: { fontSize: 11, fontWeight: '600' },
  miniStats: { flexDirection: 'row', gap: 8, marginTop: 24, position: 'relative' },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12 },
  statLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  statSub: { fontSize: 9, marginTop: 2 },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionItem: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 10, fontWeight: '600' },

  insightCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: themeColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  insightText: { fontSize: 13, lineHeight: 18, marginTop: 4 },

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

  chartCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: '700' },
  chartSub: { fontSize: 11, marginTop: 2 },
  chartAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  chartActionText: { fontSize: 11, fontWeight: '600' },
  emptyChart: { textAlign: 'center', paddingVertical: 24, fontSize: 13 },

  recentSection: { marginHorizontal: 20, marginTop: 20, marginBottom: 100 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: { fontSize: 14, fontWeight: '700' },
  recentSeeAll: { fontSize: 11, fontWeight: '600' },
  recentList: { marginTop: 12, gap: 8 },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 13, lineHeight: 20 },
});
