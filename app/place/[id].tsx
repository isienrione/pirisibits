import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { StopHeroMedia, StopMediaExtras } from '@/src/components/media/MediaLayer';
import { MiniAudioBar } from '@/src/components/MiniAudioBar';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { getPoiById, narrativeScript, poiImage, SANTIAGO_POIS } from '@/src/data/pois';
import { useDynamicAudio } from '@/src/services/audioController';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function PlaceStandaloneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { catalogPois, addPoiToTour, walkingPaceMs, tourStops } = useWalk();
  const poi =
    catalogPois.find((p) => p.id === id) ?? getPoiById(id ?? '') ?? SANTIAGO_POIS.find((p) => p.id === id);

  const audio = useDynamicAudio({
    poi: poi ?? null,
    walkingPaceMs,
    autoStart: false,
  });

  if (!poi) {
    return (
      <ChronoScreen>
        <SafeAreaView style={styles.safe}>
          <ScreenHeader title="Lugar" onBack={() => router.back()} />
          <Text style={styles.h1}>No encontramos ese archivo.</Text>
        </SafeAreaView>
      </ChronoScreen>
    );
  }

  const script = narrativeScript(poi);
  const added = tourStops.some((s) => s.id === poi.id);
  const moduleText =
    audio.module === 'B' ? script.B : audio.module === 'C' ? script.C : audio.module === 'D' ? script.D : script.A;

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Standalone" onBack={() => router.back()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          <Text style={styles.kicker}>SIN CAMINAR · AUDIO Y MEDIOS</Text>
          <Text style={styles.h1}>{poi.title.toUpperCase()}</Text>
          <Text style={styles.sub}>{poi.subtitle}</Text>
          <StopHeroMedia poi={poi} />
          <MiniAudioBar
            title={`${audio.module} · ${poi.title}`}
            time={audio.playing ? 'LIVE' : '4 MÓDULOS'}
            thumbnail={poiImage(poi)}
            playing={audio.playing}
            onToggle={audio.toggle}
          />
          <Text style={styles.body}>{moduleText}</Text>
          <Pressable onPress={audio.start} style={styles.link}>
            <Text style={styles.linkTxt}>REPRODUCIR MÓDULOS A→D</Text>
          </Pressable>
          <Pressable onPress={audio.skipToNext} style={styles.link}>
            <Text style={styles.linkTxt}>SIGUIENTE MÓDULO</Text>
          </Pressable>
          <StopMediaExtras poi={poi} />
          <ChronoActionButton
            title={added ? 'Ya está en tu ruta' : 'Agregar a mi ruta'}
            disabled={added}
            onPress={() => {
              addPoiToTour(poi.id);
              router.replace('/(tabs)');
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  kicker: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
    fontSize: 12,
    color: ChronoTokens.colors.accentTeal,
    marginBottom: 4,
  },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 36, lineHeight: 36 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginVertical: 8 },
  body: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 12,
  },
  link: { marginBottom: 14, alignItems: 'center' },
  linkTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
