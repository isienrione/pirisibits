import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { OnboardingProgress } from '@/src/components/OnboardingProgress';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { TornPatch } from '@/src/components/Collage';
import { VintageMap } from '@/src/components/VintageMap';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function PermissionsScreen() {
  const { completeOnboarding, memorySitesOptIn, setMemorySitesOptIn } = useWalk();

  const finish = (enabled: boolean) => {
    completeOnboarding(enabled);
    router.replace('/(tabs)');
  };

  const enable = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finish(status === 'granted');
    } catch {
      finish(false);
    }
  };

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <OnboardingProgress step={5} />
        <Text style={styles.h1}>Permisos para caminar con ChronoWalk</Text>
        <HandwrittenNote style={styles.note}>solo con la app abierta</HandwrittenNote>

        <View style={styles.mapWrap}>
          <VintageMap height={168} />
          <TornPatch color={ChronoTokens.colors.accentTeal} width={90} height={54} rotate={-12} style={styles.mapTear} />
        </View>

        <View style={styles.lock}>
          <Text style={styles.lockTxt}>
            La ubicación dispara el audio a 25 m. Puedes cambiarlo después en Ajustes.
          </Text>
        </View>

        <View style={styles.optIn}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.optTitle}>SITIOS SENSIBLES DE MEMORIA</Text>
            <Text style={styles.optBody}>
              Opt-in explícito. Sin esto no entran nodos como Morandé 80 o Londres 38.
            </Text>
          </View>
          <Switch
            value={memorySitesOptIn}
            onValueChange={setMemorySitesOptIn}
            trackColor={{ true: ChronoTokens.colors.accentPurple }}
          />
        </View>

        <ChronoActionButton title="Activar ubicación" onPress={enable} />
        <Pressable onPress={() => finish(false)} style={{ marginTop: 14 }}>
          <Text style={styles.skip}>Continuar sin GPS</Text>
        </Pressable>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 34,
    lineHeight: 34,
    color: ChronoTokens.colors.inkBlack,
    width: '94%',
  },
  note: { alignSelf: 'flex-end', marginBottom: 8 },
  mapWrap: { height: 180, marginVertical: 8 },
  mapTear: { position: 'absolute', right: -16, top: 18 },
  lock: { marginBottom: 12 },
  lockTxt: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 13,
    color: ChronoTokens.colors.inkMuted,
    lineHeight: 18,
  },
  optIn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    padding: 12,
    marginBottom: 16,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
  },
  optTitle: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.1,
    fontSize: 14,
    color: ChronoTokens.colors.accentPurple,
  },
  optBody: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 12,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 4,
  },
  skip: {
    textAlign: 'center',
    fontFamily: ChronoTokens.fonts.bodyMedium,
    color: ChronoTokens.colors.inkBlack,
  },
});
