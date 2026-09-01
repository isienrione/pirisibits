import { router } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Waveform } from '@/src/components/Waveform';
import { MEDIA } from '@/src/data/catalog';
import { ttsSpeedFromWalkingPace } from '@/src/data/algorithm';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';
import { fillParent } from '@/src/theme/layout';

export default function AudioScreen() {
  const { audioPlaying, toggleAudio, walkingPaceMs } = useWalk();
  const speed = ttsSpeedFromWalkingPace(walkingPaceMs);

  return (
    <ChronoScreen>
    <ImageBackground source={{ uri: MEDIA.palaceInterior }} style={styles.bg}>
      <View style={styles.dim} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16 }}>
          <ScreenHeader
            title="Palacio Pereira"
            onBack={() => router.back()}
            light
            onRight={() => router.push('/audio-now')}
            rightLabel="♡"
          />
          <View style={styles.segs}>
            <View style={[styles.seg, { backgroundColor: ChronoTokens.colors.accentTeal }]} />
            <View style={[styles.seg, { backgroundColor: ChronoTokens.colors.accentTeal }]} />
            <View style={[styles.seg, { backgroundColor: ChronoTokens.colors.accentOrange }]} />
            <View style={styles.seg} />
            <View style={styles.seg} />
          </View>
          <Text style={styles.ch}>CAPÍTULO 3 DE 5</Text>
          <Text style={styles.h}>La vida social y el esplendor</Text>
          <Text style={styles.p}>
            Aquí no bastaba con tener dinero. Había que saber recibir, ser visto y convertir cada
            salón en una declaración.
          </Text>
          <View style={styles.look}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lookK}>AHORA, MIRA</Text>
              <Text style={styles.lookH}>El gran candelabro.</Text>
              <Text style={styles.lookP}>
                Imagina este salón encendido antes de que Santiago tuviera luz eléctrica.
              </Text>
            </View>
            <Pressable onPress={() => router.push('/discovery')} style={styles.eye}>
              <Text style={{ color: ChronoTokens.colors.accentYellow }}>◉↑</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.player}>
          <Waveform progress={0.58} />
          <View style={styles.times}>
            <Text style={styles.t}>03:42</Text>
            <Text style={styles.t}>06:18 · TTS {speed.toFixed(2)}x</Text>
          </View>
          <View style={styles.ctrls}>
            <Text style={styles.c}>−15s</Text>
            <Pressable onPress={toggleAudio} style={styles.pause}>
              <Text style={{ fontSize: 18 }}>{audioPlaying ? '❚❚' : '▶'}</Text>
            </Pressable>
            <Text style={styles.c}>+15s</Text>
            <Pressable onPress={() => router.push('/audio-now')} style={styles.speed}>
              <Text style={styles.speedTxt}>1x</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => router.push('/audio-transcript')}>
            <Text style={styles.tr}>LEER TRANSCRIPCIÓN</Text>
          </Pressable>
          <Pressable style={styles.next} onPress={() => router.push('/micro')}>
            <View>
              <Text style={styles.nextK}>SIGUIENTE</Text>
              <Text style={styles.nextT}>El palacio que quedó vacío</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 22 }}>→</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#111' },
  dim: { ...fillParent, backgroundColor: 'rgba(0,0,0,0.35)' },
  segs: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  seg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2 },
  ch: { color: ChronoTokens.colors.accentOrange, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.4 },
  h: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 36, lineHeight: 36, marginVertical: 6 },
  p: { color: 'rgba(255,255,255,0.9)', fontFamily: ChronoTokens.fonts.body, lineHeight: 20 },
  look: {
    marginTop: 18,
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.accentYellow,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(18,18,18,0.72)',
    flexDirection: 'row',
    gap: 8,
  },
  lookK: { color: ChronoTokens.colors.accentYellow, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  lookH: { color: '#fff', fontFamily: ChronoTokens.fonts.bodyBold, fontSize: 16 },
  lookP: { color: 'rgba(255,255,255,0.8)', fontFamily: ChronoTokens.fonts.body, fontSize: 13 },
  eye: { justifyContent: 'center' },
  player: {
    backgroundColor: ChronoTokens.colors.playerDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  t: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  ctrls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginVertical: 12 },
  c: { color: '#fff', fontFamily: ChronoTokens.fonts.bodyMedium },
  pause: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speed: { position: 'absolute', right: 8, borderWidth: 1, borderColor: '#fff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  speedTxt: { color: '#fff', fontSize: 12 },
  tr: { textAlign: 'center', color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.2, marginBottom: 12 },
  next: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextK: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 1 },
  nextT: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 18 },
});
