import { useFonts } from 'expo-font'
import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
} from '@expo-google-fonts/barlow-condensed'
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans'
import {
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces'

export const fontAssets = {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_400Regular_Italic,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
}

export function useTravelerFonts() {
  const [loaded, error] = useFonts(fontAssets)
  return { loaded, error }
}
