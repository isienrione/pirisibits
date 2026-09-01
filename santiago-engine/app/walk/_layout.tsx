import { Stack } from 'expo-router';
import { ChronoTokens } from '@/src/theme/tokens';

export default function WalkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ChronoTokens.colors.paperBase },
        animation: 'fade',
      }}
    />
  );
}
