import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch, Modal, FlatList, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import {
  ChevronRight, Globe, Lock, Type, Hash, Moon, X, Check, Eye, EyeOff,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSettings, CURRENCIES, FONT_SIZES, NUMBER_FORMATS } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { colors as themeColors } from '../../theme/colors';
import { authService } from '../../services/authService';

const { width: SCREEN_W } = Dimensions.get('window');

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const {
    currency, setCurrency,
    fontSizeKey, setFontSize, fontSizeScale,
    numberFormatKey, setNumberFormat, numberFormat,
  } = useSettings();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const cs = isDark ? 'dark' : 'light';

  const [modal, setModal] = useState(null); // 'currency' | 'font' | 'number' | 'password'
  const openModal  = (name) => setModal(name);
  const closeModal = () => setModal(null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background[cs] }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <Text style={[styles.title, { color: themeColors.foreground[cs], fontSize: 28 * fontSizeScale }]}>
          Settings
        </Text>
      </View>

      <View style={styles.body}>

        {/* ── PREFERENCES ──────────────────────────── */}
        <Section label="PREFERENCES" isDark={isDark}>
          <SettingsRow
            Icon={Globe}
            label="Currency"
            right={
              <Text style={{ fontSize: 12 * fontSizeScale, color: themeColors.muted[cs] }}>
                {currency.code} ({currency.symbol})
              </Text>
            }
            isDark={isDark}
            hasArrow
            onPress={() => openModal('currency')}
          />
          <SettingsRow
            Icon={Type}
            label="Font Size"
            right={
              <Text style={{ fontSize: 12 * fontSizeScale, color: themeColors.muted[cs] }}>
                {FONT_SIZES.find(f => f.key === fontSizeKey)?.label}
              </Text>
            }
            isDark={isDark}
            hasArrow
            onPress={() => openModal('font')}
            isLast
          />
        </Section>

        {/* ── DISPLAY ──────────────────────────────── */}
        <Section label="DISPLAY" isDark={isDark}>
          <SettingsRow
            Icon={Hash}
            label="Number Display Format"
            right={
              <Text style={{ fontSize: 12 * fontSizeScale, color: themeColors.muted[cs] }}>
                {numberFormat.label}
              </Text>
            }
            isDark={isDark}
            hasArrow
            onPress={() => openModal('number')}
          />
          {/* Dark Mode inline toggle */}
          <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: themeColors.border[cs] }]}>
            <View style={[styles.rowIcon, { backgroundColor: themeColors.secondary[cs] }]}>
              <Moon size={16} color={themeColors.foreground[cs]} />
            </View>
            <Text style={[styles.rowLabel, { color: themeColors.foreground[cs], fontSize: 14 * fontSizeScale }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#3A3A3A', true: themeColors.gold }}
              thumbColor={isDark ? themeColors.gold : '#888'}
            />
          </View>
        </Section>

        {/* ── SECURITY ─────────────────────────────── */}
        <Section label="SECURITY" isDark={isDark}>
          <SettingsRow
            Icon={Lock}
            label="Change Password"
            isDark={isDark}
            hasArrow
            onPress={() => openModal('password')}
            isLast
          />
        </Section>
      </View>

      {/* ─── Box Modals ─── */}
      <CurrencyModal
        visible={modal === 'currency'}
        selected={currency}
        onSelect={(c) => { setCurrency(c); closeModal(); }}
        onClose={closeModal}
        isDark={isDark}
        fontSizeScale={fontSizeScale}
      />
      <FontSizeModal
        visible={modal === 'font'}
        selected={fontSizeKey}
        onSelect={(k) => { setFontSize(k); closeModal(); }}
        onClose={closeModal}
        isDark={isDark}
        fontSizeScale={fontSizeScale}
      />
      <NumberFormatModal
        visible={modal === 'number'}
        selected={numberFormatKey}
        onSelect={(k) => { setNumberFormat(k); closeModal(); }}
        onClose={closeModal}
        isDark={isDark}
        fontSizeScale={fontSizeScale}
      />
      <ChangePasswordModal
        visible={modal === 'password'}
        onClose={closeModal}
        isDark={isDark}
        fontSizeScale={fontSizeScale}
        token={token}
      />
    </ScrollView>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ label, children, isDark }) {
  const cs = isDark ? 'dark' : 'light';
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: themeColors.muted[cs] }]}>{label}</Text>
      <View style={[styles.menuGroup, { backgroundColor: themeColors.card[cs] }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({ Icon, label, right, hasArrow, isDark, isLast, onPress }) {
  const cs = isDark ? 'dark' : 'light';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.border[cs] },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: themeColors.secondary[cs] }]}>
        <Icon size={16} color={themeColors.foreground[cs]} />
      </View>
      <Text style={[styles.rowLabel, { color: themeColors.foreground[cs] }]}>{label}</Text>
      <View style={styles.rowRight}>
        {right}
        {hasArrow && <ChevronRight size={16} color={themeColors.muted[cs]} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Centered Box Modal shell ─────────────────────────────────────────────────
function BoxModal({ visible, onClose, title, isDark, fontSizeScale, children }) {
  const cs = isDark ? 'dark' : 'light';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.modalBox, { backgroundColor: themeColors.card[cs], width: SCREEN_W * 0.88 }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border[cs] }]}>
            <Text style={[styles.modalTitle, { color: themeColors.foreground[cs], fontSize: 15 * fontSizeScale }]}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: themeColors.secondary[cs] }]}
            >
              <X size={15} color={themeColors.muted[cs]} />
            </TouchableOpacity>
          </View>

          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Currency Modal ───────────────────────────────────────────────────────────
function CurrencyModal({ visible, selected, onSelect, onClose, isDark, fontSizeScale }) {
  const cs = isDark ? 'dark' : 'light';
  return (
    <BoxModal visible={visible} onClose={onClose} title="Select Currency" isDark={isDark} fontSizeScale={fontSizeScale}>
      <FlatList
        data={CURRENCIES}
        keyExtractor={(item) => item.code}
        style={{ maxHeight: 380 }}
        contentContainerStyle={{ paddingVertical: 6 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isSelected = selected.code === item.code;
          const isLast = index === CURRENCIES.length - 1;
          return (
            <TouchableOpacity
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
              style={[
                styles.optionRow,
                isSelected && { backgroundColor: `${themeColors.gold}15` },
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.border[cs] },
              ]}
            >
              <View style={[
                styles.symbolBadge,
                { backgroundColor: isSelected ? themeColors.gold : themeColors.secondary[cs] },
              ]}>
                <Text style={[styles.symbolText, { color: isSelected ? themeColors.black : themeColors.foreground[cs] }]}>
                  {item.symbol}
                </Text>
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={[styles.optionLabel, { color: themeColors.foreground[cs], fontSize: 14 * fontSizeScale }]}>
                  {item.code}
                </Text>
                <Text style={[styles.optionSubLabel, { color: themeColors.muted[cs], fontSize: 11 * fontSizeScale }]}>
                  {item.label}
                </Text>
              </View>
              {isSelected && <Check size={17} color={themeColors.gold} />}
            </TouchableOpacity>
          );
        }}
      />
    </BoxModal>
  );
}

// ─── Font Size Modal ──────────────────────────────────────────────────────────
function FontSizeModal({ visible, selected, onSelect, onClose, isDark, fontSizeScale }) {
  const cs = isDark ? 'dark' : 'light';
  return (
    <BoxModal visible={visible} onClose={onClose} title="Font Size" isDark={isDark} fontSizeScale={fontSizeScale}>
      <View style={{ paddingVertical: 6 }}>
        {FONT_SIZES.map((item, index) => {
          const isSelected = selected === item.key;
          const isLast = index === FONT_SIZES.length - 1;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onSelect(item.key)}
              activeOpacity={0.7}
              style={[
                styles.optionRow,
                isSelected && { backgroundColor: `${themeColors.gold}15` },
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.border[cs] },
              ]}
            >
              <View style={[
                styles.symbolBadge,
                { backgroundColor: isSelected ? themeColors.gold : themeColors.secondary[cs] },
              ]}>
                <Text style={[
                  styles.symbolText,
                  { color: isSelected ? themeColors.black : themeColors.foreground[cs], fontSize: item.scale * 13 },
                ]}>
                  Aa
                </Text>
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={[styles.optionLabel, { color: themeColors.foreground[cs], fontSize: 14 * item.scale }]}>
                  {item.label}
                </Text>
                <Text style={[styles.optionSubLabel, { color: themeColors.muted[cs], fontSize: 11 }]}>
                  Scale ×{item.scale}
                </Text>
              </View>
              {isSelected && <Check size={17} color={themeColors.gold} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BoxModal>
  );
}

// ─── Number Format Modal ──────────────────────────────────────────────────────
function NumberFormatModal({ visible, selected, onSelect, onClose, isDark, fontSizeScale }) {
  const cs = isDark ? 'dark' : 'light';
  return (
    <BoxModal visible={visible} onClose={onClose} title="Number Display Format" isDark={isDark} fontSizeScale={fontSizeScale}>
      <View style={{ paddingVertical: 6 }}>
        {NUMBER_FORMATS.map((item, index) => {
          const isSelected = selected === item.key;
          const isLast = index === NUMBER_FORMATS.length - 1;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onSelect(item.key)}
              activeOpacity={0.7}
              style={[
                styles.optionRow,
                isSelected && { backgroundColor: `${themeColors.gold}15` },
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.border[cs] },
              ]}
            >
              <View style={[
                styles.symbolBadge,
                { backgroundColor: isSelected ? themeColors.gold : themeColors.secondary[cs] },
              ]}>
                <Hash size={14} color={isSelected ? themeColors.black : themeColors.foreground[cs]} />
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={[styles.optionLabel, { color: themeColors.foreground[cs], fontSize: 15 * fontSizeScale }]}>
                  {item.label}
                </Text>
                <Text style={[styles.optionSubLabel, { color: themeColors.muted[cs], fontSize: 11 * fontSizeScale }]}>
                  {item.separator === ' ' ? 'Space' : item.separator === '' ? 'No separator' : `"${item.separator}"`} · "{item.decimal}" decimal
                </Text>
              </View>
              {isSelected && <Check size={17} color={themeColors.gold} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BoxModal>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose, isDark, fontSizeScale, token }) {
  const cs = isDark ? 'dark' : 'light';

  const [currentPw,   setCurrentPw]   = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const reset = () => {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setShowCurrent(false); setShowNew(false); setShowConfirm(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({ currentPassword: currentPw, newPassword: newPw });
      Alert.alert('Success ✓', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: handleClose },
      ]);
    } catch (err) {
      const msg = err?.message ?? 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: themeColors.secondary[cs],
      color: themeColors.foreground[cs],
      borderColor: themeColors.border[cs],
    },
  ];
  const labelStyle = [styles.inputLabel, { color: themeColors.muted[cs], fontSize: 11 * fontSizeScale }];

  return (
    <BoxModal visible={visible} onClose={handleClose} title="Change Password" isDark={isDark} fontSizeScale={fontSizeScale}>
      <View style={styles.passwordForm}>

        {/* Current Password */}
        <Text style={labelStyle}>Current Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[inputStyle, styles.inputWithIcon]}
            placeholder="Enter current password"
            placeholderTextColor={themeColors.muted[cs]}
            secureTextEntry={!showCurrent}
            value={currentPw}
            onChangeText={setCurrentPw}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
            {showCurrent ? <EyeOff size={15} color={themeColors.muted[cs]} /> : <Eye size={15} color={themeColors.muted[cs]} />}
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <Text style={[labelStyle, { marginTop: 12 }]}>New Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[inputStyle, styles.inputWithIcon]}
            placeholder="Min 8 characters"
            placeholderTextColor={themeColors.muted[cs]}
            secureTextEntry={!showNew}
            value={newPw}
            onChangeText={setNewPw}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
            {showNew ? <EyeOff size={15} color={themeColors.muted[cs]} /> : <Eye size={15} color={themeColors.muted[cs]} />}
          </TouchableOpacity>
        </View>

        {/* Strength bar */}
        {newPw.length > 0 && <PasswordStrengthBar password={newPw} isDark={isDark} />}

        {/* Confirm Password */}
        <Text style={[labelStyle, { marginTop: 12 }]}>Confirm New Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[inputStyle, styles.inputWithIcon]}
            placeholder="Re-enter new password"
            placeholderTextColor={themeColors.muted[cs]}
            secureTextEntry={!showConfirm}
            value={confirmPw}
            onChangeText={setConfirmPw}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
            {showConfirm ? <EyeOff size={15} color={themeColors.muted[cs]} /> : <Eye size={15} color={themeColors.muted[cs]} />}
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        >
          {loading
            ? <ActivityIndicator size="small" color={themeColors.black} />
            : <Text style={[styles.submitText, { fontSize: 14 * fontSizeScale }]}>Update Password</Text>}
        </TouchableOpacity>
      </View>
    </BoxModal>
  );
}

// ─── Password Strength Bar ────────────────────────────────────────────────────
function PasswordStrengthBar({ password, isDark }) {
  const cs = isDark ? 'dark' : 'light';
  const score = getPasswordStrength(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const barColors = ['#F87171', '#FACC15', '#60A5FA', '#4ADE80'];
  const col = barColors[score - 1] ?? themeColors.muted[cs];

  return (
    <View style={{ marginTop: 8, marginBottom: 2 }}>
      <View style={styles.strengthRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthSegment,
              { backgroundColor: i <= score - 1 ? col : themeColors.secondary[cs] },
            ]}
          />
        ))}
      </View>
      <Text style={{ fontSize: 10, color: col, marginTop: 3 }}>{labels[score - 1] ?? ''}</Text>
    </View>
  );
}

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(score, 1);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginLeft: 8 },
  menuGroup: { borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // ── Box Modal ──────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    borderRadius: 20,
    overflow: 'hidden',
    // subtle gold border
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.15)',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontWeight: '700' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Option rows ────────────────────────────────────────────────────────────
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 13,
  },
  symbolBadge: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 13,
  },
  symbolText: { fontSize: 13, fontWeight: '700' },
  optionTextGroup: { flex: 1 },
  optionLabel: { fontWeight: '600' },
  optionSubLabel: { marginTop: 1, opacity: 0.75 },

  // ── Password form ──────────────────────────────────────────────────────────
  passwordForm: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  inputLabel: { fontWeight: '600', marginBottom: 6 },
  inputWrapper: { position: 'relative' },
  input: {
    borderRadius: 11, borderWidth: 1,
    paddingHorizontal: 13, paddingVertical: 11,
    fontSize: 14,
  },
  inputWithIcon: { paddingRight: 42 },
  eyeBtn: {
    position: 'absolute', right: 11,
    top: 0, bottom: 0, justifyContent: 'center',
  },
  submitBtn: {
    marginTop: 18, backgroundColor: '#FACC15',
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center',
  },
  submitText: { fontWeight: '700', color: '#000' },

  // ── Strength bar ───────────────────────────────────────────────────────────
  strengthRow: { flexDirection: 'row', gap: 4 },
  strengthSegment: { flex: 1, height: 3, borderRadius: 2 },
});
