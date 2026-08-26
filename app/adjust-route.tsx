import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { TIME_BUDGET_BANDS } from '@/src/data/algorithm';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function AdjustRouteScreen() {
  const {
    timeBudgetMinutes,
    setTimeBudgetMinutes,
    walkChunkMinutes,
    setWalkChunkMinutes,
    avoidStairs,
    setAvoidStairs,
    useMetro,
    setUseMetro,
    generateTour,
  } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Ajustar plan" onBack={() => router.back()} />
        <Text style={styles.h1}>Recomponemos la ruta.</Text>
        <Text style={styles.sub}>Cambia el tiempo, la caminata o el acceso. El solver vuelve a armar el knapsack.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Tiempo disponible</Text>
          <View style={styles.row}>
            {TIME_BUDGET_BANDS.map((band) => (
              <Pressable
                key={band.id}
                onPress={() => setTimeBudgetMinutes(band.minutes)}
                style={[styles.chip, timeBudgetMinutes === band.minutes && styles.chipOn]}
              >
                <Text style={[styles.chipTxt, timeBudgetMinutes === band.minutes && styles.chipTxtOn]}>
                  {band.range}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Más caminata</Text>
            <Switch
              value={walkChunkMinutes >= 30}
              onValueChange={(v) => setWalkChunkMinutes(v ? 45 : 20)}
              trackColor={{ true: ChronoTokens.colors.accentOrange }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Evitar subidas</Text>
            <Switch
              value={avoidStairs}
              onValueChange={setAvoidStairs}
              trackColor={{ true: ChronoTokens.colors.accentTeal }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Usar metro</Text>
            <Switch
              value={useMetro}
              onValueChange={setUseMetro}
              trackColor={{ true: ChronoTokens.colors.accentRed }}
            />
          </View>
        </View>

        <View style={{ flex: 1 }} />
        <ChronoActionButton
          title="Recomponer ruta"
          onPress={() => {
            generateTour();
            router.replace('/proposal');
          }}
        />
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 34, lineHeight: 34 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginVertical: 10, lineHeight: 20 },
  card: {
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  label: { fontFamily: ChronoTokens.fonts.bodyMedium, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexGrow: 1,
    minWidth: '28%',
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  chipOn: { backgroundColor: ChronoTokens.colors.inkBlack, borderColor: ChronoTokens.colors.inkBlack },
  chipTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 0.3 },
  chipTxtOn: { color: '#fff' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
