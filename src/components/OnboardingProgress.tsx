import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OnboardingProgress({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        TU RUTA • {step}/{total}
      </Text>
      <View style={styles.row}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.seg, i < step ? styles.segOn : styles.segOff]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    zIndex: 2,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
    color: '#121212',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segOn: {
    backgroundColor: '#121212',
  },
  segOff: {
    backgroundColor: '#DDD5C7',
  },
});
