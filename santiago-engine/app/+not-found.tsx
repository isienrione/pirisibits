import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ChronoTokens } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <ChronoScreen>
      <Stack.Screen options={{ title: 'Oops', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta página no existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>VOLVER AL INICIO →</Text>
        </Link>
      </View>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 28,
    color: ChronoTokens.colors.inkBlack,
  },
  link: { marginTop: 16 },
  linkText: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 16,
    letterSpacing: 1,
    color: ChronoTokens.colors.accentRed,
  },
});
