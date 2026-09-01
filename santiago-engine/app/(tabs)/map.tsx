import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArchivalImage } from '@/src/components/ArchivalImage';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { VintageMap } from '@/src/components/VintageMap';
import { MEDIA } from '@/src/data/catalog';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function MapTab() {
  const { finishLabel, setStatus, startTour, activeTour, remainingMinutes } = useWalk();
  const n = activeTour?.stops.length ?? 4;

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Tu ruta" onBack={() => router.back()} />
        <View style={styles.meta}>
          <Text style={styles.metaTxt}>{n} paradas • {activeTour?.distanceKm ?? 2.8} km • {remainingMinutes} min</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>CAMINABLE</Text>
          </View>
        </View>
        <View style={styles.map}>
          <VintageMap height={340} stopCount={n} />
          <ArchivalImage uri={MEDIA.cathedral} style={styles.scrap} />
        </View>
        <View style={styles.sheet}>
          <Text style={styles.h}>Tu tarde, en una mirada</Text>
          <View style={styles.row}>
            <Text style={styles.bold}>◷  Terminas aprox. {finishLabel}</Text>
            <HandwrittenNote size={14} rotate={-2} style={{ flex: 1, marginLeft: 8 }}>
              Puedes ajustar el plan antes de salir.
            </HandwrittenNote>
          </View>
          <ChronoActionButton
            title="Empezar"
            onPress={() => {
              startTour();
              setStatus('active');
              router.push('/walk/active');
            }}
          />
          <Pressable onPress={() => router.push('/adjust-route')}>
            <Text style={styles.sec}>AJUSTAR RUTA</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metaTxt: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted },
  badge: {
    backgroundColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12 },
  map: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  scrap: { position: 'absolute', left: 0, bottom: 0, width: 120, height: 90 },
  sheet: {
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    marginHorizontal: -16,
  },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 24, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  bold: { fontFamily: ChronoTokens.fonts.bodyBold, fontSize: 13 },
  sec: {
    textAlign: 'center',
    marginTop: 12,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 16,
    color: ChronoTokens.colors.accentPurple,
    letterSpacing: 1,
  },
});
