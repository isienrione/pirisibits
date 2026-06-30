import DockedAudioMiniPlayer from './DockedAudioMiniPlayer'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { Button } from './ui'

function PersistentAudioBar({
  title,
  subtitle,
  posterUrl,
  cardOpen,
  onReopenCard,
  onTogglePlayback,
  onStop,
  onOpenPlayer,
}) {
  const { isTourNarrationActive } = useAudioPlaybackState()

  if (!isTourNarrationActive) return null

  return (
    <div className="pointer-events-auto w-full">
      <DockedAudioMiniPlayer
        title={title}
        subtitle={subtitle}
        posterUrl={posterUrl}
        onTogglePlayback={onTogglePlayback}
        onStop={onStop}
        onExpand={onOpenPlayer}
        trailing={
          !cardOpen && onReopenCard ? (
            <Button
              variant="secondary"
              size="sm"
              className="border-ivory/20 bg-ivory/10 px-3 text-ivory hover:bg-ivory/15"
              onClick={onReopenCard}
            >
              Open
            </Button>
          ) : null
        }
      />
    </div>
  )
}

export default PersistentAudioBar
