import { mediaUrl } from '../lib/mediaUrl.js'
import { colosseumNow, pantheonNow } from '../redesign/images.js'

const COLOSSEUM_EXTERIOR = '/waypoints/colosseum/exterior'

/** Shared landing imagery — keep NOW/THEN coherent across threshold demo + phone mockups. */
export const LANDING_COLOSSEUM_NOW = colosseumNow
export const LANDING_COLOSSEUM_THEN = mediaUrl(`${COLOSSEUM_EXTERIOR}/ancient-reconstruction.jpg`)
export const LANDING_COLOSSEUM_THEN_LOOP = mediaUrl(`${COLOSSEUM_EXTERIOR}/ancient-reconstruction.mp4`)
export const LANDING_PANTHEON_NOW = pantheonNow
export const LANDING_FORUM_NOW = mediaUrl('/waypoints/forum-cluster/forum-via-sacra/modern-poster.jpg')
