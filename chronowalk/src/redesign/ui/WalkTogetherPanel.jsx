import { useEffect, useState } from 'react'
import { T, F } from '../tokens.js'
import {
  buildInviteShareUrl,
  bundleMetaForProductId,
} from '../../lib/familyWalk.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'

/** Couple terracotta / Family verdigris — from established tokens only. */
function accentForProductId(productId) {
  if (productId === 'rome-couple') return T.terracotta
  if (productId === 'rome-family') return T.actIV
  return T.gold
}

function Toggle({ on, onToggle, label, accent }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="cw-walk-together__switch"
      style={{
        background: on ? accent : `${T.muted}55`,
      }}
    >
      <span
        className="cw-walk-together__switch-thumb"
        style={{ left: on ? 22 : 3 }}
        aria-hidden
      />
    </button>
  )
}

async function copyText(value) {
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

async function shareInvite({ invite, url }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && url) {
    try {
      await navigator.share({
        title: 'ChronoWalk invite',
        text: 'Join my ChronoWalk Rome walk',
        url,
      })
      return true
    } catch {
      /* fall through to copy */
    }
  }
  return copyText(url || invite)
}

function seatRank(seat, invite) {
  if (seat.role === 'owner') return 0
  if (seat.status === 'claimed') return 1
  if (invite) return 2
  if (seat.status === 'revoked') return 3
  return 4
}

function seatStatusLabel(seat, invite, isOwnerSeat) {
  if (isOwnerSeat) return 'Organizer'
  if (seat.status === 'claimed') return 'Joined on a device'
  if (seat.status === 'revoked' && !invite) return 'Seat revoked — create a new invitation'
  if (invite) return 'Invitation ready'
  return 'Open seat'
}

function seatTitle(seat, seatIndex) {
  if (seat.role === 'owner') return 'You'
  return `Walker ${seatIndex + 1}`
}

function humanErrorMessage(error) {
  if (error === 'missing_credential' || error === 'invalid') {
    return 'This device no longer has an active Couple or Family walk. Restore your purchase to continue.'
  }
  if (error === 'not_owner') {
    return 'Only the organizer can create or revoke invitations.'
  }
  if (error === 'no_seat') {
    return 'Every seat on this walk is already filled.'
  }
  if (error === 'retired') {
    return 'Bundles are created by purchase only — manage invitations here instead.'
  }
  return String(error)
}

function OccupancyNodes({ seatLimit, claimedCount, accent, isEntry }) {
  const total = Math.max(0, Number(seatLimit) || 0)
  if (!total) return null
  return (
    <ul
      className="cw-walk-together__nodes"
      aria-label={`${claimedCount} of ${total} travelers joined`}
    >
      {Array.from({ length: total }, (_, index) => {
        const filled = index < claimedCount
        return (
          <li
            key={`node-${index}`}
            className={
              filled
                ? 'cw-walk-together__node cw-walk-together__node--filled'
                : 'cw-walk-together__node'
            }
            style={{
              background: filled ? accent : 'transparent',
              borderColor: filled ? accent : isEntry ? `${T.warmWhite}40` : `${T.ink}28`,
            }}
            aria-hidden
          />
        )
      })}
    </ul>
  )
}

/**
 * Persistent Couple/Family management UI — server-authoritative seats only.
 * Used from Settings (/walk-together) and optional app-entry.
 */
export default function WalkTogetherPanel({
  variant = 'settings',
  onContinue = null,
  showContinue = false,
}) {
  const family = useOptionalFamilyWalk()
  const [statusNote, setStatusNote] = useState(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const refreshBundle = family?.refreshBundle
  const refreshSharedSession = family?.refreshSharedSession

  // Refresh seats + discover active shared session when the panel opens.
  useEffect(() => {
    if (!refreshBundle && !refreshSharedSession) return undefined
    let cancelled = false
    void (async () => {
      if (refreshBundle) await refreshBundle()
      else if (refreshSharedSession) await refreshSharedSession()
      void cancelled
    })()
    return () => {
      cancelled = true
    }
  }, [refreshBundle, refreshSharedSession])

  if (!family) return null

  const {
    bundle,
    session,
    busy,
    error,
    clearError,
    isOrganizer,
    hasBundleAccess,
    latestInvites,
    createInvite,
    revokeSeat,
    startSharedWalk,
    leaveSharedWalk,
    setSyncEnabled,
    setResumePolicy,
    syncEnabled,
    resumePolicy,
    isLeader,
  } = family

  const meta = bundleMetaForProductId(bundle?.purchasedProductId)
  const seatLimit = bundle?.seatLimit ?? meta?.seatLimit ?? null
  const seats = Array.isArray(bundle?.seats) ? bundle.seats : []
  const memberSeats = seats.filter((seat) => seat.role === 'member')
  const openMemberSeats = memberSeats.filter(
    (seat) => seat.status === 'open' || seat.status === 'revoked',
  )
  const claimedCount = seats.filter((seat) => seat.status === 'claimed').length
  const isEntry = variant === 'entry'
  const accent = accentForProductId(bundle?.purchasedProductId ?? meta?.productId)
  const working = busy || inviteBusy
  const bundleKind =
    meta?.productId === 'rome-couple'
      ? 'couple'
      : meta?.productId === 'rome-family'
        ? 'family'
        : 'bundle'

  const orderedSeats = [...seats].sort((a, b) => {
    const inviteA = latestInvites?.[a.id] ?? a.inviteCode ?? null
    const inviteB = latestInvites?.[b.id] ?? b.inviteCode ?? null
    return seatRank(a, inviteA) - seatRank(b, inviteB)
  })

  const handleCreateInvite = async (seatId = null) => {
    setStatusNote(null)
    setInviteBusy(true)
    try {
      await createInvite(seatId)
      setStatusNote('Invitation created. Copy or share it now — it will not be shown again later.')
    } catch {
      /* error surfaced via family.error */
    } finally {
      setInviteBusy(false)
    }
  }

  const handleCopy = async (invite) => {
    const url = buildInviteShareUrl(invite)
    const ok = await copyText(url || invite)
    setStatusNote(ok ? 'Invite link copied.' : 'Could not copy. Select the code manually.')
  }

  const handleShare = async (invite) => {
    const url = buildInviteShareUrl(invite)
    const ok = await shareInvite({ invite, url })
    setStatusNote(ok ? 'Invite ready to share.' : 'Could not open share sheet.')
  }

  const continueButton = showContinue ? (
    <div
      className={
        isEntry
          ? 'cw-walk-together__footer'
          : 'cw-walk-together__footer cw-walk-together__footer--sticky'
      }
    >
      <button
        type="button"
        onClick={() => onContinue?.()}
        data-testid="walk-together-continue"
        className="cw-walk-together__continue"
        style={{ background: accent, color: T.obsidian, minHeight: 48 }}
      >
        Continue to your walk
      </button>
    </div>
  ) : null

  if (!hasBundleAccess || !bundle || !meta) {
    return (
      <section
        data-testid="walk-together-panel"
        className={`cw-walk-together cw-walk-together--${isEntry ? 'entry' : 'settings'}`}
        style={{ fontFamily: F.body }}
      >
        <p className="cw-walk-together__empty">
          Walk-together invites are available after a Couple or Family Bundle purchase on this device.
        </p>
        {continueButton}
      </section>
    )
  }

  const occupancyLabel = `${claimedCount} of ${seatLimit} travelers joined`
  // Keep the legacy “seats in use” phrasing discoverable for existing copy checks.
  const occupancyLegacy = `${claimedCount}/${seatLimit} seats in use`

  return (
    <section
      data-testid="walk-together-panel"
      data-bundle={bundleKind}
      aria-labelledby="walk-together-heading"
      className={`cw-walk-together cw-walk-together--${isEntry ? 'entry' : 'settings'} cw-walk-together--${bundleKind}`}
      style={{
        fontFamily: F.body,
        '--wt-accent': accent,
        '--wt-ink': isEntry ? T.warmWhite : T.ink,
        '--wt-muted': isEntry
          ? `color-mix(in srgb, ${T.warmWhite} 78%, ${T.muted})`
          : `color-mix(in srgb, ${T.ink} 72%, ${T.muted})`,
        '--wt-surface': isEntry ? `${T.warmWhite}0F` : T.warmWhite,
        '--wt-panel': isEntry
          ? `${T.warmWhite}12`
          : `color-mix(in srgb, ${accent} 8%, ${T.bone})`,
        '--wt-border': isEntry
          ? `${T.warmWhite}22`
          : `color-mix(in srgb, ${T.ink} 16%, ${T.muted})`,
        '--wt-error': isEntry ? T.actIII : T.terracotta,
      }}
    >
      <header className="cw-walk-together__header">
        <p className="cw-walk-together__eyebrow" style={{ color: accent }}>
          Walk together
        </p>
        <h2 id="walk-together-heading" className="cw-walk-together__title">
          {meta.label}
        </h2>
        <p className="cw-walk-together__promise">Complete Roma Eterna · All 21 stops</p>
        <p className="cw-walk-together__lede">
          {isOrganizer
            ? 'Share one Rome walk with the people beside you — invitations, seats, and shared tour progress in one place.'
            : 'You’re walking together on a shared Couple/Family Rome walk.'}
        </p>

        {isOrganizer || seats.length > 0 ? (
          <div className="cw-walk-together__occupancy" data-testid="walk-together-occupancy">
            <p className="cw-walk-together__occupancy-label">{occupancyLabel}</p>
            <p className="cw-walk-together__occupancy-meta">{occupancyLegacy}</p>
            <OccupancyNodes
              seatLimit={seatLimit}
              claimedCount={claimedCount}
              accent={accent}
              isEntry={isEntry}
            />
          </div>
        ) : (
          <div className="cw-walk-together__occupancy" data-testid="walk-together-occupancy">
            <p className="cw-walk-together__occupancy-label">
              Shared {meta.label.replace(/ Bundle$/i, '')} walk
            </p>
            <p className="cw-walk-together__occupancy-meta">
              Up to {seatLimit} travelers on this walk
            </p>
          </div>
        )}
      </header>

      {isOrganizer ? (
        <>
          <section className="cw-walk-together__party" aria-labelledby="walk-together-party-heading">
            <h3 id="walk-together-party-heading" className="cw-walk-together__section-title">
              Your walking party
            </h3>

            <ul className="cw-walk-together__seats">
              {orderedSeats.map((seat) => {
                const seatIndex = seats.findIndex((item) => item.id === seat.id)
                const invite = latestInvites?.[seat.id] ?? seat.inviteCode ?? null
                const isOwnerSeat = seat.role === 'owner'
                const canInvite =
                  !isOwnerSeat && (seat.status === 'open' || seat.status === 'revoked')
                const canRevoke = !isOwnerSeat && (seat.status === 'claimed' || Boolean(invite))
                const status = seatStatusLabel(seat, invite, isOwnerSeat)
                const inactive = seat.status === 'revoked' && !invite

                return (
                  <li
                    key={seat.id}
                    data-testid={`walk-together-seat-${seat.id}`}
                    data-seat-status={
                      isOwnerSeat
                        ? 'organizer'
                        : invite
                          ? 'invite-ready'
                          : seat.status === 'claimed'
                            ? 'claimed'
                            : seat.status === 'revoked'
                              ? 'revoked'
                              : 'open'
                    }
                    className={
                      inactive
                        ? 'cw-walk-together__seat cw-walk-together__seat--inactive'
                        : 'cw-walk-together__seat'
                    }
                  >
                    <div className="cw-walk-together__seat-main">
                      <span
                        className="cw-walk-together__avatar"
                        style={{
                          borderColor: accent,
                          color: isOwnerSeat || seat.status === 'claimed' ? T.obsidian : accent,
                          background:
                            isOwnerSeat || seat.status === 'claimed' ? accent : 'transparent',
                        }}
                        aria-hidden
                      >
                        {seatIndex >= 0 ? seatIndex + 1 : '·'}
                      </span>
                      <div className="cw-walk-together__seat-copy">
                        <p className="cw-walk-together__seat-name">{seatTitle(seat, seatIndex)}</p>
                        <p className="cw-walk-together__seat-status">{status}</p>
                      </div>
                    </div>

                    {invite ? (
                      <div className="cw-walk-together__invite">
                        <p
                          data-testid="walk-together-invite-code"
                          className="cw-walk-together__invite-code"
                        >
                          {invite}
                        </p>
                        <div className="cw-walk-together__invite-actions">
                          <button
                            type="button"
                            onClick={() => void handleCopy(invite)}
                            className="cw-walk-together__btn cw-walk-together__btn--secondary"
                            aria-label={`Copy invitation link for ${seatTitle(seat, seatIndex)}`}
                          >
                            Copy link
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleShare(invite)}
                            className="cw-walk-together__btn cw-walk-together__btn--secondary"
                            aria-label={`Share invitation for ${seatTitle(seat, seatIndex)}`}
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="cw-walk-together__seat-actions">
                      {canInvite ? (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => void handleCreateInvite(seat.id)}
                          className="cw-walk-together__btn cw-walk-together__btn--quiet"
                          style={{ borderColor: `${accent}66`, color: isEntry ? T.warmWhite : T.ink }}
                        >
                          {working ? 'Working…' : 'Create invitation'}
                        </button>
                      ) : null}
                      {canRevoke ? (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => void revokeSeat(seat.id)}
                          className="cw-walk-together__btn cw-walk-together__btn--tertiary"
                          aria-label={`Revoke seat for ${seatTitle(seat, seatIndex)}`}
                        >
                          Revoke seat
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>

            {openMemberSeats.length === 0 && memberSeats.every((s) => s.status === 'claimed') ? (
              <p className="cw-walk-together__hint">
                All paid seats are in use. Revoke a member seat to reissue an invitation.
              </p>
            ) : null}
          </section>

          <section
            className="cw-walk-together__sync"
            aria-labelledby="walk-together-sync-heading"
          >
            <h3 id="walk-together-sync-heading" className="cw-walk-together__section-title">
              Shared walk controls
            </h3>

            {!session ? (
              <>
                <p className="cw-walk-together__hint">
                  Start shared tour progress when everyone is ready. This keeps the group on the same
                  walk — not live GPS or perfectly synchronized audio.
                </p>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void startSharedWalk('leader')}
                  className="cw-walk-together__btn cw-walk-together__btn--accent"
                  style={{ background: accent, color: T.obsidian }}
                >
                  Start shared tour syncing
                </button>
              </>
            ) : (
              <div data-testid="walk-together-session" className="cw-walk-together__sync-panel">
                <p className="cw-walk-together__sync-status">
                  Shared tour progress {isLeader ? '· you lead' : '· following'}
                </p>
                <div className="cw-walk-together__toggle-row">
                  <div>
                    <p className="cw-walk-together__toggle-label">Shared tour syncing</p>
                    <p className="cw-walk-together__hint">
                      Keeps shared tour progress connected across devices — not live GPS or synced
                      audio playback.
                    </p>
                  </div>
                  <Toggle
                    on={syncEnabled}
                    onToggle={() => void setSyncEnabled(!syncEnabled)}
                    label="Shared tour syncing"
                    accent={accent}
                  />
                </div>
                <div className="cw-walk-together__toggle-row">
                  <div>
                    <p className="cw-walk-together__toggle-label">Only leader resumes</p>
                    <p className="cw-walk-together__hint">Anyone can still pause for the group</p>
                  </div>
                  <Toggle
                    on={resumePolicy === 'leader'}
                    onToggle={() =>
                      void setResumePolicy(resumePolicy === 'leader' ? 'anyone' : 'leader')
                    }
                    label="Only leader resumes"
                    accent={accent}
                  />
                </div>
                <button
                  type="button"
                  onClick={leaveSharedWalk}
                  className="cw-walk-together__btn cw-walk-together__btn--tertiary"
                >
                  Leave shared tour
                </button>
              </div>
            )}
          </section>
        </>
      ) : (
        <section
          className="cw-walk-together__member"
          aria-labelledby="walk-together-member-heading"
        >
          <h3 id="walk-together-member-heading" className="cw-walk-together__section-title">
            You’re walking together
          </h3>
          <div className="cw-walk-together__member-card">
            <p className="cw-walk-together__member-copy">
              You belong to a shared Couple/Family walk with shared tour progress. Full Roma Eterna ·
              21 stops on this device.
            </p>
            <p className="cw-walk-together__seat-status">
              {isLeader ? 'Leading the shared tour' : 'Following your walking party'}
            </p>
            {session ? (
              <p className="cw-walk-together__hint">
                Shared tour active {isLeader ? '· you lead' : '· following'}
              </p>
            ) : (
              <p className="cw-walk-together__hint">
                No active shared tour session on this phone yet. When your organizer starts one, your
                walk progress can stay in step.
              </p>
            )}
          </div>
        </section>
      )}

      {statusNote ? (
        <p className="cw-walk-together__note" role="status" aria-live="polite">
          {statusNote}
        </p>
      ) : null}

      {error ? (
        <p
          className="cw-walk-together__error"
          role="alert"
          onClick={clearError}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              clearError()
            }
          }}
          tabIndex={0}
        >
          {humanErrorMessage(error)}
        </p>
      ) : null}

      {continueButton}
    </section>
  )
}

/** @deprecated Prefer WalkTogetherPanel */
export { WalkTogetherPanel as FamilyWalkPanel }
