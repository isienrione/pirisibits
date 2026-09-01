import React, { useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LocalImages, type LocalImageKey } from '@/src/data/localImages';
import { ChronoTokens } from '@/src/theme/tokens';

function asSource(img?: ImageSourcePropType | string): ImageSourcePropType | undefined {
  if (!img) return undefined;
  if (typeof img === 'string') {
    if (img in LocalImages) return LocalImages[img as LocalImageKey];
    return { uri: img };
  }
  return img;
}

export function ThenNowSlider({
  thenImage,
  nowImage,
  beforeImage,
  afterImage,
  thenImageUri,
  nowImageUri,
  img_before,
  img_after,
  asset_then,
  asset_now,
  thenLabel = 'ANTES / 1973',
  nowLabel = 'HOY',
}: {
  thenImage?: ImageSourcePropType | string;
  nowImage?: ImageSourcePropType | string;
  beforeImage?: ImageSourcePropType | string;
  afterImage?: ImageSourcePropType | string;
  thenImageUri?: string;
  nowImageUri?: string;
  img_before?: string;
  img_after?: string;
  asset_then?: string;
  asset_now?: string;
  thenLabel?: string;
  nowLabel?: string;
}) {
  const thenSrc = asSource(thenImage ?? beforeImage ?? thenImageUri ?? img_before ?? asset_then);
  const nowSrc = asSource(nowImage ?? afterImage ?? nowImageUri ?? img_after ?? asset_now);
  const [frameW, setFrameW] = useState(0);
  const width = useSharedValue(320);
  const dividerX = useSharedValue(160);
  const startX = useRef(160);
  const lastHaptic = useRef(160);
  const didInit = useRef(false);

  const clipStyle = useAnimatedStyle(() => ({
    width: dividerX.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dividerX.value }],
  }));

  if (!thenSrc || !nowSrc) return null;

  const clampDivider = (nextX: number) => {
    const w = width.value;
    return Math.max(10, Math.min(w - 10, nextX));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w <= 0) return;
    width.value = w;
    setFrameW(w);
    if (!didInit.current) {
      dividerX.value = w / 2;
      didInit.current = true;
    }
  };

  const onHandlerStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state === State.BEGAN) {
      startX.current = dividerX.value;
    }
  };

  const onGestureEvent = (e: PanGestureHandlerGestureEvent) => {
    const next = clampDivider(startX.current + e.nativeEvent.translationX);
    dividerX.value = next;
    if (Math.abs(next - lastHaptic.current) > 14) {
      lastHaptic.current = next;
      void Haptics.selectionAsync();
    }
  };

  return (
    <View>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-8, 8]}
        failOffsetY={[-18, 18]}
      >
        <Animated.View style={styles.frame} onLayout={onLayout}>
          <Image source={nowSrc} style={styles.imageFull} resizeMode="cover" />
          <View style={styles.nowTag}>
            <Text style={styles.tagTxt}>{nowLabel}</Text>
          </View>

          <Animated.View style={[styles.thenClip, clipStyle]} pointerEvents="none">
            <Image
              source={thenSrc}
              style={[styles.thenImg, { width: frameW || 1 }]}
              resizeMode="cover"
            />
            <View style={styles.thenTag}>
              <Text style={styles.thenTxt}>{thenLabel}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.handle, handleStyle]} pointerEvents="none">
            <View style={styles.line} />
            <View style={styles.knob}>
              <Text style={styles.arrows}>⟨ ⟩</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
      <Text style={styles.hint}>Desliza para revelar 1973 sobre el presente</Text>
    </View>
  );
}

export function VintagePostcard({
  source,
  caption,
  stamp = 'POSTAL',
}: {
  source: ImageSourcePropType;
  caption?: string;
  stamp?: string;
}) {
  return (
    <View style={styles.postcardOuter}>
      <View style={styles.postcard}>
        <Image source={source} style={styles.postcardImg} resizeMode="cover" />
        <View style={styles.postcardWash} />
        <View style={styles.postcardStamp}>
          <Text style={styles.postcardStampTxt}>{stamp}</Text>
        </View>
      </View>
      {caption ? <Text style={styles.postcardCaption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 280,
    overflow: 'hidden',
    backgroundColor: '#D8C9B0',
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
  },
  imageFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 280,
  },
  thenClip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  thenImg: {
    height: 280,
  },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 40,
    marginLeft: -20,
    alignItems: 'center',
  },
  line: {
    width: 2.5,
    flex: 1,
    backgroundColor: ChronoTokens.colors.paperBase,
  },
  knob: {
    position: 'absolute',
    top: '46%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderWidth: 2,
    borderColor: ChronoTokens.colors.inkBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrows: {
    fontFamily: ChronoTokens.fonts.bodyBold,
    fontSize: 13,
    color: ChronoTokens.colors.inkBlack,
  },
  thenTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: ChronoTokens.colors.paperBase,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ChronoTokens.colors.inkBlack,
  },
  nowTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: ChronoTokens.colors.inkBlack,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagTxt: {
    color: '#fff',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  thenTxt: {
    color: ChronoTokens.colors.inkBlack,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  hint: {
    marginTop: 8,
    fontFamily: ChronoTokens.fonts.handwritten,
    fontSize: 18,
    color: ChronoTokens.colors.accentRed,
    transform: [{ rotate: '-2deg' }],
  },
  postcardOuter: {
    transform: [{ rotate: '-1.4deg' }],
  },
  postcard: {
    height: 280,
    padding: 12,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    overflow: 'hidden',
  },
  postcardImg: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: ChronoTokens.colors.inkBlack,
  },
  postcardWash: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(92, 58, 28, 0.18)',
  },
  postcardStamp: {
    position: 'absolute',
    top: 20,
    right: 18,
    backgroundColor: ChronoTokens.colors.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '9deg' }],
  },
  postcardStampTxt: {
    color: '#fff',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 11,
    letterSpacing: 1,
  },
  postcardCaption: {
    marginTop: 10,
    fontFamily: ChronoTokens.fonts.handwritten,
    fontSize: 18,
    color: ChronoTokens.colors.inkMuted,
  },
});
