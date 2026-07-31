import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Mail, Lock, ArrowRight, Apple } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { InputField } from '../../components/InputField';
import { CustomButton } from '../../components/CustomButton';
import { colors } from '../../theme/colors';
import { isValidEmail, isValidPassword, isValidName } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/BrandLogo';

export function RegisterScreen() {
  const { register } = useAuth();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const errs = {};
    if (!isValidName(name)) errs.name = 'Name must be at least 2 characters';
    if (!isValidEmail(email)) errs.email = 'Valid email required';
    if (!isValidPassword(password)) errs.password = 'Password must be 6+ characters';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (e) {
      setErrors({ general: e.message || 'Registration failed. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <View style={styles.content}>
        <BrandLogo size={32} variant="white" animated={true} spinDuration={2000} showSubtitle={false} style={{ marginBottom: 12 }} />

        <View style={styles.headerText}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start tracking smarter in seconds</Text>
        </View>

        <View style={styles.card}>
          <InputField
            icon={User}
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            error={errors.name}
          />
          <InputField
            icon={Mail}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
          />
          <InputField
            icon={Lock}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          {errors.general && (
            <Text style={styles.generalError}>{errors.general}</Text>
          )}

          <CustomButton
            title="Create Account"
            onPress={handleRegister}
            variant="gold"
            loading={loading}
            icon={ArrowRight}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Apple size={16} color={colors.white} />
              <Text style={styles.socialBtnText}> Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchRow}>
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={styles.switchLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
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
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 24,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
    letterSpacing: 3,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  socialBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
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
  terms: {
    marginTop: 20,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
