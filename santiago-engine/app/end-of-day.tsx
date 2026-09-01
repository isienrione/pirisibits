import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArchivalImage } from '@/src/components/ArchivalImage';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { MEDIA } from '@/src/data/catalog';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function EndOfDayScreen() {
  const { closeDay, userJournal, tourStops, activeTour } = useWalk();
  const [note, setNote] = useState(userJournal.personalNotes[userJournal.date] ?? '');
  const places = activeTour?.completedStops.length || tourStops.length;
  const km = userJournal.totalDistanceKm || activeTour?.distanceKm || 0;
  const minutes = userJournal.totalMinutes || activeTour?.totalMinutes || 0;

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Fin del día" onBack={() => router.replace('/(tabs)')} rightLabel="↗" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.done}>
            <Text style={styles.doneTxt}>✓  RUTA COMPLETADA</Text>
          </View>
          <Text style={styles.h}>¡Buen día!</Text>
          <Text style={styles.sub}>{userJournal.headline}</Text>
          <ArchivalImage uri={MEDIA.plaza} style={styles.hero} intensity={0.1} />
          <View style={styles.stats}>
            {[
              [String(places), 'lugares'],
              [km.toFixed(1).replace('.', ','), 'km'],
              [`${minutes}`, 'min'],
              [String(userJournal.steps || Math.round(km * 1350)), 'pasos'],
            ].map(([n, l]) => (
              <View key={l} style={styles.stat}>
                <Text style={styles.statN}>{n}</Text>
                <Text style={styles.statL}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tl}>
            {tourStops.map((s) => (
              <View key={s.id} style={styles.tlItem}>
                <View style={styles.tlDot} />
                <Text style={styles.tlTxt}>{s.title}</Text>
              </View>
            ))}
          </View>
          <View style={styles.disc}>
            <ArchivalImage uri={MEDIA.door} style={styles.discImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.discK}>TU DESCUBRIMIENTO DE HOY</Text>
              <Text style={styles.discH}>{tourStops.find((s) => s.kind === 'micro')?.title ?? 'Una micro-revelación'}</Text>
              <Text style={styles.discB}>Una historia que no estaba en el mapa turístico.</Text>
            </View>
          </View>
          <View style={styles.note}>
            <HandwrittenNote color={ChronoTokens.colors.accentPurple} size={20}>
              ¿Qué quieres recordar de hoy?
            </HandwrittenNote>
            <TextInput
              placeholder="Escribe una nota..."
              placeholderTextColor={ChronoTokens.colors.inkSubtle}
              style={styles.input}
              value={note}
              onChangeText={setNote}
            />
          </View>
          <ChronoActionButton
            title="Guardar en mi diario"
            onPress={() => {
              closeDay(note);
              router.replace('/journal' as never);
            }}
          />
          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.home}>VOLVER AL INICIO</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  done: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentTeal,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  doneTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 12 },
  h: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 40, marginTop: 8 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 12 },
  hero: { height: 160, borderRadius: 14, marginBottom: 12 },
  stats: {
    flexDirection: 'row',
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 14,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: ChronoTokens.colors.borderSoft },
  statN: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22 },
  statL: { fontFamily: ChronoTokens.fonts.body, fontSize: 11, color: ChronoTokens.colors.inkMuted },
  tl: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  tlItem: { alignItems: 'center', flex: 1 },
  tlDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ChronoTokens.colors.accentTeal,
    marginBottom: 4,
  },
  tlTxt: { fontSize: 9, textAlign: 'center', fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted },
  disc: {
    flexDirection: 'row',
    backgroundColor: ChronoTokens.colors.accentYellow,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    marginBottom: 12,
  },
  discImg: { width: 64, height: 64, borderRadius: 8 },
  discK: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 11, letterSpacing: 0.8 },
  discH: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 18 },
  discB: { fontFamily: ChronoTokens.fonts.body, fontSize: 12 },
  note: {
    borderWidth: 1.4,
    borderColor: ChronoTokens.colors.accentPurple,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  input: {
    marginTop: 8,
    backgroundColor: ChronoTokens.colors.cardBase,
    borderRadius: 8,
    padding: 10,
    fontFamily: ChronoTokens.fonts.body,
  },
  home: { textAlign: 'center', marginTop: 12, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1 },
});
