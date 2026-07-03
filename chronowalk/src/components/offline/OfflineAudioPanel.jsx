import { useOfflineAudio } from '../../hooks/useOfflineAudio.js'

function ProgressBar({ percent }) {
  const safePercent = Math.max(0, Math.min(100, percent ?? 0))

  return (
    <div style={{ marginTop: 16 }} role="status" aria-live="polite">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontSize: 'var(--fs-meta)',
          color: 'color-mix(in srgb, var(--ink) 60%, var(--bone))',
        }}
      >
        <span>Downloading tour</span>
        <span className="num">{safePercent}%</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'color-mix(in srgb, var(--ink) 8%, var(--bone))',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${safePercent}%`,
            height: '100%',
            borderRadius: 999,
            background: 'var(--accent)',
            transition: 'width 200ms var(--ease)',
          }}
        />
      </div>
    </div>
  )
}

export default function OfflineAudioPanel() {
  const {
    estimate,
    estimateLabel,
    isReady,
    isDownloading,
    progress,
    error,
    status,
    startDownload,
    removeDownload,
  } = useOfflineAudio()

  return (
    <section
      style={{
        padding: 18,
        borderRadius: 'var(--r-card)',
        border: `1px solid color-mix(in srgb, ${isReady ? 'var(--verdigris)' : 'var(--accent)'} 24%, var(--bone))`,
        background: isReady
          ? 'color-mix(in srgb, var(--verdigris) 8%, var(--bone))'
          : 'color-mix(in srgb, var(--accent) 6%, var(--bone))',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'color-mix(in srgb, var(--ink) 50%, var(--bone))',
        }}
      >
        Offline audio
      </p>
      <h2
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          color: 'var(--ink)',
        }}
      >
        Download Rome for offline
      </h2>
      <p style={{ margin: '10px 0 0', fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color: 'color-mix(in srgb, var(--ink) 68%, var(--bone))' }}>
        Cache narration, beds, inserts, system cues, threshold reconstructions, and map tiles for the Rome route.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: 'color-mix(in srgb, var(--ink) 4%, var(--bone))',
            fontSize: 'var(--fs-meta)',
          }}
        >
          <strong className="num">{estimateLabel}</strong>
          <span> estimated</span>
        </div>
        {estimate?.fileCount ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--ink) 4%, var(--bone))',
              fontSize: 'var(--fs-meta)',
            }}
          >
            <strong className="num">{estimate.fileCount}</strong>
            <span> audio files</span>
          </div>
        ) : null}
        {estimate?.mediaFileCount ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--ink) 4%, var(--bone))',
              fontSize: 'var(--fs-meta)',
            }}
          >
            <strong className="num">{estimate.mediaFileCount}</strong>
            <span> visual assets</span>
          </div>
        ) : null}
        {estimate?.mapTileCount ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--ink) 4%, var(--bone))',
              fontSize: 'var(--fs-meta)',
            }}
          >
            <strong className="num">{estimate.mapTileCount}</strong>
            <span> map tiles</span>
          </div>
        ) : null}
        {isReady ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--verdigris) 14%, var(--bone))',
              color: 'var(--verdigris)',
              fontSize: 'var(--fs-meta)',
              fontWeight: 600,
            }}
          >
            Available offline
          </div>
        ) : null}
      </div>

      {isDownloading ? (
        <ProgressBar percent={progress?.percent ?? 0} />
      ) : null}

      {error ? (
        <p style={{ margin: '12px 0 0', fontSize: 'var(--fs-secondary)', color: 'var(--accent)' }}>{error}</p>
      ) : null}

      {status?.error && !error ? (
        <p style={{ margin: '12px 0 0', fontSize: 'var(--fs-secondary)', color: 'var(--accent)' }}>{status.error}</p>
      ) : null}

      <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
        {!isReady ? (
          <button
            type="button"
            onClick={() => void startDownload()}
            disabled={isDownloading}
            style={{
              padding: '14px 18px',
              border: 'none',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--bone)',
              fontWeight: 600,
              cursor: isDownloading ? 'wait' : 'pointer',
            }}
          >
            {isDownloading ? 'Downloading…' : 'Download for offline'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void startDownload()}
              disabled={isDownloading}
              style={{
                padding: '14px 18px',
                border: '1px solid color-mix(in srgb, var(--ink) 14%, var(--bone))',
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--ink)',
                fontWeight: 600,
                cursor: isDownloading ? 'wait' : 'pointer',
              }}
            >
              Update download
            </button>
            <button
              type="button"
              onClick={() => void removeDownload()}
              style={{
                padding: '14px 18px',
                border: 'none',
                borderRadius: 999,
                background: 'transparent',
                color: 'color-mix(in srgb, var(--ink) 60%, var(--bone))',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear offline audio
            </button>
          </>
        )}
      </div>

      <p style={{ margin: '14px 0 0', fontSize: 'var(--fs-meta)', lineHeight: 1.5, color: 'color-mix(in srgb, var(--ink) 55%, var(--bone))' }}>
        Street maps for the tour route cache with the download when Mapbox is configured. Turn-by-turn directions still need a live connection.
      </p>
    </section>
  )
}
