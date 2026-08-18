import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import {
  getStepIdAtIndex,
  getTransit,
  getWaypoint,
  isWaypointId,
  loadRomeManifest,
} from '../../content/manifest.js'
import { jumpToWaypointInJourney } from '../../lib/jumpToWaypoint.js'
import { getJourneySnapshot, JOURNEY_STATES } from '../../state/journey.js'
import { useOptionalFamilyWalk } from './FamilyWalkContext.jsx'
import SharedWalkConfirmDialog from '../ui/SharedWalkConfirmDialog.jsx'
import { t } from '../../i18n/t.js'

const SharedWalkGuardCtx = createContext(null)

function titleForStop(stepId, manifest) {
  if (!stepId) return t('walkTogether.guard.currentStop')
  const waypoint = getWaypoint(manifest, stepId)
  if (waypoint) return waypoint.title ?? waypoint.name ?? stepId
  const transit = getTransit(manifest, stepId)
  if (transit) {
    const targetId = transit.to ?? transit.target ?? transit.target_waypoint_id
    if (targetId && isWaypointId(manifest, targetId)) {
      const target = getWaypoint(manifest, targetId)
      if (target) return target.title ?? target.name ?? targetId
    }
    return transit.title ?? transit.name ?? t('walkTogether.guard.nextStretch')
  }
  return stepId
}

function currentJourneyStepId(manifest) {
  const snap = getJourneySnapshot()
  const ctx = snap?.context
  if (!ctx || !manifest) return null
  return getStepIdAtIndex(
    manifest,
    ctx.path,
    ctx.currentSequenceIndex ?? 0,
    ctx.promotedOptionalIds ?? [],
    ctx,
  )
}

/**
 * Shared-session group stop for leave detection.
 * Prefer the leader-published session waypoint; when it has not landed yet
 * (common right after session create - pause/resume can still work), fall back
 * to this device's current journey step so Continue cannot fail-open.
 */
function resolveGroupStopId(session, manifest) {
  if (session?.waypointId) return session.waypointId
  return currentJourneyStepId(manifest)
}

/**
 * Centralized follower stop-navigation guard.
 * Warns before a synced follower leaves the group's waypoint; detach is server-authoritative.
 */
// Hooks are co-exported with the provider (same pattern as FamilyWalkContext).
/* eslint-disable react-refresh/only-export-components */
export function SharedWalkGuardProvider({ children }) {
  const family = useOptionalFamilyWalk()
  const [dialog, setDialog] = useState(null)
  const pendingRef = useRef(null)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)

  const closeDialog = useCallback(() => {
    setDialog(null)
    setActionError(null)
    pendingRef.current = null
    setBusy(false)
  }, [])

  /**
   * True while a known non-leader bundle member may still be attaching to an
   * active shared session - must not silently allow waypoint changes.
   */
  const isFollowerSessionUnresolved = useCallback(() => {
    if (!family) return false
    if (family.isLeader || family.isOrganizer) return false
    if (family.isWalkingIndependently) return false
    const maybeMember = Boolean(family.isMember || family.hasBundleAccess)
    if (!maybeMember) return false
    // Discovery / RPC in flight before a session object exists.
    if (family.busy && !family.session?.id) return true
    // Session present but participation not yet authoritative.
    if (
      family.session?.id &&
      family.session.syncParticipation == null &&
      (family.busy || family.syncEnabled == null)
    ) {
      return true
    }
    return false
  }, [family])

  const shouldGuardStopChange = useCallback(
    (destinationWaypointId) => {
      if (!destinationWaypointId) return false
      if (isFollowerSessionUnresolved()) return true

      const session = family?.session
      if (!session?.id) return false
      if (family?.isLeader) return false
      if (family?.isWalkingIndependently) return false
      if (!family?.syncEnabled) return false

      const manifest = loadRomeManifest()
      const groupStop = resolveGroupStopId(session, manifest)
      // Synced follower with unknown group stop - fail closed (never silent advance).
      if (!groupStop) return true
      return destinationWaypointId !== groupStop
    },
    [
      family?.isLeader,
      family?.isWalkingIndependently,
      family?.session,
      family?.syncEnabled,
      isFollowerSessionUnresolved,
    ],
  )

  const runGuarded = useCallback(
    async ({ destinationWaypointId, execute }) => {
      if (typeof execute !== 'function') return false

      if (isFollowerSessionUnresolved()) {
        return await new Promise((resolve) => {
          pendingRef.current = { execute: null, resolve, mode: 'resolving' }
          setActionError(null)
          setDialog({
            title: t('walkTogether.guard.checking'),
            message: t('walkTogether.guard.checkingBody'),
            cancelLabel: t('walkTogether.guard.stayHere'),
            confirmLabel: null,
          })
        })
      }

      if (!shouldGuardStopChange(destinationWaypointId)) {
        return Boolean(execute())
      }

      const manifest = loadRomeManifest()
      const groupStop = resolveGroupStopId(family?.session, manifest)
      return await new Promise((resolve) => {
        pendingRef.current = { execute, resolve, mode: 'leave' }
        setActionError(null)
        setDialog({
          title: t('walkTogether.guard.leaveTitle'),
          message: t('walkTogether.guard.leaveBody', {
            group: titleForStop(groupStop, manifest),
            destination: titleForStop(destinationWaypointId, manifest),
          }),
          cancelLabel: t('walkTogether.guard.stayGroup'),
          confirmLabel: t('walkTogether.guard.continueOwn'),
        })
      })
    },
    [family?.session, isFollowerSessionUnresolved, shouldGuardStopChange],
  )

  const requestJumpToWaypoint = useCallback(
    async (manifest, waypointId, context, state, options = {}) => {
      return runGuarded({
        destinationWaypointId: waypointId,
        execute: () => jumpToWaypointInJourney(manifest, waypointId, context, state, options),
      })
    },
    [runGuarded],
  )

  const requestAdvanceToWaypoint = useCallback(
    async (destinationWaypointId, execute) => {
      return runGuarded({ destinationWaypointId, execute })
    },
    [runGuarded],
  )

  const requestRejoinSharedWalk = useCallback(async () => {
    if (!family?.rejoinSharedWalk) return null
    const session = family.session
    const leaderStop = session?.waypointId
    const manifest = loadRomeManifest()

    const performRejoin = async () => {
      const next = await family.rejoinSharedWalk()
      if (next?.waypointId) {
        const snap = getJourneySnapshot()
        jumpToWaypointInJourney(
          manifest,
          next.waypointId,
          snap.context,
          snap.state,
          { targetState: JOURNEY_STATES.WALKING },
        )
      }
      return next
    }

    const localStop = currentJourneyStepId(manifest)
    const alreadyWithGroup =
      !leaderStop || (localStop && isWaypointId(manifest, localStop) && localStop === leaderStop)

    if (alreadyWithGroup) {
      return performRejoin()
    }

    return await new Promise((resolve) => {
      pendingRef.current = { execute: performRejoin, resolve, mode: 'rejoin' }
      setActionError(null)
      setDialog({
        title: t('walkTogether.guard.rejoinTitle'),
        message: t('walkTogether.guard.rejoinBody', {
          group: titleForStop(leaderStop, manifest),
        }),
        cancelLabel: t('walkTogether.guard.notNow'),
        confirmLabel: t('walkTogether.guard.rejoinConfirm'),
      })
    })
  }, [family])

  const handleCancel = useCallback(() => {
    const pending = pendingRef.current
    closeDialog()
    pending?.resolve?.(false)
  }, [closeDialog])

  const handleConfirm = useCallback(async () => {
    const pending = pendingRef.current
    if (!pending) {
      closeDialog()
      return
    }

    if (pending.mode === 'resolving') {
      closeDialog()
      pending.resolve?.(false)
      return
    }

    setBusy(true)
    setActionError(null)
    try {
      if (pending.mode === 'rejoin') {
        const next = await pending.execute()
        closeDialog()
        pending.resolve?.(next)
        return
      }

      if (!family?.detachFromSharedWalk) {
        throw new Error('detach_unavailable')
      }
      await family.detachFromSharedWalk()
      const ok = Boolean(pending.execute())
      closeDialog()
      pending.resolve?.(ok)
    } catch (err) {
      setBusy(false)
      setActionError(
        err?.code === 'leader_cannot_detach'
          ? t('walkTogether.guard.leaderDetach')
          : pending.mode === 'rejoin'
            ? t('walkTogether.guard.rejoinError')
            : t('walkTogether.guard.leaveError'),
      )
    }
  }, [closeDialog, family])

  const value = useMemo(
    () => ({
      shouldGuardStopChange,
      requestJumpToWaypoint,
      requestAdvanceToWaypoint,
      requestRejoinSharedWalk,
      isWalkingIndependently: Boolean(family?.isWalkingIndependently),
      isFollowerSessionUnresolved: isFollowerSessionUnresolved(),
    }),
    [
      family?.isWalkingIndependently,
      isFollowerSessionUnresolved,
      requestAdvanceToWaypoint,
      requestJumpToWaypoint,
      requestRejoinSharedWalk,
      shouldGuardStopChange,
    ],
  )

  return (
    <SharedWalkGuardCtx.Provider value={value}>
      {children}
      <SharedWalkConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        cancelLabel={dialog?.cancelLabel}
        confirmLabel={dialog?.confirmLabel}
        busy={busy}
        error={actionError}
        onCancel={handleCancel}
        onConfirm={() => void handleConfirm()}
      />
    </SharedWalkGuardCtx.Provider>
  )
}

export function useSharedWalkGuard() {
  const ctx = useContext(SharedWalkGuardCtx)
  if (!ctx) {
    return {
      shouldGuardStopChange: () => false,
      requestJumpToWaypoint: async (manifest, waypointId, context, state, options) =>
        jumpToWaypointInJourney(manifest, waypointId, context, state, options),
      requestAdvanceToWaypoint: async (_destinationWaypointId, execute) => Boolean(execute?.()),
      requestRejoinSharedWalk: async () => null,
      isWalkingIndependently: false,
      isFollowerSessionUnresolved: false,
    }
  }
  return ctx
}

export function useOptionalSharedWalkGuard() {
  return useContext(SharedWalkGuardCtx)
}
/* eslint-enable react-refresh/only-export-components */
