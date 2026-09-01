import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChronoTokens } from '@/src/theme/tokens';

export function CircleButton({
  label,
  onPress,
  light = false,
}: {
  label: string;
  onPress: () => void;
  light?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[styles.btn, light && styles.light]}>
      <Text style={[styles.txt, light && styles.txtLight]}>{label}</Text>
    </Pressable>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View>
      <Text style={[styles.brand, compact && styles.brandCompact]}>CHRONOWALK</Text>
      <Text style={styles.city}>SANTIAGO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.inkBlack,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  light: {
    borderColor: 'rgba(255,255,255,0.7)',
  },
  txt: {
    color: ChronoTokens.colors.inkBlack,
    fontSize: 16,
    fontFamily: ChronoTokens.fonts.bodyBold,
  },
  txtLight: {
    color: '#fff',
  },
  brand: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 22,
    color: ChronoTokens.colors.inkBlack,
    letterSpacing: 1.2,
    lineHeight: 22,
  },
  brandCompact: {
    fontSize: 18,
    lineHeight: 18,
  },
  city: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 13,
    color: ChronoTokens.colors.accentRed,
    letterSpacing: 1.6,
    marginTop: 1,
  },
});
