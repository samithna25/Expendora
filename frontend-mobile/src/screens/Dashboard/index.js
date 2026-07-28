import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Bell, ArrowUpRight, Pencil, Plus, ScanLine, TrendingUp, AlertCircle, X, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { CategoryChart } from '../../components/CategoryChart';
import { ExpenseCard } from '../../components/ExpenseCard';
import { ReportCard } from '../../components/ReportCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { borderRadius, spacing } from '../../theme/spacing';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { CURRENCY_SYMBOL, BUDGET_STORAGE_KEY } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reportService } from '../../services/reportService';
import { authService } from '../../services/authService';

import { BrandLogo } from '../../components/BrandLogo';

// ─── Fallback budget limit when data is unavailable ────────────────────────
const FALLBACK_BUDGET = 15000;

export function DashboardScreen({ navigation }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const { user } = useAuth();
  const { expenses, loading, error, totalSpent, categoryBreakdown, refresh } = useExpenses();
  const insets = useSafeAreaInsets();

  // ─── User budget management ─────────────────────────────────────────────
  const [userBudget, setUserBudget] = useState(null);
  const [budgetLoaded, setBudgetLoaded] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(BUDGET_STORAGE_KEY).then((stored) => {
      if (stored) setUserBudget(Number(stored));
      setBudgetLoaded(true);
    });
  }, []);

  const openBudgetModal = useCallback(() => {
    setBudgetInput(String(userBudget ?? FALLBACK_BUDGET));
    setBudgetModalVisible(true);
  }, [userBudget]);

  const saveBudget = useCallback(async () => {
    const val = Math.max(0, Number(budgetInput) || 0);
    setUserBudget(val);
    await AsyncStorage.setItem(BUDGET_STORAGE_KEY, String(val));
    authService.updateProfile({ monthly_budget: val }).catch(() => {});
    setBudgetModalVisible(false);
  }, [budgetInput]);

  // ─── Dashboard data ─────────────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!budgetLoaded) return;
    setDashLoading(true);
    try {
      const budget = userBudget ?? FALLBACK_BUDGET;
      const res = await reportService.getDashboard(null, budget);
      setDashboardData(res?.data ?? null);
    } catch {
      setDashboardData(null);
    } finally {
      setDashLoading(false);
    }
  }, [budgetLoaded, userBudget]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ─── Derived values (user budget > backend > fallback) ──────────────────
  const monthlyLimit = userBudget ?? dashboardData?.budget_status?.monthly_limit ?? FALLBACK_BUDGET;
  const budgetRemaining = Math.max(0, monthlyLimit - totalSpent);
  const pctUsed = monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0;
  const topCategory = categoryBreakdown.length > 0
    ? categoryBreakdown.reduce((a, b) => (a.value > b.value ? a : b))
    : null;
  const fallbackInsight = !topCategory
    ? 'No expenses recorded for this period yet. Start adding transactions to view analytics.'
    : `${topCategory.name} is your highest spending category (${((topCategory.value / monthlyLimit) * 100).toFixed(1)}% of total monthly budget).`;
  const insightText = dashboardData?.insights ?? fallbackInsight;

  // 4 most recent expenses for the "Recent Transactions" strip
  const recentExpenses = expenses.slice(0, 4);

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
      contentContainerStyle={{ paddingBottom: 120 + Math.max(insets.bottom, 16) }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: '#0D0D0D', paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.bgOrb1} />
        <View style={styles.bgOrb2} />

        <View style={styles.topRow}>
          <BrandLogo size={22} variant="white" animated={true} spinDuration={2400} showSubtitle={false} />
          <TouchableOpacity style={[styles.notifBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Bell size={16} color={themeColors.white} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={[styles.greeting, { color: 'rgba(245,230,200,0.6)' }]}>
            {user?.name ? `Good morning, ${user.name.split(' ')[0]} 👋` : 'Good morning 👋'}
          </Text>
          <View style={styles.balanceRow}>
            <TouchableOpacity onPress={openBudgetModal} activeOpacity={0.7}>
              <View style={styles.balanceLabelRow}>
                <Text style={[styles.balanceLabel, { color: 'rgba(245,230,200,0.55)' }]}>
                  MONTHLY BUDGET
                </Text>
                <Pencil size={10} color="rgba(245,230,200,0.45)" />
              </View>
              <Text style={[styles.balanceAmount, { color: themeColors.foreground[colorScheme] }]}>
                <Text style={{ color: themeColors.gold }}>{CURRENCY_SYMBOL.trim()} </Text>
                {String(monthlyLimit.toFixed(0))}
              </Text>
            </TouchableOpacity>
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
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionLabel, { color: themeColors.muted[colorScheme] }]}>QUICK ACTIONS</Text>
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
      </View>

      {/* ── AI Insight ── */}
      <View style={styles.sectionWrapper}>
        <ReportCard
          title="AI INSIGHT"
          insight={dashLoading || loading ? 'Analysing your spending…' : insightText}
        />
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
      <View style={styles.sectionWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.foreground[colorScheme] }]}>
            Spending by Category
          </Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation?.navigate('Expenses')}
          >
            <Text style={[styles.seeAllText, { color: themeColors.gold }]}>Details</Text>
            <ArrowUpRight size={12} color={themeColors.gold} />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.chartCard,
            { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] },
          ]}
        >
          <Text style={[styles.chartSub, { color: themeColors.muted[colorScheme] }]}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          {loading ? (
            <LoadingSpinner inline />
          ) : categoryBreakdown.length > 0 ? (
            <CategoryChart data={categoryBreakdown} />
          ) : (
            <Text style={[styles.emptyChart, { color: themeColors.muted[colorScheme] }]}>
              No spending data yet
            </Text>
          )}
        </View>
      </View>

      {/* ── Recent Transactions ── */}
      <View style={styles.sectionWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.foreground[colorScheme] }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation?.navigate('Expenses')}
          >
            <Text style={[styles.seeAllText, { color: themeColors.gold }]}>See all</Text>
            <ArrowUpRight size={12} color={themeColors.gold} />
          </TouchableOpacity>
        </View>
        <View style={styles.recentList}>
          {loading ? (
            <LoadingSpinner inline />
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

      {/* ── Budget Edit Modal ── */}
      <Modal
        visible={budgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBudgetModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.modalCard, { backgroundColor: themeColors.card[colorScheme] }]}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.foreground[colorScheme] }]}>
                Set Monthly Budget
              </Text>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                <X size={18} color={themeColors.muted[colorScheme]} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalHint, { color: themeColors.muted[colorScheme] }]}>
              Enter your total spending limit for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.
            </Text>
            <View style={[styles.inputRow, { borderColor: themeColors.border[colorScheme] }]}>
              <Text style={[styles.inputPrefix, { color: themeColors.foreground[colorScheme] }]}>
                {CURRENCY_SYMBOL.trim()}
              </Text>
              <TextInput
                style={[styles.modalInput, { color: themeColors.foreground[colorScheme] }]}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                placeholder="e.g. 50000"
                placeholderTextColor={themeColors.muted[colorScheme]}
                autoFocus
                selectTextOnFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor: themeColors.border[colorScheme] }]}
                onPress={() => setBudgetModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: themeColors.muted[colorScheme] }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: themeColors.gold }]}
                onPress={saveBudget}
              >
                <Check size={14} color={themeColors.black} />
                <Text style={[styles.modalBtnText, { color: themeColors.black }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  // ── Shared section layout ───────────────────────────────────────────────
  sectionWrapper: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 12, fontWeight: '600' },

  quickActionsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionItem: { alignItems: 'center', gap: 8, width: 72 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 11, fontWeight: '600' },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 12, color: '#FB7185' },
  retryText: { fontSize: 12, fontWeight: '700', color: themeColors.gold },

  chartCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingTop: 14,
  },
  chartSub: { fontSize: 11, marginBottom: 12 },
  emptyChart: { textAlign: 'center', paddingVertical: 24, fontSize: 13 },

  recentList: { gap: 10 },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 13, lineHeight: 20 },

  // ── Budget edit modal ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 8,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    height: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalBtnSecondary: {
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
