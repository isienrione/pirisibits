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

const SharedWalkGuardCtx = createContext(null)

function titleForStop(stepId, manifest) {
  if (!stepId) return 'the current stop'
  const waypoint = getWaypoint(manifest, stepId)
  if (waypoint) return waypoint.title ?? waypoint.name ?? stepId
  const transit = getTransit(manifest, stepId)
  if (transit) {
    const targetId = transit.to ?? transit.target ?? transit.target_waypoint_id
    if (targetId && isWaypointId(manifest, targetId)) {
      const target = getWaypoint(manifest, targetId)
      if (target) return target.title ?? target.name ?? targetId
    }
    return transit.title ?? transit.name ?? 'the next stretch'
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
  )
}

/**
 * Centralized follower stop-navigation guard.
 * Warns before a synced follower leaves the group's waypoint; detach is server-authoritative.
 */
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

  const shouldGuardStopChange = useCallback(
    (destinationWaypointId) => {
      const session = family?.session
      if (!session?.id) return false
      if (family?.isLeader) return false
      if (family?.isWalkingIndependently) return false
      if (!family?.syncEnabled) return false
      if (!destinationWaypointId) return false
      const groupStop = session.waypointId
      if (!groupStop) return false
      return destinationWaypointId !== groupStop
    },
    [family?.isLeader, family?.isWalkingIndependently, family?.session, family?.syncEnabled],
  )

  const runGuarded = useCallback(
    async ({ destinationWaypointId, execute }) => {
      if (typeof execute !== 'function') return false

      if (!shouldGuardStopChange(destinationWaypointId)) {
        return Boolean(execute())
      }

      const manifest = loadRomeManifest()
      const groupStop = family?.session?.waypointId
      return await new Promise((resolve) => {
        pendingRef.current = { execute, resolve, mode: 'leave' }
        setActionError(null)
        setDialog({
          title: 'Leave the shared walk?',
          message: `Your group is still at ${titleForStop(groupStop, manifest)}. Going to ${titleForStop(destinationWaypointId, manifest)} will pause shared syncing on this phone. You’ll keep full tour access and can rejoin from Walk together.`,
          cancelLabel: 'Stay with group',
          confirmLabel: 'Continue on my own',
        })
      })
    },
    [family?.session?.waypointId, shouldGuardStopChange],
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
        title: 'Rejoin your group?',
        message: `Your group is currently at ${titleForStop(leaderStop, manifest)}. Rejoining will take this phone back to that point in the shared walk.`,
        cancelLabel: 'Not now',
        confirmLabel: 'Rejoin group',
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
          ? 'The organizer cannot leave shared syncing this way.'
          : pending.mode === 'rejoin'
            ? 'Could not rejoin the shared walk. Check your connection and try again.'
            : 'Could not leave shared syncing. Check your connection and try again.',
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
    }),
    [
      family?.isWalkingIndependently,
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
    }
  }
  return ctx
}

export function useOptionalSharedWalkGuard() {
  return useContext(SharedWalkGuardCtx)
}
