import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Download, TrendingDown, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { CategoryChart } from '../../components/CategoryChart';
import { borderRadius } from '../../theme/spacing';
import { PERIOD_TABS, EXPENSE_CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { useExpenses } from '../../context/ExpenseContext';
import { expenseService } from '../../services/expenseService';

// ─── Chart dimensions ─────────────────────────────────────────────────────────
const { width: screenWidth } = Dimensions.get('window');
const CHART_W = screenWidth - 80;
const CHART_H = 130;
const PADDING = { top: 10, bottom: 20, left: 10, right: 10 };
const plotW = CHART_W - PADDING.left - PADDING.right;
const plotH = CHART_H - PADDING.top - PADDING.bottom;

// ─── Default budget limits (editable in Phase 4) ───────────────────────────
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

// ─── Spending Trend Line Chart ────────────────────────────────────────────────
function SpendingTrendChart({ data }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  if (!data || data.length < 2) {
    return (
      <Text style={[styles.emptyChart, { color: themeColors.muted[colorScheme] }]}>
        Not enough data for a trend yet.
      </Text>
    );
  }
  const maxVal = Math.max(...data.map((d) => d.spent));
  const minVal = Math.min(...data.map((d) => d.spent));
  const range = maxVal - minVal || 1;
  const stepX = plotW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: PADDING.left + i * stepX,
    y: PADDING.top + plotH - ((d.spent - minVal) / range) * plotH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PADDING.top + plotH} L ${points[0].x} ${PADDING.top + plotH} Z`;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Path d={areaPath} fill={isDark ? 'rgba(250,204,21,0.12)' : 'rgba(250,204,21,0.2)'} />
      <Path d={linePath} stroke={themeColors.gold} strokeWidth={2.5} fill="none" />
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={themeColors.gold} />
      ))}
      {data.map((d, i) => (
        <SvgText
          key={i}
          x={points[i].x}
          y={CHART_H - 4}
          textAnchor="middle"
          fontSize={10}
          fill={themeColors.muted[colorScheme]}
        >
          {d.m}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Budget Performance Bar ───────────────────────────────────────────────────
function BudgetBar({ name, spent, limit, color }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const pct = Math.min(100, (spent / limit) * 100);
  const over = pct >= 95;
  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetLabelRow}>
        <Text style={[styles.budgetName, { color: themeColors.foreground[colorScheme] }]}>
          {name}
        </Text>
        <Text
          style={[
            styles.budgetAmount,
            over
              ? { color: themeColors.warning, fontWeight: '700' }
              : { color: themeColors.muted[colorScheme] },
          ]}
        >
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </Text>
      </View>
      <View style={[styles.budgetBarBg, { backgroundColor: themeColors.secondary[colorScheme] }]}>
        <View
          style={[
            styles.budgetBarFill,
            { width: `${pct}%`, backgroundColor: over ? themeColors.warning : color },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ReportsScreen() {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const [periodIndex, setPeriodIndex] = useState(1);

  // Live data from ExpenseContext
  const { expenses, loading: expLoading, error: expError, categoryBreakdown, totalSpent, refresh } = useExpenses();

  // Monthly trend — separate API call
  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    setTrendError(null);
    try {
      const res = await expenseService.getMonthlyTrend();
      // Backend: { status, data: { months: [{ month: "2024-03", total, count }] } }
      const months = res?.data?.months ?? res?.data ?? [];
      const formatted = months.map((m) => ({
        m: m.month ? m.month.slice(5, 7) + '/' + m.month.slice(2, 4) : '?',
        spent: Number(m.total) || 0,
      }));
      setTrend(formatted);
    } catch (err) {
      setTrendError(err.message || 'Could not load trend data.');
    } finally {
      setTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), fetchTrend()]);
    setRefreshing(false);
  }, [refresh, fetchTrend]);

  // ─── Build live budget performance from expenses ──────────────────────────
  const budgetBars = EXPENSE_CATEGORIES.filter((cat) => DEFAULT_LIMITS[cat.id]).map((cat) => {
    const spent = expenses
      .filter((e) => e.category === cat.id)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      limit: DEFAULT_LIMITS[cat.id],
      spent,
    };
  }).filter((b) => b.spent > 0);  // only show categories with actual spending

  // ─── Trend header stats ───────────────────────────────────────────────────
  const lastTwo = trend.slice(-2);
  const trendPct = lastTwo.length === 2 && lastTwo[0].spent > 0
    ? Math.round(((lastTwo[1].spent - lastTwo[0].spent) / lastTwo[0].spent) * 100)
    : null;
  const prevMonthLabel = lastTwo.length === 2 ? lastTwo[0].m : 'prev';
  const isDown = trendPct !== null && trendPct < 0;

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
      {/* ── Header — respects status bar ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: themeColors.foreground[colorScheme] }]}>
              Reports
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.muted[colorScheme] }]}>
              Live analytics
            </Text>
          </View>
          <TouchableOpacity style={styles.pdfBtn}>
            <Download size={14} color={themeColors.black} />
            <Text style={styles.pdfText}>PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabRow, { backgroundColor: themeColors.secondary[colorScheme] }]}>
          {PERIOD_TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              onPress={() => setPeriodIndex(i)}
              style={[
                styles.tab,
                i === periodIndex && { backgroundColor: themeColors.card[colorScheme] },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  i === periodIndex && { fontWeight: '600' },
                  i !== periodIndex && { color: themeColors.muted[colorScheme] },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Spending Trend ── */}
      <View
        style={[
          styles.card,
          { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] },
        ]}
      >
        <View style={styles.trendHeader}>
          <View>
            <Text style={[styles.cardLabel, { color: themeColors.muted[colorScheme] }]}>
              Spending Trend
            </Text>
            <Text style={[styles.trendValue, { color: themeColors.foreground[colorScheme] }]}>
              {formatCurrency(totalSpent)}
              <Text style={[styles.trendSub, { color: themeColors.muted[colorScheme] }]}>
                {' '}/ {formatCurrency(DEFAULT_LIMITS.food + DEFAULT_LIMITS.transport + DEFAULT_LIMITS.shopping + DEFAULT_LIMITS.bills + DEFAULT_LIMITS.entertainment)}
              </Text>
            </Text>
          </View>
          {trendPct !== null && (
            <View style={styles.trendBadge}>
              {isDown
                ? <TrendingDown size={12} color={themeColors.success} />
                : <TrendingUp size={12} color="#FB7185" />}
              <Text
                style={[
                  styles.trendBadgeText,
                  { color: isDown ? themeColors.success : '#FB7185' },
                ]}
              >
                {isDown ? '' : '+'}{trendPct}% vs {prevMonthLabel}
              </Text>
            </View>
          )}
        </View>
        {trendLoading ? (
          <ActivityIndicator color={themeColors.gold} style={{ paddingVertical: 40 }} />
        ) : trendError ? (
          <Text style={[styles.emptyChart, { color: '#FB7185' }]}>{trendError}</Text>
        ) : (
          <SpendingTrendChart data={trend} />
        )}
      </View>

      {/* ── Category Breakdown ── */}
      <View
        style={[
          styles.card,
          { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] },
        ]}
      >
        <Text style={[styles.cardTitle, { color: themeColors.foreground[colorScheme] }]}>
          Category Breakdown
        </Text>
        {expLoading ? (
          <ActivityIndicator color={themeColors.gold} style={{ paddingVertical: 24 }} />
        ) : categoryBreakdown.length > 0 ? (
          <CategoryChart data={categoryBreakdown} />
        ) : (
          <Text style={[styles.emptyChart, { color: themeColors.muted[colorScheme] }]}>
            No expenses recorded yet.
          </Text>
        )}
      </View>

      {/* ── Budget Performance ── */}
      <View
        style={[
          styles.card,
          { borderColor: themeColors.border[colorScheme], backgroundColor: themeColors.card[colorScheme] },
        ]}
      >
        <Text style={[styles.cardTitle, { color: themeColors.foreground[colorScheme] }]}>
          Budget Performance
        </Text>
        <View style={styles.budgetList}>
          {expLoading ? (
            <ActivityIndicator color={themeColors.gold} />
          ) : budgetBars.length > 0 ? (
            budgetBars.map((b) => <BudgetBar key={b.id} {...b} />)
          ) : (
            <Text style={[styles.emptyChart, { color: themeColors.muted[colorScheme] }]}>
              Add expenses to see budget performance.
            </Text>
          )}
        </View>
      </View>

      {/* ── Error banner ── */}
      {expError && (
        <View style={[styles.errorCard, { borderColor: 'rgba(251,113,133,0.4)', backgroundColor: 'rgba(251,113,133,0.08)' }]}>
          <AlertCircle size={16} color="#FB7185" />
          <Text style={styles.errorText}>{expError}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: themeColors.gold,
  },
  pdfText: { fontSize: 12, fontWeight: '700', color: themeColors.black },
  tabRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  tab: { flex: 1, paddingVertical: 6, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '500' },
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardLabel: { fontSize: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  trendValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  trendSub: { fontSize: 16, fontWeight: '400' },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignSelf: 'flex-start',
  },
  trendBadgeText: { fontSize: 10, fontWeight: '700' },
  budgetList: { gap: 12 },
  budgetRow: {},
  budgetLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetName: { fontSize: 12, fontWeight: '600' },
  budgetAmount: { fontSize: 12 },
  budgetBarBg: { marginTop: 6, height: 8, borderRadius: 4, overflow: 'hidden' },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  emptyChart: { textAlign: 'center', paddingVertical: 20, fontSize: 13 },
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
});
