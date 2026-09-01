import { useEffect } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { MiniAudioBar } from '@/src/components/MiniAudioBar';
import { VintageMap } from '@/src/components/VintageMap';
import { poiImage, poiToRouteStop } from '@/src/data/pois';
import { useAudioGeofence, GEOFENCE_TRIGGER_METERS, MODULE_C_LINGER_SECONDS } from '@/src/services/audioGeofenceController';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';
import { fillParent } from '@/src/theme/layout';

export default function WalkActiveScreen() {
  const {
    currentPoi,
    currentStopIndex,
    tourStops,
    setStatus,
    setWalkingPaceMs,
    remainingMinutes,
    interests,
    userProfile,
  } = useWalk();
  const stop = currentPoi;
  const next = tourStops[currentStopIndex + 1];
  const geo = useAudioGeofence(stop, {
    nextPoi: next,
    interests,
    posture: userProfile.discoveryPosture,
  });

  useEffect(() => {
    const speed = geo.walk.userVelocityMps;
    if (speed > 0) setWalkingPaceMs(speed);
  }, [geo.walk.userVelocityMps, setWalkingPaceMs]);

  if (!stop) {
    return (
      <ChronoScreen>
        <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <Text style={styles.inst}>Aún no hay una ruta activa.</Text>
          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.arriveTxt}>VOLVER AL INICIO</Text>
          </Pressable>
        </SafeAreaView>
      </ChronoScreen>
    );
  }

  const row = poiToRouteStop(stop, currentStopIndex);
  const radius = GEOFENCE_TRIGGER_METERS;
  const distance = Number.isFinite(geo.walk.distanceToTargetMeters)
    ? Math.round(geo.walk.distanceToTargetMeters)
    : null;
  const moduleKey =
    geo.walk.currentModule === 'idle' ? 'module_a' : geo.walk.currentModule;
  const v_u = geo.walk.userVelocityMps;
  const tts = geo.walk.ttsRate;

  return (
    <ChronoScreen>
      <View style={styles.root}>
        <VintageMap height={560} stopCount={tourStops.length} />
        <SafeAreaView style={styles.overlay} edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.enRuta}>
              <Text style={styles.enRutaTxt}>EN RUTA</Text>
            </View>
            <Pressable onPress={() => router.push('/audio')} hitSlop={8}>
              <Text style={styles.icon}>🔊</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/route-control')} hitSlop={8}>
              <Text style={styles.icon}>⋯</Text>
            </Pressable>
          </View>

          <Text style={styles.inst}>{stop.directionHint}</Text>
          <Text style={styles.dist}>
            {distance == null ? `Parada ${currentStopIndex + 1}/${tourStops.length}` : `${distance} m · radio ${radius} m`}
          </Text>
          <Text style={styles.meta}>
            {geo.walk.currentModule === 'idle'
              ? `Buscando geofence ≤ ${radius} m · A se dispara con háptica`
              : geo.moduleLabel}
          </Text>
          <Text style={styles.telemetry}>
            v_u {v_u.toFixed(2)} m/s · base 1.1 · TTS {tts.toFixed(2)}×
            {geo.walk.isHurry ? ' · PRISA → D' : ''}
            {geo.walk.awaitingLinger
              ? ` · C en ${geo.walk.lingerRemainingSeconds || MODULE_C_LINGER_SECONDS}s si te quedas`
              : ''}
          </Text>

          {geo.walk.currentModule !== 'idle' && geo.moduleText ? (
            <View style={styles.moduleCard}>
              <Text style={styles.moduleK}>{moduleKey}</Text>
              <Text style={styles.moduleBody} numberOfLines={4}>
                {geo.moduleText}
              </Text>
            </View>
          ) : null}

          <Pressable onPress={() => router.push('/walk/bifurcation')} style={styles.deviate}>
            <Text style={styles.deviateTxt}>Simular desvío / bifurcación</Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          <MiniAudioBar
            title={`${geo.moduleLabel} · ${stop.title}`}
            time={distance == null ? '--' : `${Math.min(distance, 999)} m`}
            thumbnail={poiImage(stop)}
            playing={geo.walk.playing}
            onToggle={() => {
              if (geo.walk.playing) void geo.stopPlayback();
              else void geo.simulateArrival();
            }}
          />

          <View style={styles.eta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etaKicker}>PRÓXIMA HISTORIA</Text>
              <Text style={styles.etaMeta}>{row.walkMin} min • {remainingMinutes} min de ruta</Text>
              <Text style={styles.etaStop}>{stop.title.toUpperCase()}</Text>
              {next ? <Text style={styles.next}>Luego: {next.title}</Text> : null}
            </View>
            <Pressable
              onPress={() => {
                setStatus('paused');
                router.push('/resume-paused');
              }}
              style={styles.pause}
            >
              <Text style={styles.pauseTxt}>❚❚</Text>
            </Pressable>
          </View>

          <Pressable style={styles.sim} onPress={() => void geo.simulateArrival()}>
            <Text style={styles.simTxt}>SIMULAR LLEGADA (25M)</Text>
          </Pressable>

          <Pressable
            style={styles.arrive}
            onPress={() => {
              void geo.stopPlayback();
              router.push('/walk/stop');
            }}
          >
            <Text style={styles.arriveTxt}>HAS LLEGADO →</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...fillParent, paddingHorizontal: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  enRuta: {
    backgroundColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 'auto',
  },
  enRutaTxt: {
    color: '#FFF',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 14,
    letterSpacing: 1.4,
  },
  icon: { fontSize: 18, color: ChronoTokens.colors.inkBlack },
  inst: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 34,
    lineHeight: 34,
    color: ChronoTokens.colors.inkBlack,
    maxWidth: 300,
  },
  dist: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 18,
    color: ChronoTokens.colors.accentRed,
    marginTop: 6,
  },
  meta: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 12,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 4,
    marginBottom: 4,
  },
  telemetry: {
    fontFamily: ChronoTokens.fonts.bodyMedium,
    fontSize: 11,
    color: ChronoTokens.colors.accentTeal,
    marginBottom: 8,
  },
  moduleCard: {
    backgroundColor: ChronoTokens.colors.paperBase,
    borderWidth: 1.2,
    borderColor: ChronoTokens.colors.inkBlack,
    padding: 10,
    marginBottom: 8,
  },
  moduleK: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 11,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentTeal,
    marginBottom: 4,
  },
  moduleBody: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: ChronoTokens.colors.inkBlack,
  },
  deviate: { alignSelf: 'flex-end', marginTop: 8 },
  deviateTxt: { fontFamily: ChronoTokens.fonts.body, fontSize: 11, color: ChronoTokens.colors.inkSubtle },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChronoTokens.colors.paperBase,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  etaKicker: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 12,
    letterSpacing: 1.4,
    color: ChronoTokens.colors.inkMuted,
  },
  etaMeta: {
    fontFamily: ChronoTokens.fonts.bodyMedium,
    fontSize: 14,
    color: ChronoTokens.colors.inkBlack,
    marginTop: 2,
  },
  etaStop: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 20,
    marginTop: 2,
  },
  next: { fontFamily: ChronoTokens.fonts.body, fontSize: 12, color: ChronoTokens.colors.inkMuted, marginTop: 2 },
  pause: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseTxt: { fontSize: 16, color: ChronoTokens.colors.inkBlack },
  sim: {
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.accentTeal,
    height: 46,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: ChronoTokens.colors.paperBase,
  },
  simTxt: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 15,
    letterSpacing: 1.2,
    color: ChronoTokens.colors.accentTeal,
  },
  arrive: {
    backgroundColor: ChronoTokens.colors.inkBlack,
    height: 58,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  arriveTxt: {
    color: '#FFF',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 16,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
