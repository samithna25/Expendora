import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

export function CategoryChart({ data, size = 140, innerRadius = 44 }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;

  let currentAngle = 0;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const slice = {
      path: describeArc(cx, cy, outerR, currentAngle, currentAngle + angle),
      color: d.color,
      name: d.name,
      value: d.value,
    };
    currentAngle += angle;
    return slice;
  });

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {slices.map((s, i) => (
            <Path key={i} d={s.path} fill={s.color} />
          ))}
          {/* inner circle for donut */}
          <Path
            d={describeArc(cx, cy, innerRadius, 0, 360)}
            fill={isDark ? themeColors.background.dark : themeColors.background.light}
          />
          <SvgText
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontSize={10}
            fill={themeColors.muted[colorScheme]}
          >
            Total
          </SvgText>
          <SvgText
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
            fill={themeColors.foreground[colorScheme]}
          >
            {formatCurrency(total)}
          </SvgText>
        </Svg>
      </View>
      <View style={styles.legend}>
        {data.slice(0, 4).map((c) => (
          <View key={c.name} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <Text style={[styles.legendName, { color: themeColors.muted[colorScheme] }]}>
              {c.name}
            </Text>
            <Text style={[styles.legendValue, { color: themeColors.foreground[colorScheme] }]}>
              {formatCurrency(c.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    flex: 1,
    fontSize: 12,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
