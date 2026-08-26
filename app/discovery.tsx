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

export default function DiscoveryScreen() {
  const { audioPlaying, toggleAudio } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Palacio Pereira" onBack={() => router.back()} rightLabel="♡" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>DISCOVERY</Text>
          </View>
          <Text style={styles.step}>DESCUBRIMIENTO 1 DE 2</Text>
          <Text style={styles.h}>Fíjate en este detalle.</Text>
          <HandwrittenNote style={{ marginBottom: 10 }}>¿Qué hacen dos gigantes aquí?</HandwrittenNote>
          <View style={styles.hero}>
            <ArchivalImage uri={MEDIA.statues} style={StyleSheet.absoluteFill} />
            <View style={[styles.circle, { left: 70, top: 36 }]} />
            <View style={[styles.circle, { right: 70, top: 40 }]} />
          </View>
          <View style={styles.card}>
            <Text style={styles.h2}>No son simples estatuas.</Text>
            <Text style={styles.body}>
              Los atlantes sostienen el balcón como si cargaran el peso de una familia que quería
              verse europea. Son un gesto de poder, no un adorno.
            </Text>
            <View style={styles.div} />
            <Text style={styles.why}>POR QUÉ IMPORTA</Text>
            <Text style={styles.body}>
              En Santiago, el lujo se construyó mirando a París. Estas figuras lo dicen sin palabras.
            </Text>
          </View>
          <ChronoActionButton title="Quiero verlo en el lugar" onPress={() => router.push('/then-now')} />
          <Pressable onPress={() => router.push('/audio')}>
            <Text style={styles.sec}>SEGUIR ESCUCHANDO</Text>
          </Pressable>
          <MiniAudioBar
            title="Cap. 3 · La vida social y el esplendor"
            time="03:42"
            thumbnail={MEDIA.palaceInterior}
            playing={audioPlaying}
            onToggle={toggleAudio}
            onPress={() => router.push('/audio-now')}
          />
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentPurple,
    paddingHorizontal: 10,
    paddingVertical: 5,
    transform: [{ rotate: '-6deg' }],
    marginBottom: 8,
  },
  badgeTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  step: { color: ChronoTokens.colors.accentPurple, fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 1 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 32, lineHeight: 32 },
  hero: { height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  circle: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: ChronoTokens.colors.accentRed,
  },
  card: {
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  h2: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22 },
  body: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, lineHeight: 20, marginTop: 6 },
  div: { height: 1, backgroundColor: ChronoTokens.colors.borderSoft, marginVertical: 10 },
  why: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentYellow, letterSpacing: 1 },
  sec: { textAlign: 'center', marginVertical: 12, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
