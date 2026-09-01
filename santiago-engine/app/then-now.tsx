import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { MiniAudioBar } from '@/src/components/MiniAudioBar';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ThenNowSlider } from '@/src/components/ThenNowSlider';
import { LocalImages } from '@/src/data/localImages';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function ThenNowScreen() {
  const { audioPlaying, toggleAudio } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Los Dominicos" onBack={() => router.back()} rightLabel="♡" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>THEN / NOW</Text>
          </View>
          <Text style={styles.h}>Cuando Apoquindo era campo.</Text>
          <Text style={styles.sub}>Desliza para recorrer el mismo camino en dos épocas.</Text>
          <ThenNowSlider thenImage={LocalImages.moneda1973} nowImage={LocalImages.monedaToday} />
          <View style={styles.card}>
            <Text style={styles.k}>FÍJATE EN</Text>
            <Text style={styles.b}>Las cúpulas cambiaron de color.</Text>
            <Text style={styles.body}>El cobre nuevo era rojizo. El tiempo lo volvió verde.</Text>
          </View>
          <View style={styles.split}>
            <View style={{ flex: 1 }}>
              <Text style={styles.red}>LO QUE CAMBIÓ</Text>
              <Text style={styles.body}>El camino rural se hizo avenida.</Text>
            </View>
            <View style={styles.v} />
            <View style={{ flex: 1 }}>
              <Text style={styles.teal}>LO QUE PERMANECE</Text>
              <Text style={styles.body}>Las torres y la vista a la cordillera.</Text>
            </View>
          </View>
          <HandwrittenNote style={{ marginVertical: 10 }}>
            Antes del metro, hasta aquí se llegaba en carruaje.
          </HandwrittenNote>
          <ChronoActionButton title="Continuar experiencia" onPress={() => router.push('/micro')} />
          <Pressable>
            <Text style={styles.sec}>VOLVER A COMPARAR</Text>
          </Pressable>
          <MiniAudioBar
            title="Cap. 2 · El camino de Apoquindo"
            time="04:18"
            thumbnail={LocalImages.monedaToday}
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentPurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '-4deg' }],
  },
  badgeTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 32, lineHeight: 32, marginTop: 8 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 12 },
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
    borderRadius: 14,
    padding: 12,
    backgroundColor: ChronoTokens.colors.paperBase,
  },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentTeal, letterSpacing: 1 },
  b: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 20 },
  body: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginTop: 4 },
  split: { flexDirection: 'row', marginTop: 12, gap: 10 },
  v: { width: 1, backgroundColor: ChronoTokens.colors.borderSoft },
  red: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentRed, letterSpacing: 1 },
  teal: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentTeal, letterSpacing: 1 },
  sec: { textAlign: 'center', marginVertical: 12, fontFamily: ChronoTokens.fonts.titleHeavy },
});
