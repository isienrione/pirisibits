import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { ChronoTokens } from '@/src/theme/tokens';
import { Waveform } from '@/src/components/Waveform';

export function MiniAudioBar({
  title,
  time,
  thumbnail,
  playing,
  onToggle,
  onPress,
}: {
  title: string;
  time: string;
  thumbnail: ImageSourcePropType | string;
  playing?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.bar}>
      <Image
        source={typeof thumbnail === 'string' ? { uri: thumbnail } : thumbnail}
        style={styles.thumb}
      />
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Waveform height={18} progress={0.58} />
      </View>
      <TouchableOpacity onPress={onToggle} style={styles.pause}>
        <Text style={styles.pauseTxt}>{playing ? '❚❚' : '▶'}</Text>
      </TouchableOpacity>
      <Text style={styles.time}>{time}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: ChronoTokens.colors.inkBlack,
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  title: {
    color: '#fff',
    fontFamily: ChronoTokens.fonts.bodyMedium,
    fontSize: 12,
    marginBottom: 4,
  },
  pause: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pauseTxt: {
    fontSize: 11,
    color: ChronoTokens.colors.inkBlack,
  },
  time: {
    color: '#fff',
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
});
