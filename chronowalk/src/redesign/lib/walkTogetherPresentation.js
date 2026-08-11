import { t } from '../../i18n/t.js'

/**
 * Customer-facing seat presentation for Walk together.
 *
 * Presentation numbers are display-only. Invitation/revoke/sync actions must
 * always use the original server seat `id` - never the presentation number.
 */

/**
 * @typedef {{ id: string, role?: string | null, status?: string | null, label?: string | null }} WalkTogetherSeat
 * @typedef {{
 *   seat: WalkTogetherSeat,
 *   presentationNumber: number,
 *   displayName: string,
 *   isOrganizerSeat: boolean,
 * }} WalkTogetherPresentedSeat
 */

/**
 * Stable presentation order:
 * 1. Organizer/owner seat first (verified `role === 'owner'`), numbered 1.
 * 2. Remaining seats keep their relative server-array order, numbered 2…N.
 *
 * @param {WalkTogetherSeat[] | null | undefined} seats
 * @returns {WalkTogetherPresentedSeat[]}
 */
export function buildWalkTogetherPresentationSeats(seats) {
  const list = Array.isArray(seats) ? seats.filter(Boolean) : []
  const organizerIndex = list.findIndex((seat) => seat.role === 'owner')
  const organizer = organizerIndex >= 0 ? list[organizerIndex] : null
  const members = list.filter((_, index) => index !== organizerIndex)

  const ordered = organizer ? [organizer, ...members] : members

  return ordered.map((seat, index) => {
    const presentationNumber = index + 1
    const isOrganizerSeat = seat.role === 'owner'
    return {
      seat,
      presentationNumber,
      isOrganizerSeat,
      displayName: isOrganizerSeat ? t('walkTogether.you') : t('walkTogether.walker', { n: presentationNumber }),
    }
  })
}
