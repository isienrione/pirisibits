import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { TornPatch } from '@/src/components/Collage';
import { LocalImages } from '@/src/data/localImages';
import { poiToRouteStop } from '@/src/data/pois';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function RouteTab() {
  const { status, currentStopIndex, setStatus, tourStops, remainingMinutes, activeTour, currentPoi } = useWalk();
  const stops = tourStops.map((s, i) => poiToRouteStop(s, i));

  if (status === 'idle' || status === 'proposed') {
    return (
      <ChronoScreen>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.top}>
            <BrandMark compact />
            <Text style={styles.screen}>MI RUTA</Text>
            <View style={{ width: 36 }} />
          </View>
          <Text style={styles.empty}>Todavía no hay una caminata activa.</Text>
          <ChronoActionButton title="Ver propuesta" onPress={() => router.push('/(tabs)')} />
        </SafeAreaView>
      </ChronoScreen>
    );
  }

  if (status === 'paused') {
    return (
      <ChronoScreen>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.top}>
            <BrandMark compact />
            <View style={{ width: 36 }} />
          </View>
          <View style={styles.teal}>
            <Text style={styles.tealTxt}>RUTA ACTIVA</Text>
          </View>
          <Text style={styles.h1}>Retoma donde lo dejaste.</Text>
          <Text style={styles.muted}>Ayer · 15:42</Text>
          <View style={styles.card}>
            <View style={styles.cardMedia}>
              <Image source={currentPoi ? poiToRouteStop(currentPoi, currentStopIndex).image : LocalImages.centro} style={styles.full} />
              <TornPatch color={ChronoTokens.colors.accentTeal} style={{ position: 'absolute', right: -8, top: 20 }} />
            </View>
            <View style={{ padding: 14 }}>
              <Text style={styles.kicker}>ESTABAS EN</Text>
              <Text style={styles.stop}>{(currentPoi?.title ?? 'Pasaje Phillips').toUpperCase()}</Text>
              <View style={styles.split}>
                <View>
                  <Text style={styles.kicker}>TE QUEDAN</Text>
                  <Text style={styles.bold}>{Math.max(0, stops.length - currentStopIndex)} paradas</Text>
                  <Text style={styles.muted}>{remainingMinutes} min aprox.</Text>
                </View>
                <View>
                  <Text style={styles.kicker}>PROGRESO DE RUTA</Text>
                  <Text style={styles.bold}>{activeTour?.completedStops.length ?? currentStopIndex} / {stops.length || 5} paradas</Text>
                </View>
              </View>
              <ChronoActionButton
                variant="purple"
                title="Seguir ruta"
                onPress={() => {
                  setStatus('active');
                  router.push('/walk/active');
                }}
              />
              <Pressable onPress={() => router.push('/end-of-day')}>
                <Text style={styles.closeDay}>CERRAR EL DÍA</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ChronoScreen>
    );
  }

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.top}>
          <BrandMark compact />
          <Text style={styles.screen}>MI RUTA</Text>
          <Text style={styles.icon}>⋯</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.summary}>
            <View style={styles.teal}>
              <Text style={styles.tealTxt}>RUTA ACTIVA</Text>
            </View>
            <Text style={styles.h2}>Tu tarde por Santiago</Text>
            <Text style={styles.muted}>
              {currentStopIndex + 1} de {stops.length} completada • {remainingMinutes} min restantes • {activeTour?.distanceKm ?? 0} km
            </Text>
            <View style={styles.progress}>
              <View style={[styles.progressFill, { width: `${stops.length ? ((currentStopIndex + 1) / stops.length) * 100 : 0}%` }]} />
            </View>
          </View>

          {stops.map((s, i) => {
            const done = i < currentStopIndex;
            const current = i === currentStopIndex;
            return (
              <View key={s.id} style={styles.stopRow}>
                <View style={styles.tl}>
                  <View
                    style={[
                      styles.dot,
                      done && { backgroundColor: ChronoTokens.colors.accentTeal },
                      current && { backgroundColor: ChronoTokens.colors.accentPurple },
                    ]}
                  >
                    <Text style={styles.dotTxt}>{done ? '✓' : s.number.replace('0', '')}</Text>
                  </View>
                  {i < stops.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={[styles.stopCard, current && styles.stopCardOn]}>
                  <Text
                    style={[
                      styles.state,
                      done && { color: ChronoTokens.colors.accentTeal },
                      current && { color: ChronoTokens.colors.accentTeal },
                    ]}
                  >
                    {done ? 'COMPLETADA' : current ? 'PRÓXIMA' : i === stops.length - 1 ? 'FINAL' : 'DESPUÉS'}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stop}>{s.title.toUpperCase()}</Text>
                      <Text style={styles.muted}>
                        {current ? `${s.walkMin} min caminando • ${s.meters} m` : `${s.experienceMin} min de experiencia`}
                      </Text>
                    </View>
                    <Image source={s.image} style={styles.thumb} />
                  </View>
                  {current ? (
                    <Pressable
                      onPress={() => router.push('/walk/active')}
                      style={styles.guide}
                    >
                      <Text style={styles.guideTxt}>GUIARME →</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}

          <ChronoActionButton title="Ver en el mapa" onPress={() => router.push('/(tabs)/map')} />
          <Pressable onPress={() => router.push('/route-control')}>
            <Text style={styles.ctrl}>CONTROL DE RUTA</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  screen: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 18, letterSpacing: 1.4 },
  icon: { fontSize: 18 },
  empty: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginVertical: 24 },
  teal: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  tealTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 36, lineHeight: 36 },
  h2: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 24 },
  muted: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, fontSize: 13, marginTop: 4 },
  card: {
    marginTop: 16,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardMedia: { height: 140 },
  full: { width: '100%', height: '100%' },
  kicker: { fontFamily: ChronoTokens.fonts.body, fontSize: 10, letterSpacing: 1.2, color: ChronoTokens.colors.inkMuted },
  stop: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22 },
  split: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  bold: { fontFamily: ChronoTokens.fonts.bodyBold },
  closeDay: {
    textAlign: 'center',
    marginTop: 12,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    color: ChronoTokens.colors.accentPurple,
    letterSpacing: 1,
  },
  summary: {
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
  },
  progress: { height: 6, backgroundColor: '#E4DCCF', borderRadius: 3, marginTop: 10 },
  progressFill: { height: 6, backgroundColor: ChronoTokens.colors.accentPurple, borderRadius: 3 },
  stopRow: { flexDirection: 'row', marginBottom: 12 },
  tl: { width: 28, alignItems: 'center' },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D8D0C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  line: { width: 2, flex: 1, backgroundColor: '#D8D0C4', marginTop: 4 },
  stopCard: {
    flex: 1,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
  },
  stopCardOn: { borderColor: ChronoTokens.colors.accentPurple, borderWidth: 1.6 },
  state: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 1, color: ChronoTokens.colors.inkSubtle },
  thumb: { width: 64, height: 48, borderRadius: 6 },
  guide: {
    marginTop: 10,
    backgroundColor: ChronoTokens.colors.accentPurple,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 10,
  },
  guideTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  ctrl: {
    textAlign: 'center',
    marginTop: 12,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
  },
});
