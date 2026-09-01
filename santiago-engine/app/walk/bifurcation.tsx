import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { getPoiById, poiImage } from '@/src/data/pois';
import { BIFURCATION_PAIR } from '@/src/services/routeEngine';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function BifurcationScreen() {
  const { chooseBifurcation } = useWalk();
  const left = getPoiById(BIFURCATION_PAIR.left);
  const right = getPoiById(BIFURCATION_PAIR.right);

  const pick = (id: string) => {
    chooseBifurcation(id);
    router.replace('/walk/active');
  };

  if (!left || !right) return null;

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Dos caminos" onBack={() => router.back()} />
        <Text style={styles.k}>BIFURCACIÓN</Text>
        <Text style={styles.h1}>El algoritmo ve dos historias a un giro.</Text>
        <Text style={styles.sub}>
          Subir al cerro o seguir el barrio. Elige según tu ritmo: tiempo estimado desde aquí.
        </Text>

        <Pressable onPress={() => pick(left.id)} style={styles.card}>
          <Image source={poiImage(left)} style={styles.img} />
          <View style={styles.wash} />
          <View style={styles.meta}>
            <Text style={styles.opt}>CAMINO A</Text>
            <Text style={styles.title}>{left.title.toUpperCase()}</Text>
            <Text style={styles.time}>{left.dwellMinutes + 8} min · {left.stairs ? 'con peldaños' : 'plano'}</Text>
          </View>
        </Pressable>

        <Text style={styles.or}>o</Text>

        <Pressable onPress={() => pick(right.id)} style={styles.card}>
          <Image source={poiImage(right)} style={styles.img} />
          <View style={styles.wash} />
          <View style={styles.meta}>
            <Text style={styles.opt}>CAMINO B</Text>
            <Text style={styles.title}>{right.title.toUpperCase()}</Text>
            <Text style={styles.time}>{right.dwellMinutes + 6} min · a nivel de calle</Text>
          </View>
        </Pressable>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.6, color: ChronoTokens.colors.accentPurple, marginBottom: 6 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 34, lineHeight: 34 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginVertical: 10, lineHeight: 20 },
  card: {
    height: 168,
    borderWidth: 1.5,
    borderColor: '#121212',
    overflow: 'hidden',
    marginTop: 8,
  },
  img: { width: '100%', height: '100%' },
  wash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,18,18,0.28)' },
  meta: { position: 'absolute', left: 14, bottom: 12, right: 14 },
  opt: { color: ChronoTokens.colors.accentYellow, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.4, fontSize: 12 },
  title: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 26, lineHeight: 28 },
  time: { color: '#F4EFE6', fontFamily: ChronoTokens.fonts.body, marginTop: 2 },
  or: {
    textAlign: 'center',
    fontFamily: ChronoTokens.fonts.handwritten,
    fontSize: 28,
    color: ChronoTokens.colors.accentRed,
    marginVertical: 4,
  },
});
