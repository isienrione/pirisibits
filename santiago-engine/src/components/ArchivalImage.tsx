import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { fillParent } from '@/src/theme/layout';

export function ArchivalImage({
  uri,
  source,
  style,
  imageStyle,
  intensity = 0.28,
}: {
  uri?: string;
  source?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  intensity?: number;
}) {
  const img = source ?? (uri ? { uri } : undefined);
  if (!img) return <View style={[styles.wrap, style]} />;

  return (
    <View style={[styles.wrap, style]}>
      <Image source={img} style={[styles.img, imageStyle]} resizeMode="cover" />
      <View style={[styles.wash, { backgroundColor: `rgba(92, 58, 28, ${intensity})` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#D8C9B0',
    borderWidth: 1,
    borderColor: '#C9BBA6',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  wash: {
    ...fillParent,
  },
});
