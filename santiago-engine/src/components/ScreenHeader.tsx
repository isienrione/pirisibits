import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChronoTokens } from '@/src/theme/tokens';
import { CircleButton } from '@/src/components/Chrome';

export function ScreenHeader({
  title,
  onBack,
  onRight,
  rightLabel = '⋯',
  light = false,
}: {
  title: string;
  onBack?: () => void;
  onRight?: () => void;
  rightLabel?: string;
  light?: boolean;
}) {
  return (
    <View style={styles.row}>
      {onBack ? <CircleButton label="‹" onPress={onBack} light={light} /> : <View style={{ width: 36 }} />}
      <Text style={[styles.title, light && { color: '#fff' }]}>{title.toUpperCase()}</Text>
      {onRight ? (
        <CircleButton label={rightLabel} onPress={onRight} light={light} />
      ) : (
        <View style={{ width: 36 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 20,
    letterSpacing: 1.6,
    color: ChronoTokens.colors.inkBlack,
  },
});
