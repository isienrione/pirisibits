import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { ChronoTokens } from '@/src/theme/tokens';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 108;
const DEFAULT_MIN = 30;
const DEFAULT_MAX = 300;
const START = 135;
const SWEEP = 270;

function minutesToAngle(m: number, min: number, max: number) {
  'worklet';
  const t = (m - min) / (max - min);
  return START + t * SWEEP;
}

function polar(angle: number, radius = R) {
  'worklet';
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function describeArc(start: number, end: number) {
  const s = polar(start);
  const e = polar(end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
}

function nearestStop(m: number, stops: number[]) {
  'worklet';
  return stops.reduce((best, n) => (Math.abs(n - m) < Math.abs(best - m) ? n : best), stops[0]);
}

function clampMinutes(m: number, min: number, max: number, stops?: number[]) {
  'worklet';
  if (stops?.length) return nearestStop(Math.max(min, Math.min(max, m)), stops);
  const stepped = Math.round(m / 15) * 15;
  return Math.max(min, Math.min(max, stepped));
}

const DEFAULT_TICKS = [
  { m: 30, label: '30 min' },
  { m: 60, label: '1 h' },
  { m: 120, label: '2 h' },
  { m: 180, label: '3 h' },
  { m: 240, label: '4 h' },
  { m: 300, label: '5 h' },
];

export function TimeBudgetDial({
  minutes,
  onChange,
  stops,
}: {
  minutes: number;
  onChange: (n: number) => void;
  stops?: number[];
}) {
  const min = stops?.length ? stops[0] : DEFAULT_MIN;
  const max = stops?.length ? stops[stops.length - 1] : DEFAULT_MAX;
  const lastTick = useSharedValue(minutes);

  const bump = (next: number) => {
    if (next !== lastTick.value) {
      lastTick.value = next;
      Haptics.selectionAsync();
      onChange(next);
    }
  };

  const gesture = Gesture.Pan().onChange((e) => {
    const dx = e.x - CX;
    const dy = e.y - CY;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    let rel = deg - START;
    if (rel < 0) rel += 360;
    if (rel > SWEEP + 20) rel = 0;
    if (rel > SWEEP) rel = SWEEP;
    const next = clampMinutes(min + (rel / SWEEP) * (max - min), min, max, stops);
    runOnJS(bump)(next);
  });

  const endAngle = minutesToAngle(minutes, min, max);
  const knob = polar(endAngle);
  const hours = minutes / 60;
  const display = hours >= 1 && minutes % 60 === 0 ? String(hours) : hours.toFixed(hours < 1 ? 1 : 0);
  const unit = minutes < 60 ? 'min' : hours === 1 ? 'hora' : 'horas';

  const ticks = useMemo(() => {
    if (stops?.length) {
      return stops.map((m) => ({ m, label: m < 60 ? `${m} min` : `${m / 60} h` }));
    }
    return DEFAULT_TICKS;
  }, [stops]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.wrap}>
        <Svg width={SIZE} height={SIZE}>
          {Array.from({ length: 36 }).map((_, i) => {
            const a = START + (i / 35) * SWEEP;
            const outer = polar(a, R + 8);
            const inner = polar(a, i % 6 === 0 ? R - 8 : R - 4);
            return (
              <Line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={ChronoTokens.colors.inkBlack}
                strokeWidth={i % 6 === 0 ? 1.6 : 0.7}
                opacity={0.55}
              />
            );
          })}
          <Circle cx={CX} cy={CY} r={R} stroke="#D3C9B8" strokeWidth={10} fill="none" />
          <Path
            d={describeArc(START, endAngle)}
            stroke={ChronoTokens.colors.accentRed}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />
          <G>
            <Circle cx={knob.x} cy={knob.y} r={12} fill={ChronoTokens.colors.accentRed} />
            <Circle cx={knob.x} cy={knob.y} r={12} stroke="#fff" strokeWidth={3} fill="none" />
          </G>
        </Svg>
        {ticks.map((t) => {
          const p = polar(minutesToAngle(t.m, min, max), R + 28);
          return (
            <Text
              key={t.m}
              style={[
                styles.tick,
                { left: p.x - 22, top: p.y - 8, width: 44 },
              ]}
            >
              {t.label}
            </Text>
          );
        })}
        <View style={styles.center}>
          <Text style={styles.num}>{display}</Text>
          <Text style={styles.unit}>{unit.toUpperCase()}</Text>
          <HandwrittenNote size={24} rotate={-3} style={{ marginTop: 4 }}>
            justo para una gran tarde
          </HandwrittenNote>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  tick: {
    position: 'absolute',
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 10,
    color: ChronoTokens.colors.inkMuted,
    textAlign: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    pointerEvents: 'none',
  },
  num: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 72,
    color: ChronoTokens.colors.inkBlack,
    lineHeight: 72,
  },
  unit: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 20,
    color: ChronoTokens.colors.inkBlack,
    letterSpacing: 1.4,
    marginTop: -4,
  },
});
