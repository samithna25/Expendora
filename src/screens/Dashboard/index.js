import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Bell, ArrowUpRight, Sparkles, Plus, ScanLine, Send, PiggyBank, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { CategoryChart } from '../../components/CategoryChart';
import { ExpenseCard } from '../../components/ExpenseCard';
import { borderRadius, spacing } from '../../theme/spacing';
import { formatCurrency } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

const mockSpendingByCategory = [
  { name: 'Food', value: 412, color: '#FACC15' },
  { name: 'Transport', value: 186, color: '#60A5FA' },
  { name: 'Shopping', value: 298, color: '#F472B6' },
  { name: 'Bills', value: 245, color: '#A78BFA' },
  { name: 'Other', value: 142, color: '#94A3B8' },
];

const mockTransactions = [
  { id: '1', merchant: 'Starbucks Coffee', category: 'food', amount: 6.75, date: 'Today, 09:12', method: 'Apple Pay' },
  { id: '2', merchant: 'Uber Ride', category: 'transport', amount: 14.30, date: 'Today, 08:40', method: 'Card •• 4218' },
  { id: '3', merchant: 'Spotify Premium', category: 'entertainment', amount: 9.99, date: 'Yesterday', method: 'Auto-debit' },
  { id: '4', merchant: 'Whole Foods', category: 'food', amount: 78.42, date: 'Yesterday', method: 'Card •• 4218' },
];

export function DashboardScreen({ navigation }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const monthly = 1283.42;
  const budgetRemaining = 216.58;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold }]}>
        <View style={styles.bgOrb1} />
        <View style={styles.bgOrb2} />

        <View style={styles.topRow}>
          <Text style={[styles.logo, { color: themeColors.gold }]}>EXPENDORA</Text>
          <TouchableOpacity style={[styles.notifBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Bell size={16} color={themeColors.white} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={[styles.greeting, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
            Good morning, Alex 👋
          </Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={[styles.balanceLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                TOTAL BALANCE
              </Text>
              <Text style={[styles.balanceAmount, { color: themeColors.foreground[colorScheme] }]}>
                <Text style={{ color: themeColors.gold }}>$</Text>4,820
                <Text style={{ opacity: 0.5 }}>.36</Text>
              </Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <TrendingUp size={12} color={themeColors.success} />
              <Text style={[styles.trendText, { color: themeColors.success }]}>+12.4%</Text>
            </View>
          </View>
        </View>

        <View style={styles.miniStats}>
          <MiniStat label="Spent" value={`${formatCurrency(monthly)}`} sub="this month" isDark={isDark} />
          <MiniStat label="Budget" value={`${formatCurrency(budgetRemaining)}`} sub="remaining" isDark={isDark} gold />
          <MiniStat label="Saved" value="$612" sub="vs. last mo" isDark={isDark} success />
        </View>
      </View>

      <View style={styles.quickActions}>
        {[
          { Icon: ScanLine, label: 'Scan', gold: true },
          { Icon: Plus, label: 'Add' },
          { Icon: Send, label: 'Send' },
          { Icon: PiggyBank, label: 'Save' },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionItem}>
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

      <View style={[styles.insightCard, { borderColor: 'rgba(250,204,21,0.3)', backgroundColor: isDark ? 'rgba(250,204,21,0.08)' : 'rgba(250,204,21,0.12)' }]}>
        <View style={styles.insightIcon}>
          <Sparkles size={16} color={themeColors.black} />
        </View>
        <View style={styles.insightContent}>
          <Text style={[styles.insightTitle, { color: themeColors.gold }]}>AI INSIGHT</Text>
          <Text style={[styles.insightText, { color: themeColors.foreground[colorScheme] }]}>
            You spent <Text style={{ fontWeight: '700' }}>28% more</Text> on food this week. Cooking 2 meals at home could save ~$48.
          </Text>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: themeColors.card[colorScheme], borderColor: themeColors.border[colorScheme] }]}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: themeColors.foreground[colorScheme] }]}>Spending by Category</Text>
            <Text style={[styles.chartSub, { color: themeColors.muted[colorScheme] }]}>March 2026</Text>
          </View>
          <TouchableOpacity style={styles.chartAction}>
            <Text style={[styles.chartActionText, { color: themeColors.gold }]}>Details</Text>
            <ArrowUpRight size={12} color={themeColors.gold} />
          </TouchableOpacity>
        </View>
        <CategoryChart data={mockSpendingByCategory} />
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: themeColors.foreground[colorScheme] }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Expenses')}>
            <Text style={[styles.recentSeeAll, { color: themeColors.gold }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentList}>
          {mockTransactions.map((t) => (
            <ExpenseCard key={t.id} transaction={t} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

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
      <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          {
            color: gold ? themeColors.gold : success ? themeColors.success : themeColors.foreground[colorScheme],
          },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statSub, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>{sub}</Text>
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
  logo: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
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
  balanceSection: {
    marginTop: 20,
    position: 'relative',
  },
  greeting: {
    fontSize: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  balanceLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  miniStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    position: 'relative',
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statSub: {
    fontSize: 9,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
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
  insightTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
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
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartSub: {
    fontSize: 11,
    marginTop: 2,
  },
  chartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  chartActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 100,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentSeeAll: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentList: {
    marginTop: 12,
    gap: 8,
  },
});
