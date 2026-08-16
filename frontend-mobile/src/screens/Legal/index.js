import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, FileText, ShieldCheck, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LEGAL_CONTENT = {
  terms: {
    title: 'Terms & Conditions',
    icon: FileText,
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By creating an account or using the Expendora app, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please discontinue use of the application.' },
      { heading: '2. Use of the Service', body: 'Expendora provides expense tracking, receipt scanning, and reporting tools for personal financial management. You agree to use the service only for lawful purposes and in accordance with these terms. You are responsible for the accuracy of the information you provide.' },
      { heading: '3. Account Responsibilities', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access or security breach.' },
      { heading: '4. Intellectual Property', body: 'All content, branding, design elements, and software within the app are the property of Expendora or its licensors and are protected by applicable intellectual property laws.' },
      { heading: '5. Limitation of Liability', body: 'Expendora is provided on an "as is" basis. We do not guarantee that the service will be uninterrupted, error-free, or free of harmful components. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages.' },
      { heading: '6. Changes to Terms', body: 'We may update these Terms & Conditions from time to time. Any changes will be posted within the app, and continued use of the service after changes take effect constitutes acceptance of the updated terms.' },
      { heading: '7. Contact', body: 'For any questions about these Terms & Conditions, please reach out through the Help & Support option in your profile settings.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    icon: ShieldCheck,
    sections: [
      { heading: '1. Information We Collect', body: 'We collect information you provide directly, such as your name, email address, and expense data you enter. We also collect usage data to improve the app experience.' },
      { heading: '2. How We Use Your Information', body: 'Your information is used to provide and improve our services, personalize your experience, process transactions, and communicate with you about updates or support requests.' },
      { heading: '3. Data Storage & Security', body: 'Your data is stored on secure servers and protected using industry-standard security measures. We do not sell your personal information to third parties.' },
      { heading: '4. Sharing of Information', body: 'We only share your information with trusted service providers who assist us in operating the app, and only to the extent necessary to provide our services. We never sell your data.' },
      { heading: '5. Your Rights', body: 'You may access, correct, or request deletion of your personal data at any time. You can also export your expense data directly from the app.' },
      { heading: '6. Data Retention', body: 'We retain your data for as long as your account is active or as needed to provide our services. You may request data deletion at any time.' },
      { heading: '7. Changes to This Policy', body: 'We may update this Privacy Policy periodically. Significant changes will be communicated within the app or via email.' },
    ],
  },
  about: {
    title: 'About Us',
    icon: Info,
    sections: [
      { heading: 'Who We Are', body: 'Expendora is a modern expense management platform designed to help individuals and small teams track spending, scan receipts, and understand their financial habits at a glance.' },
      { heading: 'Our Mission', body: 'Our mission is to make financial tracking effortless and accessible. We combine smart receipt scanning with intuitive reporting so you can focus on your goals instead of spreadsheets.' },
      { heading: 'What We Offer', body: 'Smart receipt scanning, automatic expense categorization, monthly reports, budget planning, and a clean, fast interface that respects your privacy.' },
      { heading: 'Contact Us', body: 'We love hearing from our users. For feedback, feature requests, or support, use the Help & Support option in your profile settings or email us at expendora.app@gmail.com and we will get back to you.' },
    ],
  },
};

export function LegalScreen({ route, navigation }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sectionKey = route.params?.section === 'about' ? 'about' : route.params?.section === 'privacy' ? 'privacy' : 'terms';
  const content = LEGAL_CONTENT[sectionKey];
  const Icon = content.icon;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background[isDark ? 'dark' : 'light'] }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={themeColors.foreground[isDark ? 'dark' : 'light']} />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Icon size={20} color={themeColors.gold} />
        </View>
        <Text style={[styles.title, { color: themeColors.foreground[isDark ? 'dark' : 'light'] }]}>
          {content.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 + Math.max(insets.bottom, 12) }}
        showsVerticalScrollIndicator={false}
      >
        {content.sections.map((section) => (
          <View key={section.heading} style={[styles.block, { borderBottomColor: themeColors.border[isDark ? 'dark' : 'light'] }]}>
            <Text style={[styles.heading, { color: themeColors.foreground[isDark ? 'dark' : 'light'] }]}>
              {section.heading}
            </Text>
            <Text style={[styles.body, { color: themeColors.muted[isDark ? 'dark' : 'light'] }]}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(250,204,21,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(250,204,21,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  block: {
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  body: { fontSize: 13, lineHeight: 21 },
});