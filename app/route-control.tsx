import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { VintageMap } from '@/src/components/VintageMap';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function RouteControlScreen() {
  const { currentStopIndex, setStatus, tourStops, currentPoi } = useWalk();
  const now = currentPoi;
  const next = tourStops[Math.min(tourStops.length - 1, currentStopIndex + 1)];

  return (
    <ChronoScreen>
    <View style={{ flex: 1, backgroundColor: ChronoTokens.colors.mapNight }}>
      <VintageMap variant="night" height={220} />
      <SafeAreaView style={StyleSheet.absoluteFill} edges={['top']}>
        <View style={styles.top}>
          <Text style={styles.topTxt}>
            {currentStopIndex + 1} / {tourStops.length || 1}
          </Text>
          <Text style={styles.topTitle}>RUTA ACTIVA</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.x}>✕</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <ChronoScreen style={styles.sheet}>
          <Text style={styles.h}>CONTROL DE RUTA</Text>
          <Text style={styles.sub}>Tu avance se guarda automáticamente.</Text>
          <View style={styles.split}>
            <View style={{ flex: 1 }}>
              <Text style={styles.k}>AHORA</Text>
              <Text style={styles.n}>{now?.title ?? '—'}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillTxt}>✓  LLEGASTE</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.k}>SIGUIENTE</Text>
              <Text style={styles.n}>{next?.title ?? 'Fin'}</Text>
              <Text style={styles.sub}>{next ? `${next.dwellMinutes} min` : 'Última parada'}</Text>
            </View>
          </View>
          {[
            { t: 'PAUSAR RUTA', s: 'Guarda este punto y retoma cuando quieras.', go: () => { setStatus('paused'); router.push('/resume-paused'); } },
            { t: 'SALTAR SIGUIENTE', s: `Omitirás ${next?.title ?? 'la siguiente'}. La ruta se ajustará en segundos.`, go: () => router.back() },
            { t: 'TERMINAR CAMINATA', s: 'Cerrarás la ruta de hoy y verás tu resumen.', go: () => router.push('/end-of-day'), red: true },
          ].map((a) => (
            <Pressable key={a.t} onPress={a.go} style={styles.action}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.at, a.red && { color: ChronoTokens.colors.accentRed }]}>{a.t}</Text>
                <Text style={styles.as}>{a.s}</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
          <ChronoActionButton title="Volver a la ruta" onPress={() => router.back()} />
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>CERRAR PANEL</Text>
          </Pressable>
        </ChronoScreen>
      </SafeAreaView>
    </View>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, alignItems: 'center' },
  topTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.bodyBold },
  topTitle: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.6 },
  x: { color: '#fff', fontSize: 18 },
  sheet: { padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 28 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 10 },
  split: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, color: ChronoTokens.colors.inkSubtle, letterSpacing: 1 },
  n: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 18 },
  pill: { alignSelf: 'flex-start', backgroundColor: ChronoTokens.colors.accentTeal, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  pillTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
  },
  at: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 16, letterSpacing: 0.6 },
  as: { fontFamily: ChronoTokens.fonts.body, fontSize: 12, color: ChronoTokens.colors.inkMuted },
  chev: { fontSize: 22, color: ChronoTokens.colors.inkSubtle },
  close: { textAlign: 'center', marginTop: 10, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
