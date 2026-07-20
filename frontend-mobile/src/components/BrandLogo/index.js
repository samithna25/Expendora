import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StyleSheet } from 'react-native';

const ASSETS = {
  white: {
    expend: require('../../../assets/logo_expend_white.png'),
    ra: require('../../../assets/logo_ra_white.png'),
    subtitle: require('../../../assets/logo_subtitle_white.png'),
  },
  gold: {
    expend: require('../../../assets/logo_expend_gold.png'),
    ra: require('../../../assets/logo_ra_gold.png'),
    subtitle: require('../../../assets/logo_subtitle_gold.png'),
  },
  original: {
    expend: require('../../../assets/logo_expend.png'),
    ra: require('../../../assets/logo_ra.png'),
    subtitle: require('../../../assets/logo_subtitle.png'),
  },
  coin: require('../../../assets/coin.png'),
};

export function BrandLogo({
  size = 40,
  animated = true,
  variant = 'white',
  showSubtitle = true,
  spinDuration = 1800,
  style,
}) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const anim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: spinDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [animated, spinValue, spinDuration]);

  const rotateY = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const selectedTheme = ASSETS[variant] || ASSETS.white;

  // Proportional dimensions based on original logo asset ratios
  const textHeight = size;
  const expendWidth = textHeight * (505 / 86);
  const raWidth = textHeight * (180 / 86);
  const coinSize = textHeight * 0.88;
  const subtitleHeight = textHeight * 0.28;
  const subtitleWidth = textHeight * 4.4;

  return (
    <View style={[styles.container, style]}>
      {/* Logo Row: EXPEND + [ROTATING COIN] + RA */}
      <View style={[styles.logoRow, { height: textHeight }]}>
        <Image
          source={selectedTheme.expend}
          style={{ width: expendWidth, height: textHeight }}
          resizeMode="contain"
        />

        <View style={[styles.coinContainer, { width: coinSize, height: coinSize, marginHorizontal: -size * 0.08 }]}>
          <Animated.Image
            source={ASSETS.coin}
            style={[
              styles.coinImage,
              {
                width: coinSize,
                height: coinSize,
                transform: [{ rotateY }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <Image
          source={selectedTheme.ra}
          style={{ width: raWidth, height: textHeight }}
          resizeMode="contain"
        />
      </View>

      {/* Tagline Subtitle: Track · Save · Grow */}
      {showSubtitle && (
        <Image
          source={selectedTheme.subtitle}
          style={[
            styles.subtitle,
            {
              width: subtitleWidth,
              height: subtitleHeight,
              marginTop: size * 0.2,
            },
          ]}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinImage: {
    backfaceVisibility: 'visible',
  },
  subtitle: {
    alignSelf: 'center',
  },
});
