import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { LocalImages } from '@/src/data/localImages';
import { ChronoTokens } from '@/src/theme/tokens';

export default function WalkMysteryScreen() {
  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Misterio" onBack={() => router.back()} />

        <View style={styles.dossier}>
          <Image source={LocalImages.insolito} style={styles.dossierImg} resizeMode="cover" />
          <View style={styles.dossierWash} />
          <View style={styles.patch}>
            <Text style={styles.qmark}>?</Text>
          </View>
        </View>

        <Text style={styles.h}>Hay algo aquí que no te voy a spoilear.</Text>
        <Text style={styles.sub}>A 4 min de ti · micro-revelación en el camino</Text>

        <View style={{ flex: 1 }} />
        <ChronoActionButton title="LLÉVAME" onPress={() => router.push('/mystery-resolved')} />
        <Pressable onPress={() => router.replace('/walk/active')} style={styles.skip}>
          <Text style={styles.skipTxt}>SEGUIR MI RUTA</Text>
        </Pressable>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  dossier: {
    height: 210,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    overflow: 'hidden',
    backgroundColor: '#D8C9B0',
  },
  dossierImg: { width: '100%', height: '100%' },
  dossierWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(62, 44, 26, 0.28)',
  },
  patch: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 92,
    height: 92,
    backgroundColor: ChronoTokens.colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
  },
  qmark: {
    color: '#FFF',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 64,
    lineHeight: 68,
  },
  h: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 38,
    lineHeight: 38,
    color: ChronoTokens.colors.inkBlack,
  },
  sub: {
    fontFamily: ChronoTokens.fonts.body,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 10,
    fontSize: 15,
  },
  skip: { marginTop: 14, alignItems: 'center' },
  skipTxt: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
    fontSize: 16,
    color: ChronoTokens.colors.inkBlack,
  },
});
