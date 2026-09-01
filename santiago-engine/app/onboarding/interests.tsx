import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { InterestGridCard } from '@/src/components/InterestGridCard';
import { OnboardingProgress } from '@/src/components/OnboardingProgress';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import {
  MAX_MICRO_INTERESTS,
  MICRO_INTERESTS,
  isMicroInterest,
  type MicroInterestId,
  type PillarId,
} from '@/src/data/algorithm';
import { INTERESTS } from '@/src/data/catalog';
import { useInterestSelection } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function InterestsScreen() {
  const { interests, toggleInterest } = useInterestSelection();
  const [openPillar, setOpenPillar] = useState<PillarId | null>('historia');
  const selected = useMemo(() => interests.filter(isMicroInterest), [interests]);
  const ready = selected.length >= 2;
  const micros = useMemo(
    () =>
      (Object.keys(MICRO_INTERESTS) as MicroInterestId[]).filter(
        (id) => MICRO_INTERESTS[id].pillar === openPillar,
      ),
    [openPillar],
  );

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <Image
          source={require('../../assets/images/stgo_cathedral_etch.png')}
          style={styles.watermark}
          resizeMode="contain"
        />
        <OnboardingProgress step={1} />

        <Text style={styles.h1}>¿Qué te atrae de una ciudad?</Text>
        <Text style={styles.note}>matices acumulativos · T1A ≠ T1B</Text>

        <View style={styles.picked}>
          {selected.length ? (
            selected.map((id) => (
              <Pressable key={id} onPress={() => toggleInterest(id)} style={styles.chip}>
                <Text style={styles.chipTxt}>{MICRO_INTERESTS[id].code}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.pickedHint}>tus matices se acumulan aquí al cambiar de categoría</Text>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {INTERESTS.map((item, index) => {
            const pillarMicros = (Object.keys(MICRO_INTERESTS) as MicroInterestId[]).filter(
              (id) => MICRO_INTERESTS[id].pillar === item.id,
            );
            const selectedCount = pillarMicros.filter((id) => selected.includes(id)).length;
            return (
              <InterestGridCard
                key={item.id}
                title={item.title}
                image={item.image}
                swatch={item.swatch}
                selected={selectedCount > 0}
                expanded={openPillar === item.id}
                swatchCorner={index % 2 === 0 ? 'left' : 'right'}
                onPress={() => setOpenPillar(item.id)}
              />
            );
          })}

          {openPillar ? (
            <View style={styles.level2}>
              <Text style={styles.level2K}>
                {openPillar === 'historia'
                  ? 'NIVEL 2 · DISCRIMINA T1A CÍVICO vs T1B MEMORIA'
                  : 'NIVEL 2 · MATICES'}
              </Text>
              {micros.map((id) => {
                const micro = MICRO_INTERESTS[id];
                const on = selected.includes(id);
                const memory = id === 'memoria_ddhh';
                const civic = id === 'historia_civica';
                return (
                  <Pressable
                    key={id}
                    onPress={() => toggleInterest(id)}
                    style={[
                      styles.micro,
                      on && styles.microOn,
                      memory && styles.microMemory,
                      civic && styles.microCivic,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.microCode, memory && { color: ChronoTokens.colors.accentPurple }]}>
                        {micro.code}
                      </Text>
                      <Text style={styles.microTitle}>{micro.title.toUpperCase()}</Text>
                      <Text style={styles.microSub}>{micro.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, on && styles.radioOn]}>
                      {on ? <Text style={styles.check}>✓</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.count}>
            {selected.length} matices guardados · máximo {MAX_MICRO_INTERESTS}
          </Text>
          <ChronoActionButton
            title="SIGUIENTE"
            disabled={!ready}
            onPress={() => router.push('/onboarding/archetype')}
          />
        </View>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  watermark: {
    position: 'absolute',
    right: -18,
    top: 4,
    width: 150,
    height: 230,
    opacity: 0.52,
    zIndex: 0,
  },
  h1: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    lineHeight: 40,
    color: '#121212',
    marginRight: 72,
    zIndex: 2,
  },
  note: {
    fontFamily: 'Caveat_700Bold',
    fontSize: 22,
    color: '#E54B2D',
    transform: [{ rotate: '-3deg' }],
    marginTop: 4,
    marginBottom: 10,
    zIndex: 2,
  },
  picked: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    zIndex: 2,
  },
  chip: {
    borderWidth: 1.2,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipTxt: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 13,
    letterSpacing: 1,
  },
  pickedHint: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 12,
    color: ChronoTokens.colors.inkMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingBottom: 12,
    zIndex: 2,
  },
  level2: {
    width: '100%',
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: '#121212',
    backgroundColor: ChronoTokens.colors.paperBase,
    padding: 12,
  },
  level2K: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
    fontSize: 13,
    color: ChronoTokens.colors.accentTeal,
    marginBottom: 10,
  },
  micro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.2,
    borderColor: ChronoTokens.colors.inkBlack,
    padding: 10,
    marginBottom: 8,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
  },
  microOn: { borderColor: ChronoTokens.colors.accentRed, borderWidth: 2 },
  microMemory: { borderLeftWidth: 5, borderLeftColor: ChronoTokens.colors.accentPurple },
  microCivic: { borderLeftWidth: 5, borderLeftColor: ChronoTokens.colors.accentTeal },
  microCode: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 12,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentRed,
  },
  microTitle: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 18,
    lineHeight: 20,
    color: ChronoTokens.colors.inkBlack,
  },
  microSub: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 12,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 2,
  },
  radio: {
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
  footer: { paddingTop: 8 },
  count: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#121212',
    textAlign: 'center',
    marginBottom: 12,
  },
});
