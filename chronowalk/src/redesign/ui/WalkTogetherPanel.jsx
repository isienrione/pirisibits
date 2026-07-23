import { useEffect, useState } from 'react'
import { T, F } from '../tokens.js'
import {
  buildInviteShareUrl,
  bundleMetaForProductId,
} from '../../lib/familyWalk.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'

function Toggle({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? '#5B5249' : `${T.muted}38`,
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: T.warmWhite,
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'left 250ms',
        }}
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
  const openMemberSeats = memberSeats.filter((seat) => seat.status === 'open' || seat.status === 'revoked')
  const claimedCount = seats.filter((seat) => seat.status === 'claimed').length
  const isEntry = variant === 'entry'
  const ink = isEntry ? T.warmWhite : T.ink
  const muted = T.muted
  const panelBg = isEntry ? `${T.warmWhite}10` : `${T.ember}10`
  const panelBorder = isEntry ? `${T.warmWhite}18` : `${T.ember}28`
  const working = busy || inviteBusy

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

  if (!hasBundleAccess || !bundle || !meta) {
    return (
      <section data-testid="walk-together-panel" style={{ padding: '8px 0' }}>
        <p style={{ margin: 0, fontSize: 14, color: muted, lineHeight: 1.5 }}>
          Walk-together invites are available after a Couple or Family Bundle purchase on this device.
        </p>
        {showContinue ? (
          <button
            type="button"
            onClick={() => onContinue?.()}
            data-testid="walk-together-continue"
            style={{
              width: '100%',
              marginTop: 18,
              padding: '14px',
              minHeight: 44,
              border: 'none',
              borderRadius: 999,
              background: T.ember,
              color: T.obsidian,
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              fontFamily: F.body,
            }}
          >
            Continue to your walk
          </button>
        ) : null}
      </section>
    )
  }

  return (
    <section
      data-testid="walk-together-panel"
      aria-labelledby="walk-together-heading"
      style={{ padding: isEntry ? 0 : '8px 0 4px', color: ink, fontFamily: F.body }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: muted,
        }}
      >
        Walk together
      </p>
      <h2
        id="walk-together-heading"
        style={{
          margin: 0,
          fontFamily: F.display,
          fontSize: isEntry ? 28 : 20,
          fontWeight: 500,
          color: ink,
        }}
      >
        {meta.label}
      </h2>
      <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: muted }}>
        Complete Roma Eterna · All 21 stops
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: muted }}>
        {isOrganizer
          ? `Invite people and manage your shared tour · ${claimedCount}/${seatLimit} seats in use`
          : 'You belong to a shared Couple/Family walk with shared tour progress.'}
      </p>

      {isOrganizer ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {seats.map((seat) => {
              const invite = latestInvites?.[seat.id] ?? seat.inviteCode ?? null
              const isOwnerSeat = seat.role === 'owner'
              const canInvite =
                !isOwnerSeat && (seat.status === 'open' || seat.status === 'revoked')
              const canRevoke = !isOwnerSeat && (seat.status === 'claimed' || Boolean(invite))

              return (
                <li
                  key={seat.id}
                  data-testid={`walk-together-seat-${seat.id}`}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: panelBg,
                    border: `1px solid ${panelBorder}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: ink }}>
                    {isOwnerSeat ? 'You (organizer)' : seat.label || 'Member seat'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: muted }}>
                    {seat.status === 'claimed'
                      ? 'Claimed on a device'
                      : seat.status === 'revoked'
                        ? 'Revoked — create a new invitation'
                        : invite
                          ? 'Invitation ready'
                          : 'Open seat'}
                  </p>

                  {invite ? (
                    <div style={{ marginTop: 10 }}>
                      <p
                        data-testid="walk-together-invite-code"
                        style={{
                          margin: 0,
                          fontSize: 18,
                          letterSpacing: '0.14em',
                          textAlign: 'center',
                          color: ink,
                          wordBreak: 'break-all',
                        }}
                      >
                        {invite}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => void handleCopy(invite)}
                          style={secondaryBtn(isEntry)}
                        >
                          Copy invite link
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleShare(invite)}
                          style={secondaryBtn(isEntry)}
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {canInvite ? (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void handleCreateInvite(seat.id)}
                        style={primaryBtn(isEntry, working)}
                      >
                        {working ? 'Working…' : 'Create invitation'}
                      </button>
                    ) : null}
                    {canRevoke ? (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void revokeSeat(seat.id)}
                        style={secondaryBtn(isEntry)}
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
            <p style={{ margin: 0, fontSize: 13, color: muted, lineHeight: 1.45 }}>
              All paid seats are in use. Revoke a member seat to reissue an invitation.
            </p>
          ) : null}

          {!session ? (
            <button
              type="button"
              disabled={working}
              onClick={() => void startSharedWalk('leader')}
              style={primaryBtn(isEntry, working)}
            >
              Start shared tour syncing
            </button>
          ) : (
            <div
              data-testid="walk-together-session"
              style={{
                display: 'grid',
                gap: 12,
                padding: 14,
                borderRadius: 14,
                background: isEntry ? `${T.warmWhite}10` : T.warmWhite,
                border: `1px solid ${isEntry ? `${T.warmWhite}18` : `${T.ink800}22`}`,
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: ink }}>
                Shared tour progress {isLeader ? '· you lead' : '· following'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, color: ink }}>Shared tour syncing</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: muted, lineHeight: 1.4 }}>
                    Keeps shared tour progress connected across devices — not live GPS or synced audio playback.
                  </p>
                </div>
                <Toggle
                  on={syncEnabled}
                  onToggle={() => void setSyncEnabled(!syncEnabled)}
                  label="Shared tour syncing"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, color: ink }}>Only leader resumes</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: muted, lineHeight: 1.4 }}>
                    Anyone can still pause for the group
                  </p>
                </div>
                <Toggle
                  on={resumePolicy === 'leader'}
                  onToggle={() => void setResumePolicy(resumePolicy === 'leader' ? 'anyone' : 'leader')}
                  label="Only leader resumes"
                />
              </div>
              <button type="button" onClick={leaveSharedWalk} style={secondaryBtn(isEntry)}>
                Leave shared tour
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: panelBg,
              border: `1px solid ${panelBorder}`,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: ink, lineHeight: 1.5 }}>
              Full Roma Eterna · 21 stops on this device. Shared tour progress stays connected when your
              organizer starts a shared tour.
            </p>
            {session ? (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: muted }}>
                Shared tour active {isLeader ? '· you lead' : '· following'}
              </p>
            ) : (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: muted }}>
                No active shared tour session on this phone yet.
              </p>
            )}
          </div>
        </div>
      )}

      {statusNote ? (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: muted, lineHeight: 1.45 }}>{statusNote}</p>
      ) : null}

      {error ? (
        <p
          style={{ margin: '10px 0 0', fontSize: 13, color: isEntry ? T.ember : T.actI }}
          onClick={clearError}
        >
          {error === 'missing_credential' || error === 'invalid'
            ? 'This device no longer has an active Couple/Family credential.'
            : error === 'not_owner'
              ? 'Only the organizer can create or revoke invitations.'
              : error === 'no_seat'
                ? 'No open seat left on this bundle.'
                : error === 'retired'
                  ? 'Bundles are created by purchase only — manage invites here instead.'
                  : String(error)}
        </p>
      ) : null}

      {showContinue ? (
        <button
          type="button"
          onClick={() => onContinue?.()}
          data-testid="walk-together-continue"
          style={{
            ...primaryBtn(isEntry, false),
            marginTop: 20,
          }}
        >
          Continue to your walk
        </button>
      ) : null}
    </section>
  )
}

function primaryBtn(isEntry, busy) {
  return {
    width: '100%',
    padding: '13px 14px',
    minHeight: 44,
    borderRadius: 12,
    border: 'none',
    background: T.ember,
    color: T.obsidian,
    fontWeight: 600,
    fontFamily: F.body,
    fontSize: 15,
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.65 : 1,
  }
}

function secondaryBtn(isEntry) {
  return {
    flex: 1,
    padding: '12px 14px',
    minHeight: 44,
    borderRadius: 12,
    border: `1px solid ${isEntry ? `${T.warmWhite}28` : `${T.ink800}30`}`,
    background: 'transparent',
    color: isEntry ? T.warmWhite : T.ink,
    fontFamily: F.body,
    fontSize: 14,
    cursor: 'pointer',
  }
}

/** @deprecated Prefer WalkTogetherPanel */
export { WalkTogetherPanel as FamilyWalkPanel }
