import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import {
  ChevronRight,
  Bell,
  Shield,
  Globe,
  Lock,
  Eye,
  Database,
  HelpCircle,
  FileText,
  Info,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

export function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background[colorScheme] }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.foreground[colorScheme] }]}>Settings</Text>
      </View>

      <View style={styles.body}>
        <Section label="PREFERENCES" isDark={isDark}>
          <SettingsRow Icon={Bell} label="Notifications" right={<Switch value={true} trackColor={{ false: '#E2E8F0', true: themeColors.gold }} thumbColor={themeColors.gold} />} isDark={isDark} />
          <SettingsRow Icon={Eye} label="Appearance" right={<Text style={{ fontSize: 12, color: themeColors.muted[colorScheme] }}>{isDark ? 'Dark' : 'Light'}</Text>} isDark={isDark} hasArrow />
          <SettingsRow Icon={Globe} label="Currency" right={<Text style={{ fontSize: 12, color: themeColors.muted[colorScheme] }}>USD ($)</Text>} isDark={isDark} hasArrow />
          <SettingsRow Icon={Globe} label="Language" right={<Text style={{ fontSize: 12, color: themeColors.muted[colorScheme] }}>English</Text>} isDark={isDark} hasArrow />
        </Section>

        <Section label="SECURITY" isDark={isDark}>
          <SettingsRow Icon={Lock} label="PIN / Biometric" right={<Switch value={false} trackColor={{ false: '#E2E8F0', true: themeColors.gold }} thumbColor={themeColors.gold} />} isDark={isDark} />
          <SettingsRow Icon={Eye} label="Hide Balance" right={<Switch value={false} trackColor={{ false: '#E2E8F0', true: themeColors.gold }} thumbColor={themeColors.gold} />} isDark={isDark} />
          <SettingsRow Icon={Shield} label="Privacy & Security" isDark={isDark} hasArrow />
        </Section>

        <Section label="DATA" isDark={isDark}>
          <SettingsRow Icon={Database} label="Data Usage" isDark={isDark} hasArrow />
          <SettingsRow Icon={Database} label="Export Data" isDark={isDark} hasArrow />
        </Section>

        <Section label="SUPPORT" isDark={isDark}>
          <SettingsRow Icon={HelpCircle} label="Help Center" isDark={isDark} hasArrow />
          <SettingsRow Icon={FileText} label="Terms of Service" isDark={isDark} hasArrow />
          <SettingsRow Icon={FileText} label="Privacy Policy" isDark={isDark} hasArrow />
        </Section>

        <Section label="ABOUT" isDark={isDark}>
          <SettingsRow Icon={Info} label="Version" right={<Text style={{ fontSize: 12, color: themeColors.muted[colorScheme] }}>1.0.0</Text>} isDark={isDark} />
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ label, children, isDark }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
        {label}
      </Text>
      <View style={[styles.menuGroup, { backgroundColor: themeColors.card[isDark ? 'dark' : 'light'] }]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ Icon, label, right, hasArrow, isDark }) {
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: themeColors.border[isDark ? 'dark' : 'light'] }]}>
      <View style={[styles.rowIcon, { backgroundColor: themeColors.secondary[isDark ? 'dark' : 'light'] }]}>
        <Icon size={16} color={themeColors.foreground[isDark ? 'dark' : 'light']} />
      </View>
      <Text style={[styles.rowLabel, { color: themeColors.foreground[isDark ? 'dark' : 'light'] }]}>{label}</Text>
      <View style={styles.rowRight}>
        {right}
        {hasArrow && <ChevronRight size={16} color={themeColors.muted[isDark ? 'dark' : 'light']} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginLeft: 8 },
  menuGroup: { borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
