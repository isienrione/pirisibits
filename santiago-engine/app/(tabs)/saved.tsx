import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { getPoiById, poiImage } from '@/src/data/pois';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';
import { useState } from 'react';

const TABS = ['Lugares', 'Rutas', 'Notas'] as const;

export default function SavedTab() {
  const { savedItems, userJournal, activeTour, toggleSavedPoi } = useWalk();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Lugares');
  const pois = savedItems.poiIds.map((id) => getPoiById(id)).filter(Boolean);
  const notes = Object.entries(userJournal.personalNotes);

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandMark compact />
        <Text style={styles.h1}>Guardados</Text>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <Text style={[styles.tabTxt, tab === t && styles.tabTxtOn]}>{t.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {tab === 'Lugares' ? (
            pois.length ? (
              pois.map((p) =>
                p ? (
                  <Pressable key={p.id} style={styles.row} onPress={() => router.push('/walk/stop')}>
                    <Image source={poiImage(p)} style={styles.thumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{p.title}</Text>
                      <Text style={styles.sub}>{p.neighborhood}</Text>
                    </View>
                    <Pressable onPress={() => toggleSavedPoi(p.id)} hitSlop={8}>
                      <Text style={styles.heart}>♥</Text>
                    </Pressable>
                  </Pressable>
                ) : null,
              )
            ) : (
              <Text style={styles.empty}>Guarda un lugar desde la parada para armar tu colección.</Text>
            )
          ) : null}

          {tab === 'Rutas' ? (
            savedItems.customRouteIds.length || activeTour ? (
              <View style={styles.card}>
                <Text style={styles.k}>RUTA GUARDADA</Text>
                <Text style={styles.title}>{activeTour?.title ?? 'Tu última propuesta'}</Text>
                <Text style={styles.sub}>
                  {activeTour ? `${activeTour.stops.length} paradas · ${activeTour.distanceKm} km` : 'Sin itinerario aún'}
                </Text>
              </View>
            ) : (
              <Text style={styles.empty}>Cuando aceptes una propuesta, podrás guardarla aquí.</Text>
            )
          ) : null}

          {tab === 'Notas' ? (
            notes.length ? (
              notes.map(([date, text]) => (
                <View key={date} style={styles.card}>
                  <Text style={styles.k}>{date}</Text>
                  <Text style={styles.note}>{text}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>Las notas del cierre de día aparecen en esta pestaña.</Text>
            )
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 42, marginTop: 8, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { borderWidth: 1.2, borderColor: ChronoTokens.colors.borderSoft, paddingHorizontal: 10, paddingVertical: 6 },
  tabOn: { backgroundColor: ChronoTokens.colors.inkBlack, borderColor: ChronoTokens.colors.inkBlack },
  tabTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 0.8, fontSize: 13 },
  tabTxtOn: { color: '#fff' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  thumb: { width: 72, height: 72, borderWidth: 1.2, borderColor: '#121212' },
  title: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 20 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, fontSize: 12 },
  heart: { color: ChronoTokens.colors.accentRed, fontSize: 18 },
  empty: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, lineHeight: 20 },
  card: {
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    padding: 14,
    borderWidth: 1,
    borderColor: ChronoTokens.colors.borderSoft,
    marginBottom: 10,
  },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.2, color: ChronoTokens.colors.accentPurple, marginBottom: 4 },
  note: { fontFamily: ChronoTokens.fonts.handwritten, fontSize: 22 },
});
