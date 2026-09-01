import { useMemo } from 'react';
import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { SANTIAGO_POIS, poiImage } from '@/src/data/pois';
import { rankPoisForProfile } from '@/src/services/knapsackEngine';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function CatalogScreen() {
  const { catalogPois, userProfile, addPoiToTour, tourStops } = useWalk();
  const inRoute = useMemo(() => new Set(tourStops.map((s) => s.id)), [tourStops]);
  const ranked = useMemo(
    () => rankPoisForProfile(catalogPois.length ? catalogPois : SANTIAGO_POIS, userProfile, [], { hardFilters: false }),
    [catalogPois, userProfile],
  );

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandMark compact />
        <Text style={styles.h1}>Catálogo de Santiago</Text>
        <Text style={styles.sub}>Inventario completo · match con tu tensor · ChronoWorth</Text>
        <FlatList
          data={ranked}
          keyExtractor={(item) => item.poi.id}
          contentContainerStyle={{ paddingBottom: 28 }}
          initialNumToRender={8}
          windowSize={7}
          renderItem={({ item }) => {
            const added = inRoute.has(item.poi.id);
            return (
              <View style={styles.card}>
                <Image source={poiImage(item.poi)} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.poi.title.toUpperCase()}</Text>
                  <Text style={styles.hood}>{item.poi.neighborhood}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${item.matchPct}%` }]} />
                  </View>
                  <Text style={styles.meta}>
                    Match {item.matchPct}% · ChronoWorth {item.chronoWorth}
                  </Text>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => addPoiToTour(item.poi.id)}
                      style={[styles.btn, added && styles.btnOff]}
                    >
                      <Text style={styles.btnTxt}>{added ? 'EN TU RUTA' : 'AGREGAR A MI RUTA'}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push(`/place/${item.poi.id}`)}
                      style={styles.btnGhost}
                    >
                      <Text style={styles.ghostTxt}>VER STANDALONE (AUDIO/MEDIOS)</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 36, lineHeight: 36, marginTop: 10 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    padding: 10,
    marginBottom: 10,
  },
  thumb: { width: 78, height: 78, borderWidth: 1, borderColor: ChronoTokens.colors.inkBlack },
  title: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 18, lineHeight: 20 },
  hood: { fontFamily: ChronoTokens.fonts.body, fontSize: 12, color: ChronoTokens.colors.inkMuted, marginTop: 2 },
  barTrack: { height: 6, backgroundColor: ChronoTokens.colors.borderSoft, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: ChronoTokens.colors.accentTeal },
  meta: { fontFamily: ChronoTokens.fonts.bodyMedium, fontSize: 11, marginTop: 4, color: ChronoTokens.colors.inkBlack },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  btn: {
    backgroundColor: ChronoTokens.colors.inkBlack,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  btnOff: { backgroundColor: ChronoTokens.colors.inkMuted },
  btnTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 0.6 },
  btnGhost: { borderWidth: 1.2, borderColor: ChronoTokens.colors.inkBlack, paddingHorizontal: 8, paddingVertical: 4 },
  ghostTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12, letterSpacing: 0.6 },
});
