import { mediaUrl } from '../lib/mediaUrl.js'
import { colosseumNow, pantheonNow } from '../redesign/images.js'

const COLOSSEUM_EXTERIOR = '/waypoints/colosseum/exterior'
const LANDING_IMG = '/landing'

/** Shared landing imagery — keep NOW/THEN coherent across threshold demo + phone mockups. */
export const LANDING_COLOSSEUM_NOW = colosseumNow
export const LANDING_COLOSSEUM_THEN = mediaUrl(`${COLOSSEUM_EXTERIOR}/ancient-reconstruction.jpg`)
export const LANDING_COLOSSEUM_THEN_LOOP = mediaUrl(`${COLOSSEUM_EXTERIOR}/ancient-reconstruction.mp4`)
export const LANDING_PANTHEON_NOW = pantheonNow
export const LANDING_FORUM_NOW = mediaUrl('/waypoints/forum-cluster/forum-via-sacra/modern-poster.jpg')

/** Premium landing redesign — static showcase assets from design reference. */
export const LANDING_V2 = {
  heroRome: `${LANDING_IMG}/hero-rome.png`,
  heroRomeWebp: `${LANDING_IMG}/hero-rome.webp`,
  heroRomeAvif: `${LANDING_IMG}/hero-rome.avif`,
  heroWidth: 1024,
  heroHeight: 1024,
  threshold: `${LANDING_IMG}/threshold.png`,
  lifestyleCouple: `${LANDING_IMG}/lifestyle-couple.png`,
  screenMap: `${LANDING_IMG}/screen-map.png`,
  screenListening: `${LANDING_IMG}/screen-listening.png`,
  screenLetter: `${LANDING_IMG}/screen-letter.png`,
}

function romePlane({ alt }) {
  return {
    mobileSrc: `${LANDING_IMG}/interlude-mobile.jpg`,
    desktopSrc: `${LANDING_IMG}/interlude-desktop.jpg`,
    mobileWebp: `${LANDING_IMG}/interlude-mobile.webp`,
    desktopWebp: `${LANDING_IMG}/interlude-desktop.webp`,
    mobileAvif: `${LANDING_IMG}/interlude-mobile.avif`,
    desktopAvif: `${LANDING_IMG}/interlude-desktop.avif`,
    lqipSrc: `${LANDING_IMG}/interlude-lqip.jpg`,
    alt,
    mobileWidth: 960,
    mobileHeight: 1200,
    desktopWidth: 1600,
    desktopHeight: 900,
  }
}

/**
 * First cinematic interlude crops (from hero-rome.png).
 * Spec / remaster notes: docs/LANDING_CINEMATIC_INTERLUDE_ASSET.md
 */
export const LANDING_CINEMATIC_INTERLUDE = romePlane({ alt: '' })

/**
 * After Rome — warmer reflective crop of the same Rome hero plane.
 * Distinct object-position from the Act I interlude; editorial memory, not product UI.
 */
export const LANDING_AFTER_ROME = romePlane({
  alt: 'Soft evening light over Rome rooftops and stone',
})

/**
 * Final cinematic ending — skyward crop; strong dark veil in CSS.
 * Distinct from After Rome (warm memory) and Act I interlude (arrival).
 */
export const LANDING_ENDING = romePlane({
  alt: 'Rome under quiet dusk light — final cinematic frame',
})
