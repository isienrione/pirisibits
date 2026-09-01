import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { DISCOVERY_POSTURES, interestLabel } from '@/src/data/algorithm';
import { LocalImages } from '@/src/data/localImages';
import { poiImage } from '@/src/data/pois';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function WhyRouteScreen() {
  const { timeBudgetMinutes, rhythm, interests, userProfile, activeTour, solverPayload } = useWalk();
  const posture = DISCOVERY_POSTURES[userProfile.discoveryPosture];
  const rhythmLabel = posture?.title.toLowerCase() ?? rhythm;
  const labels = interests.map((id) => interestLabel(id).toUpperCase()).filter(Boolean);
  const hero = activeTour?.stops[0];
  const km = activeTour?.distanceKm ?? 2.8;
  const harmonic = activeTour?.harmonic;

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Por qué esta ruta" onBack={() => router.back()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.h1}>Esta ruta está hecha para ti.</Text>
          <Text style={styles.sub}>
            No elegimos cuatro lugares al azar. Cada parada responde a lo que nos contaste.
          </Text>
          <View style={styles.card}>
            <View style={styles.line} />
            <View style={styles.block}>
              <View style={styles.num}><Text style={styles.numTxt}>1</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lab}>TUS INTERESES</Text>
                <Text style={styles.b}>
                  Te atraen {labels.slice(0, 3).join(', ').toLowerCase() || 'la historia y la arquitectura'}
                </Text>
                <View style={styles.tags}>
                  {labels.slice(0, 3).map((t) => (
                    <View key={t} style={styles.tag}><Text style={styles.tagTxt}>{t}</Text></View>
                  ))}
                </View>
              </View>
              <Image source={hero ? poiImage(hero) : LocalImages.monedaToday} style={styles.photo} />
            </View>
            <View style={styles.block}>
              <View style={styles.num}><Text style={styles.numTxt}>2</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lab}>TU TIEMPO</Text>
                <Text style={styles.b}>Tienes {timeBudgetMinutes} minutos · T_budget</Text>
                <View style={styles.yellow}>
                  <Text style={styles.yellowTxt}>{Math.round(timeBudgetMinutes / 60)} h · {km} km</Text>
                </View>
              </View>
            </View>
            <View style={styles.block}>
              <View style={styles.num}><Text style={styles.numTxt}>3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lab}>TU ESTILO</Text>
                <Text style={styles.b}>Prefieres un recorrido {rhythmLabel} · Dz {userProfile.discoveryPosture}</Text>
                <View style={styles.tags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagTxt}>{harmonic?.anchors ?? 1} ANCLAS</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagTxt}>{harmonic?.pockets ?? 1} BOLSILLOS</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagTxt}>{harmonic?.micros ?? 2} MICROS</Text>
                  </View>
                </View>
              </View>
              <Image source={LocalImages.morande} style={styles.photo} />
            </View>
          </View>
          <View style={styles.tealBar}>
            <Text style={styles.tealTxt}>
              {userProfile.stepFree ? '✓  Step-free M2' : '✓  Sin subidas fuertes'} · {solverPayload.vectors.join(' ')}
            </Text>
          </View>
          <HandwrittenNote style={{ marginVertical: 12 }}>¿Quieres cambiar algo?</HandwrittenNote>
          <View style={styles.two}>
            <Pressable style={styles.outline} onPress={() => router.push('/adjust-route')}>
              <Text style={styles.outlineTxt}>MÁS HISTORIA</Text>
            </Pressable>
            <Pressable style={styles.outline} onPress={() => router.push('/adjust-route')}>
              <Text style={styles.outlineTxt}>MENOS CAMINATA</Text>
            </Pressable>
          </View>
          <ChronoActionButton title="Ver alternativas" onPress={() => router.push('/adjust-route')} />
          <Pressable onPress={() => router.back()}>
            <Text style={styles.keep}>MANTENER ESTA RUTA</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 32, lineHeight: 32 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginVertical: 10, lineHeight: 20 },
  card: {
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 24,
    top: 28,
    bottom: 28,
    width: 2,
    backgroundColor: ChronoTokens.colors.accentPurple,
  },
  block: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  num: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ChronoTokens.colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  numTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  lab: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, color: ChronoTokens.colors.accentPurple, letterSpacing: 1 },
  b: { fontFamily: ChronoTokens.fonts.bodyBold, fontSize: 14, marginVertical: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: '#E8DFF0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11, color: ChronoTokens.colors.accentPurple },
  photo: { width: 72, height: 72, borderRadius: 8 },
  yellow: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentYellow,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yellowTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12 },
  tealBar: {
    marginTop: 12,
    backgroundColor: ChronoTokens.colors.accentTeal,
    borderRadius: 999,
    padding: 12,
  },
  tealTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.bodyMedium, textAlign: 'center' },
  two: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  outline: {
    flex: 1,
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.inkBlack,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 0.8 },
  keep: {
    textAlign: 'center',
    marginTop: 12,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    color: ChronoTokens.colors.accentPurple,
    letterSpacing: 1,
  },
});
