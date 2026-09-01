import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChronoTokens } from '@/src/theme/tokens';
import { fillParent } from '@/src/theme/layout';
import type { ForensicHotspot } from '@/src/data/pois';

const LOUPE = 96;
const ZOOM = 2.15;

export function ForensicLookClose({
  image,
  hotspots = [],
}: {
  image: ImageSourcePropType;
  hotspots?: ForensicHotspot[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const [frame, setFrame] = useState({ w: 1, h: 280 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setFrame({ w: width, h: height });
  };

  const spot = active != null ? hotspots[active] : undefined;

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Image source={image} style={styles.img} resizeMode="cover" />
      <View style={styles.glass} />
      {hotspots.map((item, i) => {
        const on = active === i;
        return (
          <Pressable
            key={`${item.label}-${i}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActive(on ? null : i);
            }}
            style={[styles.pin, { left: `${item.x * 100}%`, top: `${item.y * 100}%` }]}
          >
            <View style={[styles.glow, on && styles.glowOn]} />
            <View style={[styles.dot, on && styles.dotOn]} />
          </Pressable>
        );
      })}
      {spot ? (
        <View
          pointerEvents="none"
          style={[
            styles.loupe,
            {
              left: spot.x * frame.w - LOUPE / 2,
              top: Math.max(8, spot.y * frame.h - LOUPE - 18),
            },
          ]}
        >
          <Image
            source={image}
            resizeMode="cover"
            style={{
              width: frame.w * ZOOM,
              height: frame.h * ZOOM,
              transform: [
                { translateX: -spot.x * frame.w * ZOOM + LOUPE / 2 },
                { translateY: -spot.y * frame.h * ZOOM + LOUPE / 2 },
              ],
            }}
          />
        </View>
      ) : null}
      {spot ? (
        <View style={styles.card}>
          <Text style={styles.k}>LOOK CLOSE</Text>
          <Text style={styles.t}>{spot.label}</Text>
        </View>
      ) : (
        <Text style={styles.hint}>Toca los pines · lupa sobre la marca</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 280,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: '#D8C9B0',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  glass: { ...fillParent, backgroundColor: 'rgba(40,28,16,0.08)' },
  pin: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  glow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229,75,45,0.25)',
  },
  glowOn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(229,169,60,0.45)' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ChronoTokens.colors.accentRed,
    borderWidth: 1.5,
    borderColor: '#F4EFE6',
  },
  dotOn: { backgroundColor: ChronoTokens.colors.accentYellow, transform: [{ scale: 1.2 }] },
  loupe: {
    position: 'absolute',
    width: LOUPE,
    height: LOUPE,
    borderRadius: LOUPE / 2,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: ChronoTokens.colors.paperBase,
    backgroundColor: '#D8C9B0',
    zIndex: 2,
  },
  card: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: ChronoTokens.colors.paperBase,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    padding: 10,
    zIndex: 4,
  },
  k: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 11,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentRed,
  },
  t: { fontFamily: ChronoTokens.fonts.bodyMedium, fontSize: 14, marginTop: 2 },
  hint: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    left: 12,
    right: 12,
    textAlign: 'center',
    fontFamily: ChronoTokens.fonts.handwritten,
    fontSize: 18,
    color: ChronoTokens.colors.paperBase,
  },
});
