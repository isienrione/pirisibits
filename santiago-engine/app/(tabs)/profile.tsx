import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { useChronoStore } from '@/src/store/useChronoStore';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function ProfileTab() {
  const {
    locationEnabled,
    setLocationEnabled,
    language,
    setLanguage,
    solverPayload,
    userProfile,
    offlineDownloads,
    startOfflineDownload,
    setOfflineProgress,
  } = useWalk();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const download = () => {
    if (offlineDownloads.santiagoDownloaded) return;
    startOfflineDownload();
    timer.current = setInterval(() => {
      const current = useChronoStore.getState().offlineDownloads.progressPct;
      const next = Math.min(100, current + 12);
      setOfflineProgress(next);
      if (next >= 100 && timer.current) clearInterval(timer.current);
    }, 320);
  };

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandMark />
        <Text style={styles.h1}>Perfil</Text>

        <Pressable onPress={() => router.push('/(tabs)/journal')} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Diario de caminata</Text>
            <Text style={styles.help}>Notas y lugares visitados.</Text>
          </View>
          <Text style={styles.chev}>→</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(tabs)/saved')} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Guardados</Text>
            <Text style={styles.help}>Lugares y rutas que marcaste.</Text>
          </View>
          <Text style={styles.chev}>→</Text>
        </Pressable>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Ubicación durante la caminata</Text>
            <Text style={styles.help}>Geofence de 25 m para disparar el audio.</Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ true: ChronoTokens.colors.accentTeal }}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Idioma</Text>
            <Text style={styles.help}>Narración y interfaz.</Text>
          </View>
          <Pressable onPress={() => setLanguage(language === 'ES' ? 'EN' : 'ES')} style={styles.lang}>
            <Text style={styles.langTxt}>{language}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>PERFIL 5D · MOTOR KNAPSACK</Text>
          <Text style={styles.mono}>
            Dz {userProfile.discoveryPosture} · T_budget {userProfile.timeBudgetMinutes} min{'\n'}
            M2 step-free {userProfile.stepFree ? 'sí' : 'no'} · memoria {userProfile.memorySitesOptIn ? 'opt-in' : 'excluida'}{'\n'}
            vectores {solverPayload.vectors.join(' ')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>MODO OFFLINE · SANTIAGO CENTRO</Text>
          <Text style={styles.help}>
            Paquete de teselas vectoriales y audios para caminar sin datos. En Expo Go la descarga es simulada y queda marcada en el dispositivo.
          </Text>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${offlineDownloads.progressPct}%` }]} />
          </View>
          <Pressable onPress={download} style={styles.dl}>
            <Text style={styles.dlTxt}>
              {offlineDownloads.santiagoDownloaded
                ? 'PAQUETE LISTO EN EL TELÉFONO'
                : `DESCARGAR PAQUETE  ${offlineDownloads.progressPct}%`}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 42,
    marginTop: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ChronoTokens.colors.borderSoft,
  },
  label: { fontFamily: ChronoTokens.fonts.bodyMedium, fontSize: 15 },
  help: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  lang: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 16 },
  card: {
    marginTop: 20,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    borderRadius: 16,
    padding: 14,
  },
  kicker: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentPurple,
    marginBottom: 8,
  },
  mono: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, lineHeight: 20 },
  bar: { height: 8, backgroundColor: ChronoTokens.colors.borderSoft, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: ChronoTokens.colors.accentTeal },
  dl: { marginTop: 12, alignItems: 'center' },
  dlTxt: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1, color: ChronoTokens.colors.inkBlack },
  chev: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 22, color: ChronoTokens.colors.inkBlack },
});
