import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { ChronoTokens } from '@/src/theme/tokens';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'black' | 'purple';
  badge?: string;
  disabled?: boolean;
  stamp?: boolean;
}

export const ChronoActionButton: React.FC<Props> = ({
  title,
  onPress,
  style,
  variant = 'black',
  badge,
  disabled,
  stamp,
}) => {
  const bg = variant === 'purple' ? ChronoTokens.colors.accentPurple : ChronoTokens.colors.inkBlack;

  return (
    <View style={[styles.wrap, style]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        disabled={disabled}
        style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }]}
      >
        <View style={styles.row}>
          <Text style={styles.text}>{title.toUpperCase()}</Text>
          <Text style={styles.arrow}> →</Text>
        </View>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </TouchableOpacity>
      {stamp ? <View style={styles.stampDot} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 58,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  arrow: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 22,
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    right: 22,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 16,
    color: ChronoTokens.colors.accentYellow,
    letterSpacing: 1,
  },
  stampDot: {
    position: 'absolute',
    right: 10,
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ChronoTokens.colors.accentRed,
  },
});
