import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { VintageMap } from '@/src/components/VintageMap';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function ResumePausedScreen() {
  const { setStatus, currentPoi, remainingMinutes, activeTour, currentStopIndex, tourStops } = useWalk();
  const stopTitle = currentPoi?.title ?? 'Pasaje Phillips';
  const done = activeTour?.completedStops.length ?? currentStopIndex;

  return (
    <ChronoScreen>
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
        <ScreenHeader title="Ruta en pausa" onBack={() => router.back()} light />
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>TU PUNTO GUARDADO</Text>
        </View>
        <Text style={styles.h}>Retoma tu ruta.</Text>
        <Text style={styles.sub}>Pausaste ayer a las 15:42</Text>
        <View style={styles.map}>
          <VintageMap variant="night" height={220} />
          <View style={styles.mapTxt}>
            <Text style={styles.k}>ESTABAS EN</Text>
            <Text style={styles.stop}>{stopTitle}</Text>
            <Text style={styles.sub}>{done} de {tourStops.length || 5} paradas completadas</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Text style={styles.stat}>{done}{'\n'}paradas</Text>
          <Text style={styles.stat}>{remainingMinutes}{'\n'}min aprox.</Text>
          <Text style={styles.stat}>{(activeTour?.distanceKm ?? 1.1).toString().replace('.', ',')}{'\n'}km</Text>
        </View>
        <Text style={styles.ok}>✓  Tu progreso y tus audios siguen guardados</Text>
        <View style={{ flex: 1 }} />
        <ChronoActionButton
          variant="purple"
          title="Seguir ruta"
          onPress={() => {
            setStatus('active');
            router.push('/walk/active');
          }}
        />
        <Pressable style={styles.outline} onPress={() => router.replace('/proposal')}>
          <Text style={styles.outlineTxt}>RECALCULAR DESDE AQUÍ</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/end-of-day')}>
          <Text style={styles.close}>CERRAR EL DÍA</Text>
        </Pressable>
      </SafeAreaView>
    </View>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12181A' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentPurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11, letterSpacing: 1 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 40, color: '#fff', marginTop: 8 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  map: { borderRadius: 16, overflow: 'hidden' },
  mapTxt: { position: 'absolute', left: 12, bottom: 12 },
  k: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  stop: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 24 },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#1C2426',
    borderRadius: 999,
    marginTop: 14,
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  stat: { color: '#fff', textAlign: 'center', fontFamily: ChronoTokens.fonts.body, fontSize: 12 },
  ok: { color: ChronoTokens.colors.accentTeal, marginTop: 14, fontFamily: ChronoTokens.fonts.bodyMedium },
  outline: {
    marginTop: 10,
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.accentTeal,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineTxt: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  close: { textAlign: 'center', color: '#fff', marginTop: 14, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
