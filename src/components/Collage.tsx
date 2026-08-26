import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function TornPatch({
  color,
  width = 90,
  height = 54,
  rotate = -12,
  style,
}: {
  color: string;
  width?: number;
  height?: number;
  rotate?: number;
  style?: object;
}) {
  return (
    <View style={[{ transform: [{ rotate: `${rotate}deg` }] }, style]}>
      <Svg width={width} height={height} viewBox="0 0 90 54">
        <Path
          d="M4 18 C8 6 18 2 30 6 C42 2 48 10 58 4 C70 0 82 8 86 18 C90 30 84 44 72 50 C58 56 44 46 32 50 C18 54 6 44 4 32 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

export function RedSun({ size = 86 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E54B2D',
      }}
    />
  );
}

export function TornBadge({
  color,
  children,
  textColor = '#FFFFFF',
  rotate = -2.5,
}: {
  color: string;
  children: string;
  textColor?: string;
  rotate?: number;
}) {
  return (
    <View style={{ alignSelf: 'flex-start', transform: [{ rotate: `${rotate}deg` }] }}>
      <View
        style={{
          backgroundColor: color,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 11,
          borderBottomRightRadius: 3,
          borderBottomLeftRadius: 9,
        }}
      >
        <Text
          style={{
            color: textColor,
            fontFamily: 'BebasNeue_400Regular',
            fontSize: 13,
            letterSpacing: 1.4,
          }}
        >
          {children}
        </Text>
      </View>
    </View>
  );
}

export function DistressedStamp({
  size = 140,
  color = '#E54B2D',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Path
        d="M70 6 C88 4 104 8 116 18 C128 28 136 44 138 62 C140 82 134 100 122 114 C108 130 88 138 70 138 C50 138 30 130 18 116 C6 102 2 82 4 62 C6 40 18 20 36 12 C48 6 58 6 70 6 Z"
        fill={color}
      />
      <Path
        d="M24 52 C30 40 42 48 38 58 C32 62 20 60 24 52 Z"
        fill="#F4EFE6"
        opacity={0.16}
      />
      <Path
        d="M108 36 C114 32 120 40 116 46 C110 50 104 40 108 36 Z"
        fill="#F4EFE6"
        opacity={0.12}
      />
    </Svg>
  );
}
