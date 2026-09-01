import { Stack } from 'expo-router';
import { ChronoTokens } from '@/src/theme/tokens';

export default function PlaceLayout() {
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
