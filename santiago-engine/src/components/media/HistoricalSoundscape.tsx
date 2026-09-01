import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { Waveform } from '@/src/components/Waveform';
import { ChronoTokens } from '@/src/theme/tokens';

export function HistoricalSoundscape({
  label = 'Paisaje sonoro de archivo',
  script,
}: {
  label?: string;
  script?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const text =
    script ??
    `Paisaje sonoro: ${label}. Campanas lejanas, un tranvía de hierro y pregones en la plaza.`;

  const toggle = () => {
    if (playing) {
      Speech.stop();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    Speech.speak(text, {
      language: 'es-CL',
      pitch: 0.9,
      rate: 0.9,
      onDone: () => setPlaying(false),
      onStopped: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.k}>SOUNDSCAPE</Text>
      <Text style={styles.title}>{label}</Text>
      <Waveform height={36} progress={playing ? 0.7 : 0.2} />
      <Text style={styles.hand}>ambiente de época · no es la guía, es el aire</Text>
      <Pressable onPress={toggle} style={styles.btn}>
        <Text style={styles.btnTxt}>{playing ? 'DETENER AMBIENTE' : 'OÍR EL BARRIO'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 248,
    borderWidth: 1.5,
    borderColor: '#121212',
    backgroundColor: '#1A2A2E',
    padding: 16,
    justifyContent: 'space-between',
  },
  k: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.6, fontSize: 12 },
  title: { color: '#F4EFE6', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 26, lineHeight: 28 },
  hand: {
    fontFamily: ChronoTokens.fonts.handwritten,
    fontSize: 16,
    color: ChronoTokens.colors.accentRed,
    transform: [{ rotate: '-2deg' }],
  },
  btn: {
    alignSelf: 'flex-start',
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnTxt: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
