import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { ChronoTokens } from '@/src/theme/tokens';

export function HandwrittenNote({
  children,
  color = '#E54B2D',
  size = 22,
  rotate = -3,
  style,
}: {
  children: string;
  color?: string;
  size?: number;
  rotate?: number;
  style?: TextStyle;
}) {
  return (
    <Text
      style={[
        styles.note,
        { color, fontSize: size, lineHeight: size + 6, transform: [{ rotate: `${rotate}deg` }] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: ChronoTokens.fonts.handwritten,
  },
});
