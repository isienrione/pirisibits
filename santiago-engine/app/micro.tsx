import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArchivalImage } from '@/src/components/ArchivalImage';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { MiniAudioBar } from '@/src/components/MiniAudioBar';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { MEDIA } from '@/src/data/catalog';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function MicroScreen() {
  const { audioPlaying, toggleAudio } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Los Dominicos" onBack={() => router.back()} rightLabel="♡" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.micro}>
            <Text style={styles.microTxt}>MICRO · 30 SEG</Text>
          </View>
          <HandwrittenNote color={ChronoTokens.colors.inkBlack}>Mira acá.</HandwrittenNote>
          <Text style={styles.h}>Levanta la vista hacia las dos torres.</Text>
          <Text style={styles.sub}>Busca el verde sobre las cúpulas.</Text>
          <View style={styles.hero}>
            <ArchivalImage uri={MEDIA.churchAndes} style={StyleSheet.absoluteFill} intensity={0.08} />
            <View style={[styles.ring, { left: '28%', top: 18 }]} />
            <View style={[styles.ring, { right: '26%', top: 22 }]} />
            <View style={styles.here}>
              <Text style={styles.hereTxt}>TÚ ESTÁS AQUÍ</Text>
            </View>
          </View>
          <View style={styles.dist}>
            <Text style={styles.distTxt}>A unos 30 m de ti</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.k}>LO QUE ESTÁS VIENDO</Text>
            <Text style={styles.b}>El verde no es pintura.</Text>
            <Text style={styles.body}>Es pátina: cobre que el aire de Santiago fue transformando.</Text>
            <View style={styles.swatches}>
              {[
                ['#8B5A2B', 'COBRE NUEVO'],
                ['#4A3020', 'OXIDACIÓN'],
                [ChronoTokens.colors.accentTeal, 'PÁTINA'],
              ].map(([c, l]) => (
                <View key={l} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={[styles.dot, { backgroundColor: c }]} />
                  <Text style={styles.sw}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.b}>¿Ves que las dos cúpulas no tienen exactamente el mismo tono?</Text>
            <Text style={styles.body}>La pátina nunca envejece de manera perfectamente uniforme.</Text>
          </View>
          <ChronoActionButton title="Ya lo vi" onPress={() => router.push('/mystery')} />
          <Pressable onPress={() => router.push('/audio')}>
            <Text style={styles.sec}>SEGUIR ESCUCHANDO</Text>
          </Pressable>
          <MiniAudioBar
            title="Cap. 2 · El camino de Apoquindo"
            time="04:31"
            thumbnail={MEDIA.churchAndes}
            playing={audioPlaying}
            onToggle={toggleAudio}
          />
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  micro: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  microTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 1 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 30, lineHeight: 30, marginTop: 4 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 10 },
  hero: { height: 210, borderRadius: 14, overflow: 'hidden' },
  ring: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: ChronoTokens.colors.accentRed,
  },
  here: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hereTxt: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 11,
  },
  dist: {
    alignSelf: 'center',
    marginTop: -12,
    backgroundColor: ChronoTokens.colors.accentTeal,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    zIndex: 2,
  },
  distTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 13 },
  card: {
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentTeal, letterSpacing: 1 },
  b: { fontFamily: ChronoTokens.fonts.bodyBold, fontSize: 16, marginTop: 4 },
  body: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginTop: 4, lineHeight: 20 },
  swatches: { flexDirection: 'row', marginTop: 12 },
  dot: { width: 28, height: 28, borderRadius: 14, marginBottom: 4 },
  sw: { fontSize: 9, fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted },
  sec: { textAlign: 'center', marginVertical: 12, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
