import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function SettingsScreen() {
  const {
    locationEnabled,
    setLocationEnabled,
    useMetro,
    setUseMetro,
    memorySitesOptIn,
    setMemorySitesOptIn,
    solverPayload,
  } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandMark />
        <Text style={styles.h1}>Ajustes</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Ubicación durante la caminata</Text>
            <Text style={styles.help}>Solo con la app abierta.</Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ true: ChronoTokens.colors.accentTeal }}
          />
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Usar metro</Text>
            <Text style={styles.help}>Permite tramos conectados.</Text>
          </View>
          <Switch
            value={useMetro}
            onValueChange={setUseMetro}
            trackColor={{ true: ChronoTokens.colors.accentRed }}
          />
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Sitios de memoria sensible</Text>
            <Text style={styles.help}>Opt-in para Morandé 80, Londres 38 y sitios de memoria.</Text>
          </View>
          <Switch
            value={memorySitesOptIn}
            onValueChange={setMemorySitesOptIn}
            trackColor={{ true: ChronoTokens.colors.accentPurple }}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.kicker}>CONTRATO CON EL ALGORITMO</Text>
          <Text style={styles.mono}>
            postura {solverPayload.posture}{'\n'}
            T_budget {solverPayload.T_budget} min{'\n'}
            vectores {solverPayload.vectors.join(', ')}
          </Text>
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
  help: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, fontSize: 12 },
  card: {
    marginTop: 24,
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
});
