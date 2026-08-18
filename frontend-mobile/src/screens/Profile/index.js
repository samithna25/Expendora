import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { Bell, ChevronRight, LogOut, Camera, Star, FileText, ShieldCheck, Info, Settings } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../context/SettingsContext';

export function ProfileScreen() {
  const { isDark } = useTheme();
  const { user, logout, uploadProfilePicture } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colorScheme = isDark ? 'dark' : 'light';
  const { fontSizeScale } = useSettings();
  const processImage = async (result) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploading(true);
      try {
        await uploadProfilePicture(result.assets[0].uri);
      } catch (error) {
        Alert.alert('Upload Failed', error.message || 'Could not upload profile picture.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const pickImageFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    processImage(result);
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    processImage(result);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background[isDark ? 'dark' : 'light'] }]}
      contentContainerStyle={{ paddingBottom: 110 + Math.max(insets.bottom, 12) }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a2e' : themeColors.card.light, paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.headerOrb} />

        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatar} onPress={() => {
            Alert.alert('Profile Photo', 'Choose an option', [
              { text: 'Take Photo', onPress: pickImageFromCamera },
              { text: 'Choose from Library', onPress: pickImageFromLibrary },
              { text: 'Cancel', style: 'cancel' }
            ]);
          }} disabled={isUploading}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'A'}</Text>
            )}
            <View style={styles.verifiedBadge}>
              <Camera size={10} color={themeColors.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: isDark ? themeColors.white : themeColors.black, fontSize: 16 * fontSizeScale }]}>
              {user?.name}
            </Text>
            <Text style={[styles.email, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 12 * fontSizeScale }]}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
            ACCOUNT
          </Text>
          <View style={styles.menuGroup}>
            <Row Icon={Bell} label="Notifications" right="On" isDark={isDark} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
            PREFERENCES
          </Text>
          <View style={[styles.menuGroup, { backgroundColor: themeColors.card[isDark ? 'dark' : 'light'] }]}>
            <Row
              Icon={Settings}
              label="Settings"
              isDark={isDark}
              onPress={() => navigation.navigate('Settings')}
            />
            <Row
              Icon={FileText}
              label="Terms & Conditions"
              isDark={isDark}
              onPress={() => navigation.navigate('Legal', { section: 'terms' })}
            />
            <Row
              Icon={ShieldCheck}
              label="Privacy Policy"
              isDark={isDark}
              onPress={() => navigation.navigate('Legal', { section: 'privacy' })}
            />
            <Row
              Icon={Info}
              label="About Us"
              isDark={isDark}
              onPress={() => navigation.navigate('Legal', { section: 'about' })}
            />
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)' }]}>
          <LogOut size={16} color={themeColors.destructive} />
          <Text style={[styles.logoutText, { color: themeColors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
            Version 1.0.0 · new#
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}




function Row({ Icon, label, right, isDark, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { borderBottomWidth: 1, borderBottomColor: themeColors.border[isDark ? 'dark' : 'light'] }]}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
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
    </TouchableOpacity>
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
    backgroundColor: 'rgba(249,115,22,0.25)',
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
  avatarImage: { width: '100%', height: '100%', borderRadius: 16 },
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
    backgroundColor: 'rgba(249,115,22,0.2)',
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
