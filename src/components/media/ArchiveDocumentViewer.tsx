import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { ChronoTokens } from '@/src/theme/tokens';

export function ArchiveDocumentViewer({
  image,
  transcript,
}: {
  image: ImageSourcePropType;
  transcript?: string;
}) {
  const [open, setOpen] = useState(false);
  const scale = useSharedValue(1);
  const start = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      start.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(3.2, start.value * e.scale));
    });

  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View>
      <GestureDetector gesture={pinch}>
        <View style={styles.frame}>
          <Animated.View style={[styles.imgWrap, imgStyle]}>
            <Image source={image} style={styles.img} resizeMode="contain" />
          </Animated.View>
          <Text style={styles.hint}>Pellizca para ampliar el documento</Text>
        </View>
      </GestureDetector>
      {transcript ? (
        <>
          <Pressable onPress={() => setOpen((v) => !v)} style={styles.sheetBtn}>
            <Text style={styles.sheetTxt}>{open ? 'CERRAR TRANSCRIPCIÓN' : 'LEER TRANSCRIPCIÓN'}</Text>
          </Pressable>
          {open ? (
            <View style={styles.sheet}>
              <Text style={styles.k}>ARCHIVO</Text>
              <Text style={styles.body}>{transcript}</Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 280,
    borderWidth: 1.5,
    borderColor: '#121212',
    backgroundColor: '#E4D9C6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgWrap: { width: '100%', height: '100%' },
  img: { width: '100%', height: '100%' },
  hint: {
    position: 'absolute',
    bottom: 8,
    fontFamily: ChronoTokens.fonts.handwritten,
    color: ChronoTokens.colors.inkMuted,
    fontSize: 16,
  },
  sheetBtn: { marginTop: 10, alignItems: 'center' },
  sheetTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.2, color: ChronoTokens.colors.accentPurple },
  sheet: {
    marginTop: 8,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    padding: 12,
  },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentPurple, letterSpacing: 1.2, marginBottom: 6 },
  body: { fontFamily: ChronoTokens.fonts.body, fontSize: 13, lineHeight: 20, color: ChronoTokens.colors.inkBlack },
});
