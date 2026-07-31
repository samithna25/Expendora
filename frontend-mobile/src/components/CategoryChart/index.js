import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';

// ─── Geometry helpers ──────────────────────────────────────────────────────────

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Builds an SVG path for a donut segment (annular arc).
 * The segment spans from startAngle to endAngle (degrees, 0 = top).
 * outerR = outer radius, innerR = inner (hole) radius.
 */
function donutSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle) {
  // Clamp to avoid degenerate paths
  const sweep = Math.min(endAngle - startAngle, 359.9999);
  const end = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd   = polarToCartesian(cx, cy, outerR, end);
  const innerStart = polarToCartesian(cx, cy, innerR, end);
  const innerEnd   = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategoryChart({ data, size = 160, innerRadius = 50, budget }) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = innerRadius;

  // Gap between segments (degrees)
  const GAP = 2;

  let currentAngle = 0;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const startA = currentAngle + GAP / 2;
    const endA   = currentAngle + angle - GAP / 2;
    currentAngle += angle;
    return {
      path: donutSegmentPath(cx, cy, outerR, innerR, startA, endA),
      color: d.color,
      name: d.name,
      value: d.value,
      pct: Math.round((d.value / total) * 100),
    };
  });

  // ── Center label ─────────────────────────────────────────────────────────
  const centerLabel  = budget != null ? 'Budget' : 'Total';
  const centerAmount = budget != null ? budget : total;
  const centerColor  = themeColors.foreground[colorScheme];
  const mutedColor   = themeColors.muted[colorScheme];
  const bgColor      = isDark ? themeColors.background.dark : themeColors.background.light;

  return (
    <View style={styles.wrapper}>
      {/* ── Donut Chart ── */}
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {slices.map((s, i) => (
            <Path key={i} d={s.path} fill={s.color} />
          ))}

          {/* Centre labels */}
          <SvgText
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fontSize={10}
            fontWeight="500"
            fill={mutedColor}
          >
            {centerLabel}
          </SvgText>
          <SvgText
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fontSize={13}
            fontWeight="bold"
            fill={centerColor}
          >
            {formatCurrency(centerAmount)}
          </SvgText>
        </Svg>
      </View>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        {data.slice(0, 5).map((c, i) => (
          <View key={c.name} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <Text
              style={[styles.legendName, { color: mutedColor }]}
              numberOfLines={1}
            >
              {c.name}
            </Text>
            <Text style={[styles.legendValue, { color: centerColor }]}>
              {Math.round((c.value / total) * 100)}%
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
