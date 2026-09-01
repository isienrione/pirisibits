import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { ChronoTokens } from '@/src/theme/tokens';
import { fillParent } from '@/src/theme/layout';

export function VintageMap({
  variant = 'day',
  height = 220,
  stopCount = 4,
}: {
  variant?: 'day' | 'night';
  height?: number;
  stopCount?: number;
}) {
  const night = variant === 'night';
  const street = night ? 'rgba(244,239,230,0.28)' : '#C9BBA6';
  const route = ChronoTokens.colors.accentRed;

  return (
    <ImageBackground
      source={require('../../assets/images/mapa-impreso.jpeg')}
      resizeMode="cover"
      style={[styles.wrap, { height }]}
      imageStyle={{ opacity: night ? 0.45 : 0.85 }}
    >
      <View style={[styles.tint, night && styles.tintNight]} />
      <Svg width="100%" height="100%" viewBox="0 0 360 220">
        {[40, 80, 120, 160, 200, 240, 280, 320].map((x) => (
          <Line key={`v${x}`} x1={x} y1="0" x2={x} y2="220" stroke={street} strokeWidth="0.8" opacity={0.45} />
        ))}
        <Path
          d="M40 180 C90 160 110 140 150 120 C190 100 210 90 260 70 C300 55 320 50 340 40"
          stroke={route}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="48" cy="178" r="8" fill="#3B82F6" stroke="#F4EFE6" strokeWidth="2" />
        {[
          { n: '1', x: 150, y: 120 },
          { n: '2', x: 210, y: 90 },
          { n: '3', x: 270, y: 68 },
          { n: '4', x: 330, y: 46 },
          { n: '5', x: 300, y: 110 },
          { n: '6', x: 240, y: 150 },
        ]
          .slice(0, Math.max(1, stopCount))
          .map((p) => (
          <React.Fragment key={p.n}>
            <Circle cx={p.x} cy={p.y} r="11" fill={route} />
            <SvgText x={p.x} y={p.y + 4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="700">
              {p.n}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#E8DFD0',
  },
  tint: {
    ...fillParent,
    backgroundColor: 'rgba(244,239,230,0.18)',
  },
  tintNight: {
    backgroundColor: 'rgba(26, 42, 46, 0.55)',
  },
});
