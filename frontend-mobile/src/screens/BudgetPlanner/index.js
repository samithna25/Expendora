import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Plus, Target, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { BudgetCard } from '../../components/BudgetCard';
import { borderRadius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/formatters';

const mockBudgets = [
  { id: 'food', name: 'Food & Drinks', spent: 412, limit: 500, color: '#FACC15' },
  { id: 'transport', name: 'Transport', spent: 186, limit: 250, color: '#60A5FA' },
  { id: 'shopping', name: 'Shopping', spent: 298, limit: 300, color: '#F472B6' },
  { id: 'bills', name: 'Bills', spent: 245, limit: 400, color: '#A78BFA' },
  { id: 'entertainment', name: 'Entertainment', spent: 92, limit: 150, color: '#34D399' },
];

const mockSavingsGoals = [
  { id: '1', name: 'Emergency Fund', saved: 2400, target: 5000, emoji: '🛟' },
  { id: '2', name: 'New MacBook', saved: 870, target: 1800, emoji: '💻' },
  { id: '3', name: 'Tokyo Trip', saved: 1250, target: 3500, emoji: '✈️' },
];

export function BudgetPlannerScreen() {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  const totalBudget = mockBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = mockBudgets.reduce((s, b) => s + b.spent, 0);
  const pct = (totalSpent / totalBudget) * 100;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold }]}>
        <View style={styles.headerOrb} />
        <Text style={[styles.headerTitle, { color: themeColors.white }]}>Budget Planner</Text>
        <Text style={[styles.headerSub, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
          March 2026
        </Text>
        <View style={styles.overview}>
          <View style={styles.overviewRow}>
            <Text style={[styles.totalSpent, { color: themeColors.white }]}>
              <Text style={{ color: themeColors.gold }}>$</Text>
              {totalSpent}
            </Text>
            <Text style={[styles.ofBudget, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
              of ${totalBudget}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={[styles.progressLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
            {(100 - pct).toFixed(0)}% remaining · {formatCurrency(totalBudget - totalSpent)} left
          </Text>
        </View>
      </View>

      <View style={[styles.alertCard, { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.1)' }]}>
        <AlertTriangle size={16} color={themeColors.warning} />
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: themeColors.foreground[colorScheme] }]}>
            Shopping near limit
          </Text>
          <Text style={[styles.alertDesc, { color: themeColors.muted[colorScheme] }]}>
            $2 left this month — set a stricter cap?
          </Text>
        </View>
      </View>

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
          {mockBudgets.map((b) => (
            <BudgetCard key={b.id} budget={b} />
          ))}
        </View>
      </View>

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
        <View style={styles.goalsList}>
          {mockSavingsGoals.map((g) => {
            const goalPct = (g.saved / g.target) * 100;
            return (
              <View
                key={g.id}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: themeColors.card[colorScheme],
                    borderColor: themeColors.border[colorScheme],
                  },
                ]}
              >
                <View style={styles.goalRow}>
                  <Text style={styles.goalEmoji}>{g.emoji}</Text>
                  <View style={styles.goalInfo}>
                    <View style={styles.goalTop}>
                      <Text style={[styles.goalName, { color: themeColors.foreground[colorScheme] }]}>
                        {g.name}
                      </Text>
                      <Text style={[styles.goalAmount, { color: themeColors.gold }]}>
                        {formatCurrency(g.saved)}
                        <Text style={[styles.goalTarget, { color: themeColors.muted[colorScheme] }]}>
                          {' '}/ {formatCurrency(g.target)}
                        </Text>
                      </Text>
                    </View>
                    <View style={[styles.goalBar, { backgroundColor: themeColors.secondary[colorScheme] }]}>
                      <View style={[styles.goalBarFill, { width: `${goalPct}%` }]} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
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
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 12, fontWeight: '600' },
  budgetList: { gap: 8 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalsList: { gap: 8 },
  goalCard: { borderRadius: 16, borderWidth: 1, padding: 12 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalEmoji: { fontSize: 24 },
  goalInfo: { flex: 1 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between' },
  goalName: { fontSize: 14, fontWeight: '600' },
  goalAmount: { fontSize: 12, fontWeight: '700' },
  goalTarget: { fontWeight: '400' },
  goalBar: { marginTop: 6, height: 6, borderRadius: 3, overflow: 'hidden' },
  goalBarFill: { height: '100%', borderRadius: 3, backgroundColor: themeColors.gold },
});
