import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { Bell, ChevronRight, CreditCard, HelpCircle, LogOut, Star } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background[isDark ? 'dark' : 'light'] }]}
      contentContainerStyle={{ paddingBottom: 110 + Math.max(insets.bottom, 12) }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.gold, paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.headerOrb} />

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
            <View style={styles.verifiedBadge}>
              <Star size={10} color={themeColors.white} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: themeColors.white }]}>
              {user?.name || 'Alex Morgan'}
            </Text>
            <Text style={[styles.email, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
              {user?.email || 'alex.morgan@expendora.com'}
            </Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO MEMBER</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statsRow, { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Stat label="Receipts" value="142" isDark={isDark} />
          <Stat label="Saved" value="$612" gold isDark={isDark} />
          <Stat label="Streak" value="28d" isDark={isDark} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
            ACCOUNT
          </Text>
          <View style={styles.menuGroup}>
            <Row Icon={CreditCard} label="Payment Methods" right="2 cards" isDark={isDark} />
            <Row Icon={Bell} label="Notifications" right="On" isDark={isDark} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
            PREFERENCES
          </Text>
          <View style={[styles.menuGroup, { backgroundColor: themeColors.card[isDark ? 'dark' : 'light'] }]}>
            <View style={[styles.themeRow, { borderBottomWidth: 1, borderBottomColor: themeColors.border[isDark ? 'dark' : 'light'] }]}>
              <Text style={[styles.themeLabel, { color: themeColors.foreground[isDark ? 'dark' : 'light'] }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E2E8F0', true: themeColors.gold }}
                thumbColor={isDark ? themeColors.black : '#fff'}
              />
            </View>
            <Row Icon={HelpCircle} label="Help & Support" isDark={isDark} />
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)' }]}>
          <LogOut size={16} color={themeColors.destructive} />
          <Text style={[styles.logoutText, { color: themeColors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
            Version 1.0.0 · Cloud Edition
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, gold, isDark }) {
  return (
    <View style={styles.statItem}>
      <Text
        style={[
          styles.statValue,
          { color: gold ? themeColors.gold : isDark ? themeColors.white : themeColors.foreground.light },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>{label}</Text>
    </View>
  );
}

function Row({ Icon, label, right, isDark }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: themeColors.secondary[isDark ? 'dark' : 'light'] }]}>
        <Icon size={16} color={themeColors.foreground[isDark ? 'dark' : 'light']} />
      </View>
      <Text style={[styles.rowLabel, { color: themeColors.foreground[isDark ? 'dark' : 'light'] }]}>{label}</Text>
      <View style={styles.rowRight}>
        {right && (
          <Text style={[styles.rowRightText, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
            {right}
          </Text>
        )}
        <ChevronRight size={16} color={themeColors.muted[isDark ? 'dark' : 'light']} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  profileSection: { flexDirection: 'row', gap: 16, marginTop: 24, position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: themeColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: themeColors.black },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: themeColors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: themeColors.background.light,
  },
  profileInfo: { justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 12, marginTop: 2 },
  proBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(250,204,21,0.2)',
    alignSelf: 'flex-start',
  },
  proBadgeText: { fontSize: 10, fontWeight: '700', color: themeColors.gold },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  body: { paddingHorizontal: 20, marginTop: 20, paddingBottom: 100 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginLeft: 8 },
  menuGroup: { borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowRightText: { fontSize: 12 },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: { fontSize: 14, fontWeight: '600' },
  footer: { alignItems: 'center', paddingTop: 24, opacity: 0.6 },
  version: { fontSize: 10, marginTop: 4 },
});
