import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArchivalImage } from '@/src/components/ArchivalImage';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { MEDIA } from '@/src/data/catalog';
import { ChronoTokens } from '@/src/theme/tokens';

export default function ExperienceScreen() {
  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Experiencia" onBack={() => router.back()} rightLabel="♡" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.cats}>ARQUITECTURA · VIDA SOCIAL</Text>
          <Text style={styles.h1}>PALACIO PEREIRA</Text>
          <Text style={styles.sub}>El lujo de vivir la Belle Époque en Santiago.</Text>
          <View style={styles.hero}>
            <ArchivalImage uri={MEDIA.palaceFacade} style={StyleSheet.absoluteFill} intensity={0.1} />
            <View style={styles.sun}>
              <Text style={styles.sunTxt}>HISTORIA{'\n'}VIVA</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <Text style={styles.stat}>15 min</Text>
            <Text style={styles.stat}>5 capítulos</Text>
            <Text style={styles.stat}>Audio + visual</Text>
          </View>
          <Text style={styles.hint}>Puedes moverte mientras escuchas.</Text>
          <View style={styles.call}>
            <Text style={styles.callK}>ANTES DE COMENZAR</Text>
            <Text style={styles.callH}>Mira el segundo piso.</Text>
            <Text style={styles.callB}>
              Busca los balcones y las ventanas altas. Allí empieza la historia de una familia que
              quiso convertir Santiago en París.
            </Text>
          </View>
          <View style={styles.ok}>
            <Text style={styles.okTxt}>✓  Estás frente al lugar correcto</Text>
          </View>
          <ChronoActionButton title="Comenzar" onPress={() => router.push('/audio')} />
          <Pressable onPress={() => router.push('/(tabs)/route')}>
            <Text style={styles.back}>VOLVER A MI RUTA</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  cats: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentRed, letterSpacing: 1.2 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 42, lineHeight: 42 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 12 },
  hero: { height: 180, marginBottom: 12 },
  sun: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ChronoTokens.colors.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, textAlign: 'center', fontSize: 12, lineHeight: 13 },
  stats: {
    flexDirection: 'row',
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
  },
  stat: { fontFamily: ChronoTokens.fonts.bodyMedium, fontSize: 12 },
  hint: { textAlign: 'center', color: ChronoTokens.colors.inkSubtle, fontSize: 12, marginVertical: 8 },
  call: {
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.accentYellow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  callK: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentYellow, letterSpacing: 1 },
  callH: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22, marginVertical: 4 },
  callB: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted },
  ok: {
    backgroundColor: ChronoTokens.colors.accentTeal,
    borderRadius: 999,
    padding: 12,
    marginBottom: 14,
  },
  okTxt: { color: '#fff', textAlign: 'center', fontFamily: ChronoTokens.fonts.bodyMedium },
  back: { textAlign: 'center', marginTop: 12, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
