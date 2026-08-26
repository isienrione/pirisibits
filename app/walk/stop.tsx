import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { StopHeroMedia, StopMediaExtras } from '@/src/components/media/MediaLayer';
import { MiniAudioBar } from '@/src/components/MiniAudioBar';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { LAYER_META, narrativeScript, poiImage, resolveInteractiveLayer } from '@/src/data/pois';
import { useDynamicAudio } from '@/src/services/audioController';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

const MODULE_LABEL: Record<string, string> = {
  idle: 'En espera',
  A: 'Módulo A · Ancla visual',
  B: 'Módulo B · Núcleo narrativo',
  C: 'Módulo C · Detalle oculto',
  D: 'Módulo D · Hacia la próxima',
  done: 'Narración completa',
};

export default function WalkStopScreen() {
  const {
    currentPoi,
    currentStopIndex,
    tourStops,
    walkingPaceMs,
    setWalkingPaceMs,
    completeCurrentStop,
    toggleSavedPoi,
    savedItems,
  } = useWalk();

  const poi = currentPoi;
  const audio = useDynamicAudio({
    poi,
    walkingPaceMs,
    autoStart: true,
  });

  if (!poi) {
    return (
      <ChronoScreen>
        <SafeAreaView style={styles.safe}>
          <ScreenHeader title="Parada" onBack={() => router.back()} />
          <Text style={styles.h1}>No hay una parada activa.</Text>
        </SafeAreaView>
      </ChronoScreen>
    );
  }

  const saved = savedItems.poiIds.includes(poi.id);
  const script = narrativeScript(poi);
  const layer = resolveInteractiveLayer(poi);
  const layerMeta = LAYER_META[layer.type];
  const moduleKey =
    audio.module === 'B'
      ? 'module_b'
      : audio.module === 'C'
        ? 'module_c'
        : audio.module === 'D'
          ? 'module_d'
          : 'module_a';
  const activeModuleText =
    audio.module === 'A'
      ? script.A
      : audio.module === 'B'
        ? script.B
        : audio.module === 'C'
          ? script.C
          : audio.module === 'D'
            ? script.D
            : script.A;

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title={`Parada ${currentStopIndex + 1} de ${tourStops.length}`}
          onBack={() => router.back()}
          rightLabel={saved ? '♥' : '♡'}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagTxt}>{MODULE_LABEL[audio.module] ?? 'AUDIO'}</Text>
            </View>
            <View style={styles.layerTag}>
              <Text style={styles.layerTagTxt}>{layerMeta.kicker} · {layerMeta.title}</Text>
            </View>
          </View>
          <Text style={styles.h1}>{poi.title.toUpperCase()}</Text>
          <Text style={styles.sub}>{poi.subtitle}</Text>

          <View style={styles.hero}>
            <StopHeroMedia poi={poi} />
          </View>

          <MiniAudioBar
            title={`${MODULE_LABEL[audio.module]} · ${poi.title}`}
            time={audio.playing ? 'LIVE' : 'PAUSA'}
            thumbnail={poiImage(poi)}
            playing={audio.playing}
            onToggle={audio.toggle}
          />

          <View style={styles.row}>
            <Pressable onPress={() => setWalkingPaceMs(0.2)} style={styles.chip}>
              <Text style={styles.chipTxt}>REPOSO</Text>
            </Pressable>
            <Pressable onPress={() => setWalkingPaceMs(1.0)} style={styles.chip}>
              <Text style={styles.chipTxt}>PASEO</Text>
            </Pressable>
            <Pressable onPress={() => setWalkingPaceMs(1.5)} style={styles.chip}>
              <Text style={styles.chipTxt}>RITMO +15%</Text>
            </Pressable>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleK}>{moduleKey}</Text>
            <Text style={styles.moduleBody}>{activeModuleText}</Text>
          </View>

          <ChronoActionButton
            title="Siguiente parada"
            onPress={() => {
              audio.stop();
              const result = completeCurrentStop();
              if (result.done) router.replace('/end-of-day');
              else router.replace('/walk/active');
            }}
          />

          <View style={styles.extras}>
            <StopMediaExtras poi={poi} />
          </View>

          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              audio.start();
            }}
            style={styles.sim}
          >
            <Text style={styles.simTxt}>SIMULAR LLEGADA (25M)</Text>
          </Pressable>

          <Pressable onPress={audio.skipToNext} style={{ marginTop: 8 }}>
            <Text style={styles.min}>SALTAR AL SIGUIENTE MÓDULO</Text>
          </Pressable>
          <Pressable onPress={() => toggleSavedPoi(poi.id)}>
            <Text style={styles.min}>{saved ? 'QUITAR DE GUARDADOS' : 'GUARDAR ESTE LUGAR'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagTxt: {
    color: '#fff',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 12,
    letterSpacing: 1.1,
  },
  layerTag: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.paperBase,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  layerTagTxt: {
    color: ChronoTokens.colors.inkBlack,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 12,
    letterSpacing: 1.1,
  },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 42,
    lineHeight: 42,
    color: ChronoTokens.colors.inkBlack,
  },
  sub: {
    fontFamily: ChronoTokens.fonts.body,
    color: ChronoTokens.colors.inkMuted,
    fontSize: 15,
    marginBottom: 12,
    marginTop: 4,
  },
  hero: {
    marginBottom: 14,
  },
  extras: {
    marginTop: 16,
  },
  moduleCard: {
    borderWidth: 1.2,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    padding: 12,
    marginBottom: 14,
  },
  moduleK: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
    fontSize: 12,
    color: ChronoTokens.colors.accentTeal,
    marginBottom: 6,
  },
  moduleBody: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: ChronoTokens.colors.inkBlack,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  chip: {
    borderWidth: 1.2,
    borderColor: ChronoTokens.colors.inkBlack,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: ChronoTokens.colors.paperBase,
  },
  chipTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 0.6 },
  sim: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.accentTeal,
    height: 46,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simTxt: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 15,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentTeal,
    textAlign: 'center',
  },
  min: {
    textAlign: 'center',
    marginTop: 12,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1,
    color: ChronoTokens.colors.inkBlack,
  },
});
