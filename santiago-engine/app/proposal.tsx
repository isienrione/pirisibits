import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArchivalImage } from '@/src/components/ArchivalImage';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { TornPatch } from '@/src/components/Collage';
import { VintageMap } from '@/src/components/VintageMap';
import { MEDIA } from '@/src/data/catalog';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function ProposalScreen() {
  const { finishLabel, timeBudgetMinutes, solverPayload, activeTour, generateTour, userProfile, saveCurrentTour } = useWalk();
  const hours = Math.round(timeBudgetMinutes / 60);

  useEffect(() => {
    if (!activeTour) generateTour();
  }, [activeTour, generateTour]);

  const tour = activeTour;
  const first = tour?.stops[0];

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.kicker}>PROPUESTA PERSONALIZADA</Text>
          <Text style={styles.h1}>
            LISTO. TU RUTA YA <Text style={{ color: ChronoTokens.colors.accentRed }}>TIENE FORMA.</Text>
          </Text>
          <Text style={styles.sub}>
            Armamos una caminata según tus intereses, tu tiempo, tu movilidad y dónde estás.
          </Text>

          <Text style={styles.kicker}>TU RECORRIDO</Text>
          <Text style={styles.route}>{(tour?.title ?? 'Santiago a tu ritmo').toUpperCase()}</Text>
          <View style={styles.made}>
            <HandwrittenNote color={ChronoTokens.colors.inkBlack} size={18} rotate={-3}>
              HECHA PARA TI
            </HandwrittenNote>
          </View>

          <View style={styles.mapWrap}>
            <VintageMap height={200} stopCount={tour?.stops.length ?? 4} />
            <ArchivalImage uri={MEDIA.walker} style={styles.walker} intensity={0.05} />
            <View style={styles.callout}>
              <Text style={styles.callTitle}>EMPIEZAS EN {first?.title.toUpperCase() ?? 'LA MONEDA'}</Text>
              <Text style={styles.callSub}>8 min de ti</Text>
            </View>
          </View>

          <View style={styles.stats}>
            {[
              [String(tour?.stops.length ?? 0), 'LUGARES'],
              [`${hours} h`, 'DURACIÓN'],
              [`${tour?.distanceKm ?? 0} km`, 'DISTANCIA'],
            ].map(([n, l], i) => (
              <View key={l} style={[styles.stat, i > 0 && styles.statBorder]}>
                <Text style={styles.statN}>{n}</Text>
                <Text style={styles.statL}>{l}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.kicker, { marginTop: 18 }]}>POR QUÉ ES PARA TI</Text>
          {[
            `Vectores ${solverPayload.vectors.join(' ')}.`,
            userProfile.stepFree ? 'Ruta step-free (M2).' : 'Ruta caminable y conectada.',
            `Termina cerca de las ${finishLabel}.`,
          ].map((t) => (
            <View key={t} style={styles.why}>
              <Text style={styles.whyTxt}>{t}</Text>
              <Text style={styles.redCheck}>✓</Text>
            </View>
          ))}
          <Text style={styles.payload}>
            Solver · {solverPayload.posture} · T_budget {solverPayload.T_budget} ·{' '}
            {solverPayload.vectors.join(' ')}
          </Text>
        </ScrollView>
        <ChronoActionButton
          title="Ver mi propuesta"
          badge={`${hours} H`}
          onPress={() => {
            saveCurrentTour();
            router.replace('/(tabs)');
          }}
        />
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  kicker: {
    fontFamily: ChronoTokens.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.8,
    color: ChronoTokens.colors.inkBlack,
    marginBottom: 6,
  },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 36,
    lineHeight: 36,
    color: ChronoTokens.colors.inkBlack,
  },
  sub: {
    fontFamily: ChronoTokens.fonts.body,
    color: ChronoTokens.colors.inkMuted,
    marginVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  route: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 26,
    lineHeight: 28,
    color: ChronoTokens.colors.inkBlack,
  },
  made: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentYellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    marginBottom: 12,
    transform: [{ rotate: '-3deg' }],
  },
  mapWrap: { borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  walker: { position: 'absolute', right: 4, bottom: 0, width: 90, height: 140 },
  callout: {
    position: 'absolute',
    left: 12,
    top: 18,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ChronoTokens.colors.inkBlack,
  },
  callTitle: { fontFamily: ChronoTokens.fonts.bodyBold, fontSize: 11 },
  callSub: { fontFamily: ChronoTokens.fonts.body, fontSize: 11, color: ChronoTokens.colors.inkMuted },
  stats: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: ChronoTokens.colors.inkBlack,
    borderRadius: 8,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: ChronoTokens.colors.inkBlack },
  statN: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22 },
  statL: { fontFamily: ChronoTokens.fonts.body, fontSize: 10, letterSpacing: 1 },
  why: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: ChronoTokens.colors.borderSoft,
    paddingVertical: 10,
  },
  whyTxt: { fontFamily: ChronoTokens.fonts.body, fontSize: 14, flex: 1 },
  redCheck: { color: ChronoTokens.colors.accentRed, fontWeight: '700', fontSize: 16 },
  payload: {
    marginTop: 10,
    fontSize: 10,
    color: ChronoTokens.colors.inkSubtle,
    fontFamily: ChronoTokens.fonts.body,
  },
});
