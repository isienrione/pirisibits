import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { fillParent } from '@/src/theme/layout';

interface Props {
  stopNumber: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  isLast?: boolean;
  onPress?: () => void;
}

export const RouteStopRow: React.FC<Props> = ({
  stopNumber,
  title,
  subtitle,
  image,
  isLast = false,
  onPress,
}) => {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.container}>
      <View style={styles.timelineColumn}>
        <View style={styles.numberCircle}>
          <Text style={styles.numberText}>{stopNumber}</Text>
        </View>
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>

      <View style={[styles.infoColumn, isLast && styles.infoLast]}>
        <Text style={styles.titleText}>{title.toUpperCase()}</Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>
      </View>

      <View style={styles.thumbWrap}>
        <Image source={image} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.thumbWash} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 36,
    marginRight: 12,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0653A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#FFF',
    fontSize: 15,
    letterSpacing: 0.4,
    marginTop: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F0653A',
    marginTop: 4,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 2,
    paddingBottom: 22,
  },
  infoLast: {
    paddingBottom: 10,
  },
  titleText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#121212',
    letterSpacing: 0.8,
    lineHeight: 22,
  },
  subtitleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#5C564F',
    lineHeight: 18,
    marginTop: 2,
  },
  thumbWrap: {
    width: 72,
    height: 52,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#C9BBA6',
    backgroundColor: '#D8C9B0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbWash: {
    ...fillParent,
    backgroundColor: 'rgba(92, 58, 28, 0.18)',
  },
});
