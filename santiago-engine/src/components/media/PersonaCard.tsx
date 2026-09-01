import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { ChronoTokens } from '@/src/theme/tokens';

export function PersonaCard({
  persona,
  quote,
  place,
}: {
  persona: string;
  quote: string;
  place?: string;
}) {
  const [playing, setPlaying] = useState(false);

  const play = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.stop();
    setPlaying(true);
    Speech.speak(`${persona}. ${quote}`, {
      language: 'es-CL',
      onDone: () => setPlaying(false),
      onStopped: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  return (
    <Pressable onPress={play} style={styles.card}>
      <View style={styles.stamp}>
        <Text style={styles.stampTxt}>PERSONA</Text>
      </View>
      <Text style={styles.k}>{place ?? 'VOZ DE ARCHIVO'}</Text>
      <Text style={styles.name}>{persona.toUpperCase()}</Text>
      <Text style={styles.quote}>“{quote}”</Text>
      <Text style={styles.hand}>cita de archivo · toca la tarjeta</Text>
      <Text style={styles.cta}>{playing ? 'REPRODUCIENDO…' : 'TOCA PARA OÍR LA CITA'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 220,
    borderWidth: 1.5,
    borderColor: '#121212',
    backgroundColor: '#E8DFD0',
    padding: 18,
    transform: [{ rotate: '-1deg' }],
  },
  stamp: {
    alignSelf: 'flex-end',
    backgroundColor: ChronoTokens.colors.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '8deg' }],
  },
  stampTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11, letterSpacing: 1 },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.4, fontSize: 12, color: ChronoTokens.colors.inkMuted, marginTop: 8 },
  name: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 28, lineHeight: 30, marginTop: 6 },
  quote: {
    fontFamily: ChronoTokens.fonts.handwritten,
    fontSize: 22,
    lineHeight: 26,
    color: ChronoTokens.colors.inkBlack,
    marginTop: 12,
  },
  hand: {
    fontFamily: ChronoTokens.fonts.handwritten,
    fontSize: 18,
    color: ChronoTokens.colors.accentRed,
    marginTop: 8,
    transform: [{ rotate: '-2deg' }],
  },
  cta: {
    marginTop: 16,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentRed,
  },
});
