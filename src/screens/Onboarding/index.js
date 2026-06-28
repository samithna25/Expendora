import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import { ScanLine, PiggyBank, FileBarChart, ArrowRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    Icon: ScanLine,
    title: 'Scan Receipts in Seconds',
    desc: 'AI-powered OCR captures every line item. No more manual typing — just point, snap, and we\'ll log it.',
    accent: colors.gold,
  },
  {
    Icon: PiggyBank,
    title: 'Stay on Top of Your Budget',
    desc: 'Set category limits, get smart alerts, and watch your savings grow with real-time tracking.',
    accent: colors.gold,
  },
  {
    Icon: FileBarChart,
    title: 'Automated Cloud Reports',
    desc: 'Monthly insights delivered to your inbox. Export-ready PDFs synced across all your devices.',
    accent: colors.gold,
  },
];

export function OnboardingScreen({ onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const s = slides[currentIndex];

  const goNext = () => {
    if (currentIndex < 2) {
      Animated.timing(slideAnim, {
        toValue: currentIndex + 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentIndex(currentIndex + 1);
    } else {
      onDone();
    }
  };

  const skip = () => onDone();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {slides.map((_, k) => (
            <View
              key={k}
              style={[
                styles.dot,
                k === currentIndex ? styles.dotActive : styles.dotInactive,
                k === currentIndex && { width: 24 },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={styles.slideContent}>
        <View style={styles.iconSection}>
          <View style={styles.iconGlow} />
          <View style={[styles.iconBox]}>
            <s.Icon size={80} color={colors.black} strokeWidth={1.6} />
          </View>
          <View style={styles.decoRect} />
          <View style={styles.decoCircle} />
        </View>

        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.desc}>{s.desc}</Text>
      </Animated.View>

      <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
        <Text style={styles.nextText}>
          {currentIndex < 2 ? 'Continue' : 'Get Started'}
        </Text>
        <ArrowRight size={16} color={colors.black} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 96,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.gold,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#E2E8F0',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  iconSection: {
    position: 'relative',
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    top: -24,
    left: -24,
    right: -24,
    bottom: -24,
    borderRadius: 160,
    backgroundColor: 'rgba(250,204,21,0.2)',
  },
  iconBox: {
    width: 176,
    height: 176,
    borderRadius: 32,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decoRect: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.foreground.light,
  },
  decoCircle: {
    position: 'absolute',
    bottom: -12,
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.foreground.light,
    backgroundColor: colors.background.light,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    color: colors.foreground.light,
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: '#94A3B8',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.foreground.light,
    paddingVertical: 16,
    borderRadius: 24,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background.light,
  },
});
