import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogIn, ShieldAlert } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

export function SessionExpiredOverlay({ onLoginPress }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <ShieldAlert size={40} color={colors.gold} />
        </View>

        <Text style={styles.title}>Session Expired</Text>

        <Text style={styles.message}>
          Your session has expired.{'\n'}Please log in again to continue.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onLoginPress} activeOpacity={0.8}>
          <LogIn size={18} color={colors.black} />
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  orb1: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(250,204,21,0.25)',
  },
  orb2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(250,204,21,0.1)',
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(250,204,21,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: borderRadius['2xl'],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
});
