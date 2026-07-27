import { mediaUrl } from '../lib/mediaUrl.js'
import { colosseumNow, pantheonNow } from '../redesign/images.js'

const COLOSSEUM_EXTERIOR = '/waypoints/colosseum/exterior'
const LANDING_IMG = '/landing'
const CINEMATIC = `${LANDING_IMG}/cinematic`

/**
 * Shared landing imagery — keep NOW/THEN coherent across threshold demo + phone mockups.
 * Threshold pair is a matched 3:4 crop set (dissolve reveal) under /landing/threshold/.
 */
export const LANDING_COLOSSEUM_NOW = `${LANDING_IMG}/threshold/colosseum-now.jpg`
export const LANDING_COLOSSEUM_THEN = `${LANDING_IMG}/threshold/colosseum-then.jpg`
export const LANDING_COLOSSEUM_THEN_LOOP = mediaUrl(`${COLOSSEUM_EXTERIOR}/ancient-reconstruction.mp4`)
/** Waypoint poster — used where a live “today” still is needed outside Threshold. */
export const LANDING_COLOSSEUM_NOW_WAYPOINT = colosseumNow
export const LANDING_PANTHEON_NOW = pantheonNow
/** Evidence-based Pantheon reconstruction — sticky-phone Threshold reveal. */
export const LANDING_PANTHEON_THEN = mediaUrl('/waypoints/pantheon/ancient-reconstruction.jpg')
export const LANDING_FORUM_NOW = mediaUrl('/waypoints/forum-cluster/forum-via-sacra/modern-poster.jpg')

/** Premium landing redesign — static showcase assets from design reference. */
export const LANDING_V2 = {
  /** Legacy square plate — hero now prefers LANDING_HERO cinematic set. */
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

/**
 * Responsive Rome plane for interludes / memory / ending.
 * Drop replacement masters into `public/landing/cinematic/<slot>/` then re-run
 * `node scripts/prepare-landing-cinematic.mjs` (or overwrite jpg/webp/avif in place).
 */
function cinematicPlane(slot, { alt, objectPosition } = {}) {
  const base = `${CINEMATIC}/${slot}`
  return {
    mobileSrc: `${base}/mobile.jpg`,
    desktopSrc: `${base}/desktop.jpg`,
    mobileWebp: `${base}/mobile.webp`,
    desktopWebp: `${base}/desktop.webp`,
    mobileAvif: `${base}/mobile.avif`,
    desktopAvif: `${base}/desktop.avif`,
    lqipSrc: `${base}/lqip.jpg`,
    alt: alt ?? '',
    objectPosition,
    mobileWidth: 1080,
    mobileHeight: 1350,
    desktopWidth: 1920,
    desktopHeight: 1080,
  }
}

/**
 * Hero full-bleed — Forum dusk with Colosseum on the horizon.
 * Replace via `public/landing/cinematic/_masters/hero.jpg` + prepare script.
 */
export const LANDING_HERO = cinematicPlane('hero', {
  alt: '',
  objectPosition: 'center 38%',
})

/**
 * Act I cinematic interlude — Colosseum arrival beat.
 */
export const LANDING_CINEMATIC_INTERLUDE = cinematicPlane('interlude', {
  alt: '',
  objectPosition: '42% 40%',
})

/**
 * After Rome — Castel Sant’Angelo memory (bridge approach at gold hour).
 */
export const LANDING_AFTER_ROME = cinematicPlane('after-rome', {
  alt: 'Castel Sant’Angelo in warm evening light',
  objectPosition: 'center 32%',
})

/**
 * Final cinematic ending — Trevi (distinct civic close; dusk master preferred).
 */
export const LANDING_ENDING = cinematicPlane('ending', {
  alt: 'Trevi Fountain under open Roman sky',
  objectPosition: 'center 28%',
})
