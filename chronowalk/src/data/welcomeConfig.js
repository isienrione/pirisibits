import { loadRomeManifest } from '../content/manifest.js'
import { getTourProductTruth } from '../content/tourProductTruth.js'

const romeProductTruth = getTourProductTruth(loadRomeManifest())

/** City accent colors for the platform prism (welcome flow only). */
export const PLATFORM_CITIES = [
  {
    id: 'rome',
    name: 'Rome',
    monogram: 'R',
    accent: 'var(--city-rome)',
    status: 'available',
    subtitle: romeProductTruth.placesAvailableNowLabel,
  },