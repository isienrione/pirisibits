import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Waveform } from '@/src/components/Waveform';
import { MEDIA } from '@/src/data/catalog';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function AudioNowScreen() {
  const { audioPlaying, toggleAudio } = useWalk();

  return (
    <ChronoScreen>
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
        <ScreenHeader title="Ahora suena" onBack={() => router.back()} light />
        <Image source={{ uri: MEDIA.palaceInterior }} style={styles.cover} />
        <Text style={styles.k}>PALACIO PEREIRA · CAPÍTULO 3 DE 5</Text>
        <Text style={styles.h}>La vida social y el esplendor</Text>
        <Text style={styles.sub}>ChronoWalk Santiago</Text>
        <Waveform progress={0.58} />
        <View style={styles.times}>
          <Text style={styles.t}>03:42</Text>
          <Text style={styles.t}>06:18</Text>
        </View>
        <View style={styles.ctrls}>
          <Text style={styles.c}>⏮</Text>
          <Text style={styles.c}>−15</Text>
          <Pressable onPress={toggleAudio} style={styles.pause}>
            <Text>{audioPlaying ? '❚❚' : '▶'}</Text>
          </Pressable>
          <Text style={styles.c}>+15</Text>
          <Text style={styles.c}>⏭</Text>
        </View>
        <View style={styles.vol} />
        <View style={styles.tiles}>
          {['Velocidad 1x', 'Temporizador', 'Capítulos'].map((t) => (
            <View key={t} style={styles.tile}>
              <Text style={styles.tileTxt}>{t}</Text>
            </View>
          ))}
        </View>
        <View style={styles.tr}>
          <Text style={styles.trK}>TRANSCRIPCIÓN SINCRONIZADA</Text>
          <Text style={styles.trB}>
            Había que saber recibir, ser visto{' '}
            <Text style={{ fontFamily: ChronoTokens.fonts.bodyBold }}>
              y convertir cada salón en una declaración.
            </Text>
          </Text>
          <Pressable onPress={() => router.push('/audio-transcript')}>
            <Text style={styles.link}>VER TRANSCRIPCIÓN COMPLETA</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  cover: { width: '100%', height: 240, borderRadius: 18, marginBottom: 16 },
  k: { color: ChronoTokens.colors.accentRed, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  h: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 28, lineHeight: 28, marginTop: 4 },
  sub: { color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  t: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  ctrls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginVertical: 16 },
  c: { color: '#fff', fontSize: 16 },
  pause: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vol: { height: 4, backgroundColor: ChronoTokens.colors.accentTeal, borderRadius: 2, marginBottom: 14 },
  tiles: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tile: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 10 },
  tileTxt: { color: '#fff', fontSize: 11, textAlign: 'center', fontFamily: ChronoTokens.fonts.body },
  tr: { borderWidth: 1, borderColor: ChronoTokens.colors.accentPurple, borderRadius: 12, padding: 12 },
  trK: { color: ChronoTokens.colors.accentPurple, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1, marginBottom: 6 },
  trB: { color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  link: { color: ChronoTokens.colors.accentPurple, marginTop: 8, fontFamily: ChronoTokens.fonts.titleHeavy },
});
