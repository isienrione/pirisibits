import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { VintageMap } from '@/src/components/VintageMap';
import { ChronoTokens } from '@/src/theme/tokens';

export default function WrongRouteScreen() {
  return (
    <ChronoScreen>
    <View style={styles.root}>
      <VintageMap variant="night" height={420} />
      <SafeAreaView style={StyleSheet.absoluteFill} edges={['top']}>
        <View style={{ paddingHorizontal: 16 }}>
          <ScreenHeader title="Ruta activa" onBack={() => router.back()} light />
        </View>
        <View style={styles.warn}>
          <Text style={styles.warnLab}>TE DESVIASTE 120 m</Text>
          <Text style={styles.h}>Vas por otro lado.</Text>
          <Text style={styles.sub}>No pasa nada. Elige cómo quieres continuar.</Text>
        </View>
        <View style={{ flex: 1 }} />
        <ChronoScreen style={styles.sheet}>
          <Text style={styles.q}>¿Qué prefieres hacer?</Text>
          <View style={styles.two}>
            <View style={[styles.opt, { borderColor: ChronoTokens.colors.accentPurple }]}>
              <Text style={styles.optT}>VOLVER A LA RUTA</Text>
              <Text style={styles.optS}>Te guiamos al punto más cercano.</Text>
              <Text style={styles.optM}>3 min • 180 m</Text>
              <Pressable style={styles.purple} onPress={() => router.back()}>
                <Text style={styles.white}>REORIENTAR</Text>
              </Pressable>
            </View>
            <View style={[styles.opt, { borderColor: ChronoTokens.colors.accentTeal }]}>
              <Text style={styles.optT}>RECOMPONER DESDE AQUÍ</Text>
              <Text style={styles.optS}>Adaptamos las próximas paradas a tu ubicación.</Text>
              <View style={styles.keep}>
                <Text style={styles.keepTxt}>Mantiene 4 paradas</Text>
              </View>
              <Pressable style={styles.teal} onPress={() => router.replace('/proposal')}>
                <Text style={styles.tealTxt}>RECOMPONER</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.skip}>SEGUIR SIN CAMBIOS</Text>
          </Pressable>
        </ChronoScreen>
      </SafeAreaView>
    </View>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ChronoTokens.colors.mapNight },
  warn: {
    marginHorizontal: 16,
    backgroundColor: ChronoTokens.colors.paperBase,
    borderRadius: 16,
    padding: 14,
  },
  warnLab: { color: ChronoTokens.colors.accentRed, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 28 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  q: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22, marginBottom: 12 },
  two: { flexDirection: 'row', gap: 8 },
  opt: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
  },
  optT: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 14 },
  optS: { fontFamily: ChronoTokens.fonts.body, fontSize: 12, color: ChronoTokens.colors.inkMuted, marginVertical: 6 },
  optM: { fontFamily: ChronoTokens.fonts.bodyBold, marginBottom: 8 },
  purple: {
    backgroundColor: ChronoTokens.colors.accentPurple,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  white: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy },
  keep: {
    borderWidth: 1,
    borderColor: ChronoTokens.colors.accentTeal,
    borderRadius: 999,
    paddingVertical: 4,
    marginBottom: 8,
  },
  keepTxt: { textAlign: 'center', color: ChronoTokens.colors.accentTeal, fontSize: 11, fontFamily: ChronoTokens.fonts.bodyMedium },
  teal: {
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.accentTeal,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tealTxt: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy },
  skip: {
    textAlign: 'center',
    marginTop: 14,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    color: ChronoTokens.colors.accentTeal,
  },
});
