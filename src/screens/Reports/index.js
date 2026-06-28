import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Download, TrendingDown } from 'lucide-react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { CategoryChart } from '../../components/CategoryChart';
import { borderRadius } from '../../theme/spacing';
import { PERIOD_TABS } from '../../utils/constants';

const mockMonthlyTrend = [
  { m: 'Oct', spent: 1120 },
  { m: 'Nov', spent: 1340 },
  { m: 'Dec', spent: 1680 },
  { m: 'Jan', spent: 1210 },
  { m: 'Feb', spent: 1395 },
  { m: 'Mar', spent: 1283 },
];

const mockSpendingByCategory = [
  { name: 'Food', value: 412, color: '#FACC15' },
  { name: 'Transport', value: 186, color: '#60A5FA' },
  { name: 'Shopping', value: 298, color: '#F472B6' },
  { name: 'Bills', value: 245, color: '#A78BFA' },
  { name: 'Other', value: 142, color: '#94A3B8' },
];

const mockBudgets = [
  { id: 'food', name: 'Food & Drinks', spent: 412, limit: 500, color: '#FACC15' },
  { id: 'transport', name: 'Transport', spent: 186, limit: 250, color: '#60A5FA' },
  { id: 'shopping', name: 'Shopping', spent: 298, limit: 300, color: '#F472B6' },
  { id: 'bills', name: 'Bills', spent: 245, limit: 400, color: '#A78BFA' },
];

const { width: screenWidth } = Dimensions.get('window');
const CHART_W = screenWidth - 80;
const CHART_H = 130;
const PADDING = { top: 10, bottom: 20, left: 10, right: 10 };
const plotW = CHART_W - PADDING.left - PADDING.right;
const plotH = CHART_H - PADDING.top - PADDING.bottom;

function SpendingTrendChart({ data }) {
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
      <Path d={areaPath} fill="rgba(250,204,21,0.2)" />
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
          fill={themeColors.muted.light}
        >
          {d.m}
        </SvgText>
      ))}
    </Svg>
  );
}

function BudgetBar({ name, spent, limit, color }) {
  const pct = Math.min(100, (spent / limit) * 100);
  const over = pct >= 95;
  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetLabelRow}>
        <Text style={[styles.budgetName, { color: themeColors.foreground.light }]}>{name}</Text>
        <Text style={[styles.budgetAmount, over ? { color: themeColors.warning, fontWeight: '700' } : { color: themeColors.muted.light }]}>
          ${spent} / ${limit}
        </Text>
      </View>
      <View style={[styles.budgetBarBg, { backgroundColor: themeColors.secondary.light }]}>
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

export function ReportsScreen() {
  const { isDark } = useTheme();
  const [periodIndex, setPeriodIndex] = useState(1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.light }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: themeColors.foreground.light }]}>Reports</Text>
            <Text style={[styles.subtitle, { color: themeColors.muted.light }]}>Cloud-synced analytics</Text>
          </View>
          <TouchableOpacity style={styles.pdfBtn}>
            <Download size={14} color={themeColors.black} />
            <Text style={styles.pdfText}>PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabRow, { backgroundColor: themeColors.secondary.light }]}>
          {PERIOD_TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              onPress={() => setPeriodIndex(i)}
              style={[styles.tab, i === periodIndex && styles.tabActive]}
            >
              <Text style={[styles.tabText, i === periodIndex && { fontWeight: '600' }, i !== periodIndex && { color: themeColors.muted.light }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, { borderColor: themeColors.border.light, backgroundColor: themeColors.card.light }]}>
        <View style={styles.trendHeader}>
          <View>
            <Text style={[styles.cardLabel, { color: themeColors.muted.light }]}>Spending Trend</Text>
            <Text style={[styles.trendValue, { color: themeColors.foreground.light }]}>
              $1,283<Text style={[styles.trendSub, { color: themeColors.muted.light }]}>/1,500</Text>
            </Text>
          </View>
          <View style={styles.trendBadge}>
            <TrendingDown size={12} color={themeColors.success} />
            <Text style={[styles.trendBadgeText, { color: themeColors.success }]}>-8% vs Feb</Text>
          </View>
        </View>
        <SpendingTrendChart data={mockMonthlyTrend} />
      </View>

      <View style={[styles.card, { borderColor: themeColors.border.light, backgroundColor: themeColors.card.light }]}>
        <Text style={[styles.cardTitle, { color: themeColors.foreground.light }]}>Category Breakdown</Text>
        <CategoryChart data={mockSpendingByCategory} />
      </View>

      <View style={[styles.card, { borderColor: themeColors.border.light, backgroundColor: themeColors.card.light }]}>
        <Text style={[styles.cardTitle, { color: themeColors.foreground.light }]}>Budget Performance</Text>
        <View style={styles.budgetList}>
          {mockBudgets.map((b) => (
            <BudgetBar key={b.id} {...b} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8 },
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
  },
  tab: { flex: 1, paddingVertical: 6, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: themeColors.card.light },
  tabText: { fontSize: 12, fontWeight: '500' },
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between' },
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
});
