import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { OnboardingProgress } from '@/src/components/OnboardingProgress';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { MOBILITY_ARCHETYPES, type MobilityArchetypeId } from '@/src/data/algorithm';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

const ORDER: MobilityArchetypeId[] = ['M2', 'M5', 'M3', 'M4'];

export default function ArchetypeScreen() {
  const { mobilityArchetype, setMobilityArchetype } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <OnboardingProgress step={2} />
        <Text style={styles.h1}>¿Cómo quieres moverte?</Text>
        <HandwrittenNote style={styles.note}>arquetipo M_y</HandwrittenNote>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {ORDER.map((id) => {
            const item = MOBILITY_ARCHETYPES[id];
            const selected = mobilityArchetype === id;
            return (
              <Pressable
                key={id}
                onPress={() => setMobilityArchetype(id)}
                style={[styles.card, selected && styles.cardOn, item.highlight && styles.cardHi]}
              >
                <View style={styles.row}>
                  <Text style={[styles.code, item.highlight && styles.codeHi]}>{id}</Text>
                  {item.highlight ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>{id === 'M2' ? 'ACCESIBLE' : 'SIN FRICCIÓN'}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.title}>{item.title.toUpperCase()}</Text>
                <Text style={styles.sub}>{item.subtitle}</Text>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <ChronoActionButton title="Siguiente" onPress={() => router.push('/onboarding/posture')} />
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 40,
    lineHeight: 40,
    color: ChronoTokens.colors.inkBlack,
    width: '90%',
  },
  note: { alignSelf: 'flex-end', marginBottom: 12 },
  card: {
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.paperBase,
    padding: 14,
    marginBottom: 10,
    minHeight: 108,
  },
  cardOn: { borderColor: ChronoTokens.colors.accentRed, borderWidth: 2.5 },
  cardHi: { backgroundColor: ChronoTokens.colors.surfaceWhite },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, paddingRight: 32 },
  code: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 16,
    letterSpacing: 1.4,
    color: ChronoTokens.colors.inkMuted,
  },
  codeHi: { color: ChronoTokens.colors.accentTeal },
  badge: {
    backgroundColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11, letterSpacing: 1 },
  title: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 24,
    lineHeight: 26,
    color: ChronoTokens.colors.inkBlack,
    paddingRight: 36,
  },
  sub: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 13,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 4,
    paddingRight: 36,
  },
  radio: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: ChronoTokens.colors.accentRed, borderColor: ChronoTokens.colors.accentRed },
  check: { color: '#fff', fontWeight: '700' },
});
