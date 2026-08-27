/**
 * Landing/marketing projection for Roma Historica (not unlock authority).
 * Unlock visit IDs live in TOUR_TIER_WAYPOINTS.central (10 wXX including Pantheon
 * interior + Via Appia). This list collapses Pantheon to one kebab and shows Appia.
 */
export const CENTRAL_ROME_TOUR = {
  id: 'central-rome',
  productId: 'rome-central',
  title: 'Roma Historica',
  subtitle:
    "Trajan's Market → Pantheon → Spanish Steps → Trevi → Navona → Campo → Argentina → Castel → Via Appia",
  stopIds: [
    'trajan-market',
    'pantheon',
    'spanish-steps',
    'fontana-di-trevi',
    'piazza-navona',
    'campo-de-fiori',
    'largo-argentina',
    'castel-sant-angelo',
    'appian-way',
  ],
  mapZoom: 15,
}
