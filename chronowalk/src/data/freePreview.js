import { COLOSSEUM_WAYPOINT } from './colosseum'
import { getAncientPosterUrl } from '../utils/sliderMedia'

/** Free sample stop — Colosseum exterior reconstruction + intro audio. */
export const FREE_PREVIEW_STOP_ID = 'colosseum'

/** Cache-busted ancient poster — same asset as the live slider compare frame. */
export const FREE_PREVIEW_ANCIENT_POSTER = getAncientPosterUrl(COLOSSEUM_WAYPOINT)
