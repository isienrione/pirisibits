import React, { memo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const PAPER = require('../../assets/images/paper_texture.jpg');

export const ChronoScreen = memo(function ChronoScreen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.root, style]}>
      <Image source={PAPER} style={styles.paper} resizeMode="cover" />
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE6',
  },
  paper: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.38,
  },
});
