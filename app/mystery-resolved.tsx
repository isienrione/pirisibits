import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArchivalImage } from '@/src/components/ArchivalImage';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { MiniAudioBar } from '@/src/components/MiniAudioBar';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { MEDIA } from '@/src/data/catalog';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function MysteryResolvedScreen() {
  const { audioPlaying, toggleAudio } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Mystery" onBack={() => router.back()} rightLabel="♡" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>MISTERIO RESUELTO</Text>
          </View>
          <Text style={styles.loc}>⌖  IGLESIA DE SAN AGUSTÍN • SANTIAGO</Text>
          <Text style={styles.h}>La corona bajó.{'\n'}Nunca volvió a subir.</Text>
          <Text style={styles.sub}>Lo extraño no es dónde está. Es cómo llegó hasta ahí.</Text>
          <View style={styles.hero}>
            <ArchivalImage uri={MEDIA.crucifix} style={StyleSheet.absoluteFill} intensity={0.15} />
            <View style={styles.call}>
              <Text style={styles.callTxt}>MIRA EL CUELLO</Text>
            </View>
          </View>
          <Text style={styles.date}>▦  13 MAY 1647</Text>
          <Text style={styles.b}>La ciudad se vino abajo.</Text>
          <Text style={styles.body}>
            El gran terremoto de Santiago hizo caer la corona de espinas hasta el cuello del Cristo.
            Nadie se atrevió a devolverla a su lugar.
          </Text>
          <Text style={styles.link}>Así nació el Cristo de Mayo.</Text>
          <View style={styles.now}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nowK}>AHORA FÍJATE</Text>
              <Text style={styles.nowB}>La corona sigue allí, en la misma posición.</Text>
            </View>
            <Pressable style={styles.amp}>
              <Text style={styles.ampTxt}>AMPLIAR DETALLE</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>Esto estaba en tu ruta por: HISTORIA • LO INSÓLITO</Text>
          <MiniAudioBar
            title="El Cristo que sobrevivió · Cap. especial"
            time="02:18"
            thumbnail={MEDIA.crucifix}
            playing={audioPlaying}
            onToggle={toggleAudio}
          />
          <View style={{ height: 12 }} />
          <ChronoActionButton title="Volver a mi ruta" onPress={() => router.push('/(tabs)/route')} />
          <Pressable>
            <Text style={styles.save}>GUARDAR ESTA HISTORIA</Text>
          </Pressable>
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
    borderRadius: 6,
  },
  badgeTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 1 },
  loc: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy, marginTop: 8, letterSpacing: 0.6 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 32, lineHeight: 32, marginTop: 6 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 12 },
  hero: { height: 210, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  call: {
    position: 'absolute',
    right: 10,
    top: 80,
    backgroundColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  callTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11 },
  date: { color: ChronoTokens.colors.accentPurple, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
  b: { fontFamily: ChronoTokens.fonts.bodyBold, fontSize: 16, marginTop: 6 },
  body: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, lineHeight: 20, marginTop: 4 },
  link: { color: ChronoTokens.colors.accentPurple, marginVertical: 8, fontFamily: ChronoTokens.fonts.bodyMedium },
  now: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    gap: 8,
  },
  nowK: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentTeal, letterSpacing: 1 },
  nowB: { fontFamily: ChronoTokens.fonts.bodyBold },
  amp: { borderWidth: 1, borderColor: ChronoTokens.colors.accentTeal, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  ampTxt: { color: ChronoTokens.colors.accentTeal, fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11 },
  meta: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkSubtle, fontSize: 12, marginBottom: 12 },
  save: { textAlign: 'center', marginTop: 12, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
