import { T, F } from '../tokens.js'

/**
 * Compact in-walk HUD for Family Walk sync status + shared pause/resume.
 */
export default function WalkSyncBar({
  syncEnabled,
  joinCode,
  isLeader,
  resumePolicy,
  canResumeForAll,
  narrationPlaying,
  pendingGroupResume = false,
  walkingIndependently = false,
  onToggleSync,
  onPauseAll,
  onResumeAll,
  onResumeWithGroup = null,
  statusMessage = null,
}) {
  if (!joinCode) return null

  const modeLabel = walkingIndependently
    ? 'Walking independently'
    : syncEnabled
      ? 'Synced walk'
      : 'Autonomous'

  return (
    <div
      data-testid="walk-sync-bar"
      data-walking-independently={walkingIndependently ? 'true' : 'false'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 14,
        background: 'rgba(11,11,13,0.78)',
        border: `1px solid ${T.warmWhite}18`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: T.warmWhite,
        fontFamily: F.body,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: `${T.warmWhite}70`,
            }}
          >
            {modeLabel}
            {walkingIndependently ? '' : ` · ${joinCode}`}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: `${T.warmWhite}85` }}>
            {walkingIndependently
              ? 'Shared syncing paused on this phone'
              : `${isLeader ? 'Leader' : 'Follower'}${
                  syncEnabled
                    ? resumePolicy === 'leader'
                      ? ' · only leader resumes'
                      : ' · anyone can resume'
                    : ' · sync off'
                }`}
          </p>
        </div>
        {walkingIndependently || !isLeader ? null : (
          <button
            type="button"
            onClick={onToggleSync}
            aria-pressed={syncEnabled}
            style={{
              flexShrink: 0,
              minHeight: 36,
              padding: '6px 12px',
              borderRadius: 999,
              border: `1px solid ${T.warmWhite}22`,
              background: syncEnabled ? `${T.ember}35` : 'transparent',
              color: T.warmWhite,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sync {syncEnabled ? 'on' : 'off'}
          </button>
        )}
      </div>

      {syncEnabled && !walkingIndependently ? (
        <div style={{ display: 'flex', gap: 8 }}>
          {pendingGroupResume && !isLeader ? (
            <button
              type="button"
              data-testid="sync-resume-with-group"
              onClick={() => void onResumeWithGroup?.()}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: 'none',
                background: T.ember,
                color: T.obsidian,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Resume with group
            </button>
          ) : narrationPlaying ? (
            <button
              type="button"
              data-testid="sync-pause-all"
              onClick={onPauseAll}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: 'none',
                background: T.ember,
                color: T.obsidian,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Pause for everyone
            </button>
          ) : (
            <button
              type="button"
              data-testid="sync-resume-all"
              disabled={!canResumeForAll}
              onClick={onResumeAll}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: 'none',
                background: canResumeForAll ? T.ember : `${T.warmWhite}18`,
                color: canResumeForAll ? T.obsidian : `${T.warmWhite}55`,
                fontWeight: 700,
                fontSize: 14,
                cursor: canResumeForAll ? 'pointer' : 'default',
              }}
            >
              {canResumeForAll ? 'Resume for everyone' : 'Waiting for leader'}
            </button>
          )}
        </div>
      ) : null}

      {pendingGroupResume && !isLeader ? (
        <p style={{ margin: 0, fontSize: 12, color: `${T.warmWhite}75` }}>
          Group resumed · tap to continue audio on this phone (browser autoplay limit).
        </p>
      ) : null}

      {statusMessage ? (
        <p style={{ margin: 0, fontSize: 12, color: `${T.warmWhite}75` }}>{statusMessage}</p>
      ) : null}
    </div>
  )
}
