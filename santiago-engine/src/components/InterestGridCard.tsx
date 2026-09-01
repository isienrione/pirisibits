import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { fillParent } from '@/src/theme/layout';

interface Props {
  title: string;
  image: ImageSourcePropType;
  selected: boolean;
  expanded?: boolean;
  onPress: () => void;
  swatch?: ImageSourcePropType;
  swatchCorner?: 'left' | 'right';
}

export const InterestGridCard: React.FC<Props> = React.memo(({
  title,
  image,
  selected,
  expanded,
  onPress,
  swatch,
  swatchCorner = 'left',
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        expanded && styles.cardExpanded,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        <View style={styles.sepia} />
        {swatch ? (
          <Image
            source={swatch}
            style={[
              styles.swatch,
              swatchCorner === 'left' ? styles.swatchLeft : styles.swatchRight,
            ]}
            resizeMode="contain"
          />
        ) : null}
      </View>

      <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
        {selected ? (
          <Text style={styles.checkMark}>✓</Text>
        ) : (
          <View style={styles.innerRing} />
        )}
      </View>

      <View style={styles.titleBanner}>
        <Text style={styles.titleText} numberOfLines={1} adjustsFontSizeToFit>
          {title.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 0.95,
    backgroundColor: '#F4EFE6',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#DDD5C7',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#E54B2D',
    borderWidth: 2,
  },
  cardExpanded: {
    borderColor: '#2E8B9A',
  },
  pressed: {
    opacity: 0.92,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#D8C9B0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sepia: {
    ...fillParent,
    backgroundColor: 'rgba(92, 58, 28, 0.28)',
  },
  swatch: {
    position: 'absolute',
    bottom: -18,
    width: 92,
    height: 62,
    zIndex: 2,
    transform: [{ rotate: '-14deg' }],
  },
  swatchLeft: {
    left: -16,
  },
  swatchRight: {
    right: -16,
    transform: [{ rotate: '12deg' }],
  },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F4EFE6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    borderWidth: 1,
    borderColor: '#121212',
  },
  checkCircleSelected: {
    backgroundColor: '#E54B2D',
    borderColor: '#E54B2D',
  },
  innerRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#121212',
  },
  checkMark: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: -1,
  },
  titleBanner: {
    backgroundColor: '#121212',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  titleText: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 1,
  },
});
