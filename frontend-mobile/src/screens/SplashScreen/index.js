import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Coins, TrendingUp, Wallet } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { BrandLogo } from '../../components/BrandLogo';

export function SplashScreen({ onFinish }) {
  const dotAnimations = useRef([...Array(3)].map(() => new Animated.Value(0.4)));

  useEffect(() => {
    const anims = dotAnimations.current.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ]),
        { delay: i * 200 },
      ),
    );
    anims.forEach((a) => a.start());

    const timer = setTimeout(() => onFinish?.(), 2500);
    return () => {
      anims.forEach((a) => a.stop());
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <View style={styles.iconTopLeft}>
        <View style={styles.goldIconWrap}>
          <Coins size={24} color={colors.black} />
        </View>
      </View>
      <View style={styles.iconTopRight}>
        <View style={styles.glassIcon}>
          <TrendingUp size={24} color={colors.gold} />
        </View>
      </View>
      <View style={styles.iconBottomLeft}>
        <View style={styles.glassIcon}>
          <Wallet size={24} color={colors.gold} />
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <View style={styles.pulseGlow} />
          <BrandLogo size={42} variant="white" animated={true} showSubtitle={true} />
        </View>

        <View style={styles.loader}>
          <View style={styles.dots}>
            {dotAnimations.current.map((anim, i) => (
              <Animated.View
                key={i}
                style={[styles.dot, { opacity: anim }]}
              />
            ))}
          </View>
          <Text style={styles.loaderText}>Securing your wallet...</Text>
        </View>
      </View>

      <Text style={styles.footer}>Powered by Cloud Automation-new#</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: 'rgba(250,204,21,0.2)',
    opacity: 0.3,
  },
  bgOrb2: {
    position: 'absolute',
    bottom: -96,
    right: -64,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(250,204,21,0.1)',
    opacity: 0.3,
  },
  iconTopLeft: {
    position: 'absolute',
    top: 128,
    left: 40,
  },
  iconTopRight: {
    position: 'absolute',
    top: 176,
    right: 48,
  },
  iconBottomLeft: {
    position: 'absolute',
    bottom: 176,
    left: 48,
  },
  goldIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 32,
    zIndex: 10,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  pulseGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: 'rgba(250,204,21,0.08)',
  },
  loader: {
    alignItems: 'center',
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  loaderText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
});
