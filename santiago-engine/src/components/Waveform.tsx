import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { ChronoTokens } from '@/src/theme/tokens';

const BARS = [
  8, 14, 10, 18, 12, 20, 9, 16, 22, 11, 17, 8, 19, 13, 21, 10, 15, 18, 9, 14, 20, 12, 16, 8, 19, 11,
  17, 13, 21, 10, 15, 18, 9, 14,
];

export function Waveform({
  progress = 0.5,
  height = 28,
  played = ChronoTokens.colors.accentTeal,
  rest = 'rgba(255,255,255,0.55)',
}: {
  progress?: number;
  height?: number;
  played?: string;
  rest?: string;
}) {
  const bars = useMemo(() => BARS, []);
  const playedCount = Math.round(bars.length * progress);

  return (
    <View style={{ height, width: '100%' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${bars.length * 6} ${height}`}>
        {bars.map((h, i) => (
          <Rect
            key={i}
            x={i * 6}
            y={(height - h) / 2}
            width={3}
            height={h}
            rx={1.5}
            fill={i <= playedCount ? played : rest}
          />
        ))}
        <Rect
          x={playedCount * 6}
          y={2}
          width={2}
          height={height - 4}
          fill={ChronoTokens.colors.accentOrange}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
