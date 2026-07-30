/**
 * TEMPORARY field-test geofences · Santiago, Chile (Providencia / Las Condes).
 * Enabled only when ?devGeofences=santiago or VITE_DEV_GEOFENCES=santiago.
 * Remove this file and wiring once Rome GPS field testing is complete.
 */

/** @type {Record<string, { label: string, lat: number, lng: number, radius_m: number }>} */
export const SANTIAGO_DEV_GEOFENCE_SITES = {
  'starbucks-callao': {
    label: 'Starbucks Callao (Mariano Sánchez Fontecilla 310)',
    lat: -33.4199373,
    lng: -70.5982434,
    radius_m: 80,
  },
  novotel: {
    label: 'Novotel Santiago Providencia',
    lat: -33.4211425,
    lng: -70.6030903,
    radius_m: 80,
  },
  rishtedar: {
    label: 'Rishtedar Providencia',
    lat: -33.4207131,
    lng: -70.60342,
    radius_m: 80,
  },
  'av-providencia-2529': {
    label: 'Av. Providencia 2529',
    lat: -33.4195973,
    lng: -70.6035081,
    radius_m: 80,
  },
  bidasoa: {
    label: 'Bidasoa Restaurant (Av. Vitacura 4873)',
    lat: -33.3983714,
    lng: -70.5852255,
    radius_m: 80,
  },
  quinoa: {
    label: 'Quinoa Restaurant (Luis Pasteur 5393)',
    lat: -33.3951022,
    lng: -70.5820337,
    radius_m: 80,
  },
}

/** Rome waypoint ids remapped to Santiago test sites (forum cluster + Rostra). */
export const SANTIAGO_DEV_WAYPOINT_GEOFENCES = {
  w06: SANTIAGO_DEV_GEOFENCE_SITES['starbucks-callao'],
  w07: SANTIAGO_DEV_GEOFENCE_SITES.novotel,
  w08: SANTIAGO_DEV_GEOFENCE_SITES.rishtedar,
  pause: SANTIAGO_DEV_GEOFENCE_SITES.quinoa,
  w10: SANTIAGO_DEV_GEOFENCE_SITES['av-providencia-2529'],
  w11_12: SANTIAGO_DEV_GEOFENCE_SITES.bidasoa,
}
