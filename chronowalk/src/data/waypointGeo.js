import {
  COLOSSEUM,
  COLOSSEUM_ARRIVAL_RADIUS_M,
  DEBUG_USER_POS,
  GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './colosseum'
import {
  PANTHEON,
  PANTHEON_ARRIVAL_RADIUS_M,
  PANTHEON_DEBUG_USER_POS,
  PANTHEON_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './pantheon'
import {
  PIAZZA_NAVONA,
  PIAZZA_NAVONA_ARRIVAL_RADIUS_M,
  PIAZZA_NAVONA_DEBUG_USER_POS,
  PIAZZA_NAVONA_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './piazza-navona'
import {
  CAPITOLINE_HILL,
  CAPITOLINE_HILL_ARRIVAL_RADIUS_M,
  CAPITOLINE_HILL_DEBUG_USER_POS,
  CAPITOLINE_HILL_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './capitoline-hill'
import {
  CAMPO_DE_FIORI,
  CAMPO_DE_FIORI_ARRIVAL_RADIUS_M,
  CAMPO_DE_FIORI_DEBUG_USER_POS,
  CAMPO_DE_FIORI_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './campo-de-fiori'
import {
  LARGO_ARGENTINA,
  LARGO_ARGENTINA_ARRIVAL_RADIUS_M,
  LARGO_ARGENTINA_DEBUG_USER_POS,
  LARGO_ARGENTINA_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './largo-argentina'
import {
  CASTEL_SANT_ANGELO,
  CASTEL_SANT_ANGELO_ARRIVAL_RADIUS_M,
  CASTEL_SANT_ANGELO_DEBUG_USER_POS,
  CASTEL_SANT_ANGELO_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './castel-sant-angelo'
import {
  FONTANA_DI_TREVI,
  FONTANA_DI_TREVI_ARRIVAL_RADIUS_M,
  FONTANA_DI_TREVI_DEBUG_USER_POS,
  FONTANA_DI_TREVI_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './fontana-di-trevi'

/** Map / geofence settings per waypoint — extend when adding new stops. */
export const WAYPOINT_GEO = {
  colosseum: {
    id: 'colosseum',
    title: 'Colosseum',
    landmark: COLOSSEUM,
    debugPosition: DEBUG_USER_POS,
    geofenceThresholdM: GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: COLOSSEUM_ARRIVAL_RADIUS_M,
    mapZoom: 15,
  },
  pantheon: {
    id: 'pantheon',
    title: 'Pantheon',
    landmark: PANTHEON,
    debugPosition: PANTHEON_DEBUG_USER_POS,
    geofenceThresholdM: PANTHEON_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: PANTHEON_ARRIVAL_RADIUS_M,
    mapZoom: 17,
  },
  'fontana-di-trevi': {
    id: 'fontana-di-trevi',
    title: 'Fontana di Trevi',
    landmark: FONTANA_DI_TREVI,
    debugPosition: FONTANA_DI_TREVI_DEBUG_USER_POS,
    geofenceThresholdM: FONTANA_DI_TREVI_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: FONTANA_DI_TREVI_ARRIVAL_RADIUS_M,
    mapZoom: 18,
  },
  'piazza-navona': {
    id: 'piazza-navona',
    title: 'Piazza Navona',
    landmark: PIAZZA_NAVONA,
    debugPosition: PIAZZA_NAVONA_DEBUG_USER_POS,
    geofenceThresholdM: PIAZZA_NAVONA_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: PIAZZA_NAVONA_ARRIVAL_RADIUS_M,
    mapZoom: 17,
  },
  'capitoline-hill': {
    id: 'capitoline-hill',
    title: 'Capitoline Hill',
    landmark: CAPITOLINE_HILL,
    debugPosition: CAPITOLINE_HILL_DEBUG_USER_POS,
    geofenceThresholdM: CAPITOLINE_HILL_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: CAPITOLINE_HILL_ARRIVAL_RADIUS_M,
    mapZoom: 16,
  },
  'largo-argentina': {
    id: 'largo-argentina',
    title: 'Largo di Torre Argentina',
    landmark: LARGO_ARGENTINA,
    debugPosition: LARGO_ARGENTINA_DEBUG_USER_POS,
    geofenceThresholdM: LARGO_ARGENTINA_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: LARGO_ARGENTINA_ARRIVAL_RADIUS_M,
    mapZoom: 17,
  },
  'campo-de-fiori': {
    id: 'campo-de-fiori',
    title: "Campo de' Fiori",
    landmark: CAMPO_DE_FIORI,
    debugPosition: CAMPO_DE_FIORI_DEBUG_USER_POS,
    geofenceThresholdM: CAMPO_DE_FIORI_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: CAMPO_DE_FIORI_ARRIVAL_RADIUS_M,
    mapZoom: 17,
  },
  'castel-sant-angelo': {
    id: 'castel-sant-angelo',
    title: "Castel Sant'Angelo",
    landmark: CASTEL_SANT_ANGELO,
    debugPosition: CASTEL_SANT_ANGELO_DEBUG_USER_POS,
    geofenceThresholdM: CASTEL_SANT_ANGELO_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: CASTEL_SANT_ANGELO_ARRIVAL_RADIUS_M,
    mapZoom: 16,
  },
}

export const getWaypointGeo = (waypointId) => WAYPOINT_GEO[waypointId] ?? null
