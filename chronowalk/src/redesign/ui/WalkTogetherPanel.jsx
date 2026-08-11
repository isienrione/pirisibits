import { useEffect, useState } from 'react'
import { T, F } from '../tokens.js'
import {
  buildInviteShareUrl,
  bundleMetaForProductId,
} from '../../lib/familyWalk.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'
import { useSharedWalkGuard } from '../context/SharedWalkGuardContext.jsx'
import { buildWalkTogetherPresentationSeats } from '../lib/walkTogetherPresentation.js'
import { getWaypoint, loadRomeManifest } from '../../content/manifest.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { t as translate } from '../../i18n/t.js'

/** Couple terracotta / Family verdigris - from established tokens only. */
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
        title: translate('walkTogether.shareTitle'),
        text: translate('walkTogether.shareText'),
        url,
      })
      return true
    } catch {
      /* fall through to copy */
    }
  }
  return copyText(url || invite)
}

function seatStatusLabel(seat, invite, isOwnerSeat) {
  if (isOwnerSeat) return translate('walkTogether.status.organizer')
  if (seat.status === 'claimed') return translate('walkTogether.status.claimed')
  if (seat.status === 'revoked' && !invite) return translate('walkTogether.status.revoked')
  if (invite) return translate('walkTogether.status.inviteReady')
  return translate('walkTogether.status.open')
}

function humanErrorMessage(error) {
  if (error === 'missing_credential' || error === 'invalid') {
    return translate('walkTogether.error.missing')
  }
  if (error === 'not_owner') {
    return translate('walkTogether.error.notOwner')
  }
  if (error === 'no_seat') {
    return translate('walkTogether.error.noSeat')
  }
  if (error === 'retired') {
    return translate('walkTogether.error.retired')
  }
  return String(error)
}

function OccupancyNodes({ seatLimit, claimedCount, accent, isEntry }) {
  const total = Math.max(0, Number(seatLimit) || 0)
  if (!total) return null
  return (
    <ul
      className="cw-walk-together__nodes"
      aria-label={translate('walkTogether.occupancyAria', { claimed: claimedCount, total })}
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
 * Persistent Couple/Family management UI - server-authoritative seats only.
 * Used from Settings (/walk-together) and optional app-entry.
 */
export default function WalkTogetherPanel({
  variant = 'settings',
  onContinue = null,
  showContinue = false,
}) {
  const family = useOptionalFamilyWalk()
  const { requestRejoinSharedWalk } = useSharedWalkGuard()
  const t = useT()
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
    resumePolicy,
    isLeader,
    isWalkingIndependently,
  } = family

  const sessionSyncEnabled = Boolean(session?.syncEnabled)
  const groupStopTitle = (() => {
    if (!session?.waypointId) return null
    const waypoint = getWaypoint(loadRomeManifest(), session.waypointId)
    return waypoint?.title ?? waypoint?.name ?? session.waypointId
  })()

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

  const presentedSeats = buildWalkTogetherPresentationSeats(seats)

  const handleCreateInvite = async (seatId = null) => {
    setStatusNote(null)
    setInviteBusy(true)
    try {
      await createInvite(seatId)
      setStatusNote(t('walkTogether.inviteCreated'))
    } catch {
      /* error surfaced via family.error */
    } finally {
      setInviteBusy(false)
    }
  }

  const handleCopy = async (invite) => {
    const url = buildInviteShareUrl(invite)
    const ok = await copyText(url || invite)
    setStatusNote(ok ? t('walkTogether.copied') : t('walkTogether.copyFailed'))
  }

  const handleShare = async (invite) => {
    const url = buildInviteShareUrl(invite)
    const ok = await shareInvite({ invite, url })
    setStatusNote(ok ? t('walkTogether.shareReady') : t('walkTogether.shareFailed'))
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
        {t('walkTogether.continue')}
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
          {t('walkTogether.empty')}
        </p>
        {continueButton}
      </section>
    )
  }

  const occupancyLabel = t('walkTogether.occupancy', { claimed: claimedCount, total: seatLimit })
  // Keep the legacy “seats in use” phrasing discoverable for existing copy checks.
  const occupancyLegacy = t('walkTogether.occupancyLegacy', { claimed: claimedCount, total: seatLimit })

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
          {t('walkTogether.eyebrow')}
        </p>
        <h2 id="walk-together-heading" className="cw-walk-together__title">
          {meta.label}
        </h2>
        <p className="cw-walk-together__promise">{t('walkTogether.promise')}</p>
        <p className="cw-walk-together__lede">
          {isOrganizer
            ? t('walkTogether.lede.organizer')
            : t('walkTogether.lede.member')}
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
              {t('walkTogether.sharedWalk', { kind: meta.label.replace(/ Bundle$/i, '') })}
            </p>
            <p className="cw-walk-together__occupancy-meta">
              {t('walkTogether.upTo', { total: seatLimit })}
            </p>
          </div>
        )}
      </header>

      {isOrganizer ? (
        <>
          <section className="cw-walk-together__party" aria-labelledby="walk-together-party-heading">
            <h3 id="walk-together-party-heading" className="cw-walk-together__section-title">
              {t('walkTogether.party')}
            </h3>

            <ul className="cw-walk-together__seats">
              {presentedSeats.map(({ seat, presentationNumber, displayName, isOrganizerSeat }) => {
                const invite = latestInvites?.[seat.id] ?? seat.inviteCode ?? null
                // Permissions from verified seat role - never from presentationNumber.
                const canInvite =
                  !isOrganizerSeat && (seat.status === 'open' || seat.status === 'revoked')
                const canRevoke =
                  !isOrganizerSeat && (seat.status === 'claimed' || Boolean(invite))
                const status = seatStatusLabel(seat, invite, isOrganizerSeat)
                const inactive = seat.status === 'revoked' && !invite

                return (
                  <li
                    key={seat.id}
                    data-testid={`walk-together-seat-${seat.id}`}
                    data-seat-id={seat.id}
                    data-presentation-number={presentationNumber}
                    data-seat-status={
                      isOrganizerSeat
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
                          color:
                            isOrganizerSeat || seat.status === 'claimed' ? T.obsidian : accent,
                          background:
                            isOrganizerSeat || seat.status === 'claimed' ? accent : 'transparent',
                        }}
                        aria-hidden
                      >
                        {presentationNumber}
                      </span>
                      <div className="cw-walk-together__seat-copy">
                        <p className="cw-walk-together__seat-name">{displayName}</p>
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
                            aria-label={t('walkTogether.copyLinkAria', { name: displayName })}
                          >
                            {t('walkTogether.copyLink')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleShare(invite)}
                            className="cw-walk-together__btn cw-walk-together__btn--secondary"
                            aria-label={t('walkTogether.shareAria', { name: displayName })}
                          >
                            {t('walkTogether.share')}
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
                          style={{
                            borderColor: `${accent}66`,
                            color: isEntry ? T.warmWhite : T.ink,
                          }}
                        >
                          {working ? t('walkTogether.working') : t('walkTogether.createInvite')}
                        </button>
                      ) : null}
                      {canRevoke ? (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => void revokeSeat(seat.id)}
                          className="cw-walk-together__btn cw-walk-together__btn--tertiary"
                          aria-label={t('walkTogether.revokeAria', { name: displayName })}
                        >
                          {t('walkTogether.revoke')}
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>

            {openMemberSeats.length === 0 && memberSeats.every((s) => s.status === 'claimed') ? (
              <p className="cw-walk-together__hint">
                {t('walkTogether.allSeats')}
              </p>
            ) : null}
          </section>

          <section
            className="cw-walk-together__sync"
            aria-labelledby="walk-together-sync-heading"
          >
            <h3 id="walk-together-sync-heading" className="cw-walk-together__section-title">
              {t('walkTogether.syncHeading')}
            </h3>

            {!session ? (
              <>
                <p className="cw-walk-together__hint">
                  {t('walkTogether.syncHint')}
                </p>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void startSharedWalk('leader')}
                  className="cw-walk-together__btn cw-walk-together__btn--accent"
                  style={{ background: accent, color: T.obsidian }}
                >
                  {t('walkTogether.startSync')}
                </button>
              </>
            ) : (
              <div data-testid="walk-together-session" className="cw-walk-together__sync-panel">
                <p className="cw-walk-together__sync-status">
                  {isLeader ? t('walkTogether.sessionLead') : t('walkTogether.sessionFollow')}
                </p>
                <div className="cw-walk-together__toggle-row">
                  <div>
                    <p className="cw-walk-together__toggle-label">{t('walkTogether.syncLabel')}</p>
                    <p className="cw-walk-together__hint">
                      {t('walkTogether.syncDetail')}
                    </p>
                  </div>
                  <Toggle
                    on={sessionSyncEnabled}
                    onToggle={() => void setSyncEnabled(!sessionSyncEnabled)}
                    label={t('walkTogether.syncLabel')}
                    accent={accent}
                  />
                </div>
                <div className="cw-walk-together__toggle-row">
                  <div>
                    <p className="cw-walk-together__toggle-label">{t('walkTogether.resumeLabel')}</p>
                    <p className="cw-walk-together__hint">{t('walkTogether.resumeHint')}</p>
                  </div>
                  <Toggle
                    on={resumePolicy === 'leader'}
                    onToggle={() =>
                      void setResumePolicy(resumePolicy === 'leader' ? 'anyone' : 'leader')
                    }
                    label={t('walkTogether.resumeLabel')}
                    accent={accent}
                  />
                </div>
                <button
                  type="button"
                  onClick={leaveSharedWalk}
                  className="cw-walk-together__btn cw-walk-together__btn--tertiary"
                >
                  {t('walkTogether.leaveTour')}
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
            {t('walkTogether.memberHeading')}
          </h3>
          <div
            className="cw-walk-together__member-card"
            data-testid="walk-together-member-status"
            data-walking-independently={isWalkingIndependently ? 'true' : 'false'}
          >
            <p className="cw-walk-together__member-copy">
              {t('walkTogether.memberCopy')}
            </p>
            <p className="cw-walk-together__seat-status">
              {isWalkingIndependently
                ? t('walkTogether.independent')
                : isLeader
                  ? t('walkTogether.leading')
                  : t('walkTogether.following')}
            </p>
            {session ? (
              <>
                <p className="cw-walk-together__hint">
                  {isWalkingIndependently
                    ? groupStopTitle
                      ? t('walkTogether.groupActiveAt', { title: groupStopTitle })
                      : t('walkTogether.groupActive')
                    : isLeader
                      ? t('walkTogether.sessionActiveLead')
                      : t('walkTogether.sessionActiveFollow')}
                </p>
                {isWalkingIndependently ? (
                  <button
                    type="button"
                    data-testid="walk-together-rejoin"
                    disabled={working}
                    onClick={() => void requestRejoinSharedWalk()}
                    className="cw-walk-together__btn cw-walk-together__btn--accent"
                    style={{ background: accent, color: T.obsidian, marginTop: 4 }}
                  >
                    {t('walkTogether.rejoin')}
                  </button>
                ) : null}
              </>
            ) : (
              <p className="cw-walk-together__hint">
                {t('walkTogether.noSession')}
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
