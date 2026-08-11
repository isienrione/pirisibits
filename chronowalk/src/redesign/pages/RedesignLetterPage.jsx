import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildJourneyLetter,
  projectMeanderPoints,
  readTravelerName,
  writeTravelerName,
} from '../../content/journeyLetter.js'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { saveLetterCard, shareLetterCard } from '../../components/letter/letterExport.js'
import ReviewPrompt from '../../components/ReviewPrompt.jsx'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import F1JourneyLetter from '../screens/F1JourneyLetter.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'

export default function RedesignLetterPage() {
  const navigate = useNavigate()
  const t = useT()
  const { context, state } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()
  const reviewPromptActive = state === JOURNEY_STATES.COMPLETE
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [travelerName, setTravelerName] = useState(() => readTravelerName())

  const letter = useMemo(
    () =>
      manifest
        ? buildJourneyLetter(manifest, { ...context, travelerName })
        : null,
    [manifest, context, travelerName],
  )

  const meander = useMemo(
    () => projectMeanderPoints(letter?.stops ?? []),
    [letter?.stops],
  )

  useEffect(() => {
    if (letter) track(TRACK_EVENTS.LETTER_VIEW, { stop_count: letter.stopCount })
  }, [letter])

  const stats = useMemo(() => {
    const stopCount = letter?.stopCount ?? 0
    return [
      { v: t('letter.stopsValue', { count: stopCount }), l: t('letter.stat.visited') },
      { v: letter?.durationLabel ?? '-', l: t('letter.stat.inRome') },
      { v: '21', l: t('letter.stat.centuries') },
    ]
  }, [letter, t])

  const handleNameChange = (name) => {
    setTravelerName(name)
    writeTravelerName(name)
  }

  const handleSave = async () => {
    if (!letter) return
    setBusy(true)
    setMessage('')
    try {
      const result = await saveLetterCard(letter, meander)
      track(TRACK_EVENTS.LETTER_SAVE, { stop_count: letter.stopCount, method: result })
      setMessage(
        result === 'fallback'
          ? t('letter.saveFallback')
          : result === 'error'
            ? t('letter.saveError')
            : t('letter.saved'),
      )
    } catch {
      setMessage(t('letter.saveError'))
    } finally {
      setBusy(false)
    }
  }

  const handleShare = async () => {
    if (!letter) return
    setBusy(true)
    setMessage('')
    try {
      const result = await shareLetterCard(letter, meander)
      track(TRACK_EVENTS.LETTER_SHARE, { stop_count: letter.stopCount, method: result })
      setMessage(
        result === 'share'
          ? t('letter.shareReady')
          : result === 'download' || result === 'fallback'
            ? t('letter.shareSaved')
            : t('letter.shareError'),
      )
    } catch {
      setMessage(t('letter.shareError'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell" style={{ minHeight: '100dvh', background: '#0B0B0D' }} />
      </RedesignRouteShell>
    )
  }

  if (error || !letter) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell redesign-phone-frame" style={{ padding: 32, color: '#FAF6EF' }}>
          <p>{error?.message ?? t('letter.notReady')}</p>
          <button type="button" onClick={() => navigate('/journey')} style={{ marginTop: 16 }}>
            {t('letter.backWalk')}
          </button>
        </div>
      </RedesignRouteShell>
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <F1JourneyLetter
          firstName={letter.firstName ?? t('letter.traveler')}
          body={letter.body}
          reflection={letter.reflection}
          stats={stats}
          busy={busy}
          statusMessage={message}
          onSave={handleSave}
          onShare={handleShare}
          onBack={() => navigate('/journal')}
          travelerName={travelerName}
          onTravelerNameChange={handleNameChange}
        />
      </div>
      <ReviewPrompt active={reviewPromptActive} />
    </RedesignRouteShell>
  )
}
