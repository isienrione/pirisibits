import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { OnboardingProgress } from '@/src/components/OnboardingProgress';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { RHYTHM_POSTURE, TIME_BUDGET_BANDS } from '@/src/data/algorithm';
import { harmonicTargets } from '@/src/services/knapsackEngine';
import { useTimeBudget } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function TimeScreen() {
  const { timeBudgetMinutes, setTimeBudgetMinutes, finishLabel, rhythm } = useTimeBudget();
  const { anchors, pockets, micros } = harmonicTargets(
    timeBudgetMinutes,
    RHYTHM_POSTURE[rhythm],
  );

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <OnboardingProgress step={4} />
        <Text style={styles.h1}>¿Cuánto tiempo tienes ahora?</Text>
        <HandwrittenNote style={styles.note}>bloques MECE · sin solapes</HandwrittenNote>

        {TIME_BUDGET_BANDS.map((band) => {
          const on = timeBudgetMinutes === band.minutes;
          return (
            <Pressable
              key={band.id}
              onPress={() => setTimeBudgetMinutes(band.minutes)}
              style={[styles.card, on && styles.cardOn]}
            >
              <Text style={styles.range}>{band.range.toUpperCase()}</Text>
              <Text style={styles.title}>{band.label.toUpperCase()}</Text>
              <Text style={styles.sub}>{band.subtitle}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.meta}>
          Harmonic Stop Ratio · {anchors} anclas / {pockets} bolsillos / {micros} micros
        </Text>
        <Text style={styles.timeTxt}>termina {finishLabel}</Text>

        <View style={{ flex: 1 }} />
        <ChronoActionButton title="Siguiente" onPress={() => router.push('/onboarding/permissions')} />
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 38,
    lineHeight: 38,
    color: ChronoTokens.colors.inkBlack,
    width: '92%',
  },
  note: { marginBottom: 12 },
  card: {
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.paperBase,
    padding: 14,
    marginBottom: 10,
  },
  cardOn: {
    borderColor: ChronoTokens.colors.accentRed,
    borderWidth: 2.5,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
  },
  range: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 13,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentTeal,
  },
  title: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 26,
    lineHeight: 28,
    color: ChronoTokens.colors.inkBlack,
    marginTop: 2,
  },
  sub: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 13,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 4,
  },
  meta: {
    textAlign: 'center',
    color: ChronoTokens.colors.inkMuted,
    fontFamily: ChronoTokens.fonts.body,
    marginTop: 8,
    fontSize: 12,
  },
  timeTxt: {
    textAlign: 'center',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 22,
    color: ChronoTokens.colors.inkBlack,
    marginTop: 4,
  },
});
