import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { InputField } from '../../components/InputField';
import { CustomButton } from '../../components/CustomButton';
import { colors } from '../../theme/colors';
import { authService } from '../../services/authService';
import { BrandLogo } from '../../components/BrandLogo';

export function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const token = route.params?.token ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const goToLogin = () => {
    const routeNames = navigation.getState?.()?.routeNames || [];
    if (routeNames.includes('Login')) {
      navigation.navigate('Login');
      return;
    }

    navigation.navigate('Auth', { screen: 'Login' });
  };

  const handleReset = async () => {
    const errs = {};
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!token) {
      setErrors({ general: 'Invalid or missing reset token. Please request a new link.' });
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (e) {
      setErrors({ general: e.message || 'Failed to reset password. The link may have expired.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.bgOrb1} />
        <View style={styles.bgOrb2} />
        <View style={styles.successContainer}>
          <CheckCircle size={64} color={colors.gold} />
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successSub}>
            Your password has been updated successfully. You can now sign in with your new password.
          </Text>
          <CustomButton
            title="Go to Sign In"
            onPress={goToLogin}
            variant="gold"
            icon={ArrowRight}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <BrandLogo
          size={32}
          variant="white"
          animated={true}
          spinDuration={2000}
          showSubtitle={false}
          style={{ marginBottom: 12 }}
        />

        <View style={styles.headerText}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Choose a strong password for your account</Text>
        </View>

        <View style={styles.card}>
          <InputField
            icon={Lock}
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />
          <InputField
            icon={Lock}
            placeholder="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            error={errors.confirm}
          />

          {errors.general ? (
            <Text style={styles.generalError}>{errors.general}</Text>
          ) : null}

          {!token ? (
            <Text style={styles.generalError}>
              No reset token found. Please use the link from your email.
            </Text>
          ) : null}

          <CustomButton
            title="Reset Password"
            onPress={handleReset}
            variant="gold"
            loading={loading}
            icon={ArrowRight}
          />
        </View>

        <TouchableOpacity
          onPress={goToLogin}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            Remember your password?{' '}
            <Text style={styles.switchLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    top: -80,
    right: 0,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(250,204,21,0.25)',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 0,
    left: -80,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: 'rgba(250,204,21,0.1)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 24,
    justifyContent: 'center',
  },
  headerText: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
  },
  generalError: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  switchRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  switchLink: {
    color: colors.gold,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    marginTop: 8,
  },
  successSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
