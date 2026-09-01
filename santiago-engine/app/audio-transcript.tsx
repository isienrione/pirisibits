import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Waveform } from '@/src/components/Waveform';
import { AUDIO_CHAPTERS } from '@/src/data/catalog';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function TranscriptScreen() {
  const { audioPlaying, toggleAudio } = useWalk();

  return (
    <ChronoScreen>
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
        <ScreenHeader title="Palacio Pereira" onBack={() => router.back()} light />
        <Text style={styles.sub}>EXPERIENCIA • MEMORIA VIVA</Text>
        <View style={styles.player}>
          <Text style={styles.ch}>CAPÍTULO 3 DE 5</Text>
          <Text style={styles.h}>La vida social y el esplendor</Text>
          <Waveform progress={0.62} />
          <View style={styles.row}>
            <Text style={styles.t}>04:18</Text>
            <Pressable onPress={toggleAudio} style={styles.pause}>
              <Text>{audioPlaying ? '❚❚' : '▶'}</Text>
            </Pressable>
            <Text style={styles.t}>06:42</Text>
          </View>
        </View>
        <View style={styles.tabs}>
          <View style={styles.tabOn}>
            <Text style={styles.tabOnTxt}>TRANSCRIPCIÓN</Text>
          </View>
          <View style={styles.tab}>
            <Text style={styles.tabTxt}>CAPÍTULOS</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardK}>03 · Estás escuchando · 2 min restantes</Text>
            <Text style={styles.p}>En 1913, recibir en este salón era una declaración pública.</Text>
            <View style={styles.active}>
              <Text style={styles.activeT}>04:18</Text>
              <Text style={styles.activeP}>
                Había que saber recibir, ser visto y convertir cada salón en una declaración.
              </Text>
            </View>
            <Text style={styles.p}>
              El palacio todavía guarda ese gesto: mirar hacia arriba, esperar la luz, y quedarse un
              segundo más.
            </Text>
          </View>
          {AUDIO_CHAPTERS.map((c, i) => (
            <Text key={c.id} style={styles.chap}>
              {String(i + 1).padStart(2, '0')}  {c.title}  ·  {c.duration}
            </Text>
          ))}
        </ScrollView>
        <Pressable style={styles.purple} onPress={() => router.back()}>
          <Text style={styles.purpleTxt}>VOLVER AL REPRODUCTOR ↓</Text>
        </Pressable>
      </SafeAreaView>
    </View>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  sub: { color: ChronoTokens.colors.accentTeal, textAlign: 'center', fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1, marginBottom: 10 },
  player: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 12, marginBottom: 12 },
  ch: { color: ChronoTokens.colors.accentOrange, fontFamily: ChronoTokens.fonts.titleHeavy },
  h: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  t: { color: 'rgba(255,255,255,0.6)' },
  pause: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 999, padding: 4, marginBottom: 12 },
  tabOn: { flex: 1, backgroundColor: ChronoTokens.colors.accentPurple, borderRadius: 999, paddingVertical: 8 },
  tabOnTxt: { color: '#fff', textAlign: 'center', fontFamily: ChronoTokens.fonts.titleHeavy },
  tab: { flex: 1, paddingVertical: 8 },
  tabTxt: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontFamily: ChronoTokens.fonts.titleHeavy },
  card: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 14, marginBottom: 12 },
  cardK: { color: ChronoTokens.colors.accentPurple, fontFamily: ChronoTokens.fonts.bodyMedium, marginBottom: 8 },
  p: { color: 'rgba(255,255,255,0.75)', lineHeight: 22, marginBottom: 8 },
  active: { borderLeftWidth: 3, borderLeftColor: ChronoTokens.colors.accentPurple, paddingLeft: 10, marginVertical: 8 },
  activeT: { color: ChronoTokens.colors.accentPurple, fontSize: 12 },
  activeP: { color: '#fff', fontFamily: ChronoTokens.fonts.bodyBold, lineHeight: 22 },
  chap: { color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontFamily: ChronoTokens.fonts.body },
  purple: {
    backgroundColor: ChronoTokens.colors.accentPurple,
    borderRadius: 999,
    paddingVertical: 14,
    marginVertical: 10,
  },
  purpleTxt: { color: '#fff', textAlign: 'center', fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
