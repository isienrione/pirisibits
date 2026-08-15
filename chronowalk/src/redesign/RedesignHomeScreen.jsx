import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, HelpCircle, ListTree, Settings } from 'lucide-react'
import { F, SHELL_TAB_BAR_INSET } from './tokens.js'
import HomeMapPeek from './ui/HomeMapPeek.jsx'
import HomeProgressArc from './ui/HomeProgressArc.jsx'
import HomeSupportSheet from './ui/HomeSupportSheet.jsx'
import { useSettingsSheet } from './context/SettingsSheetContext.jsx'
import { useSharedWalkGuard } from './context/SharedWalkGuardContext.jsx'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { useJourneyStep } from '../hooks/useJourneyStep.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { packTitleForPurchasedTier } from '../lib/appEntry.js'
import { startFromNearestTourStop } from '../lib/startFromNearestStop.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { getPaceOption, JOURNEY_PACE } from '../data/romePacing.js'
import {
  buildHomeProgressStops,
  buildMyTourActs,
  currentActForTour,
  getTourWaypointIds,
  needsOwnPaceSelection,
  summarizeHomeProgress,
  findSequenceIndexForWaypoint,
} from '../content/myTourPlan.js'
import { titleForWaypoint } from './lib/waypointPresentation.js'

const HOME = {
  canvas: '#F7F1E8',
  card: '#FFFDF8',
  line: '#E6DCCE',
  ink: '#2C2823',
  muted: '#7A7266',
  accent: '#C45C2A',
  accentSoft: '#F3E0D4',
}

function ChronowalkMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="9.5" stroke={HOME.accent} strokeWidth="1.5" />
      <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={HOME.accent} strokeWidth="1.5" />
      <line x1="11" y1="7" x2="18" y2="15" stroke="#B14A6E" strokeWidth="1" opacity="0.55" />
      <line x1="11" y1="7" x2="4" y2="15" stroke="#4E7D9B" strokeWidth="1" opacity="0.55" />
    </svg>
  )
}

function QuickAction({ icon: Icon, label, onClick, testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '8px 4px 7px',
        borderRadius: 12,
        border: `1px solid ${HOME.line}`,
        background: HOME.card,
        color: HOME.ink,
        cursor: 'pointer',
        fontFamily: F.body,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          background: HOME.accentSoft,
          color: HOME.accent,
        }}
      >
        <Icon size={15} strokeWidth={1.9} aria-hidden />
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.15, textAlign: 'center' }}>
        {label}
      </span>
    </button>
  )
}

export default function RedesignHomeScreen() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { openSettings } = useSettingsSheet()
  const { requestJumpToWaypoint } = useSharedWalkGuard()
  const { state, context, begin } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  )
  const [geoBusy, setGeoBusy] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  const acts = useMemo(
    () => (manifest ? buildMyTourActs(manifest, context) : []),
    [manifest, context],
  )
  const progressStops = useMemo(
    () => (manifest ? buildHomeProgressStops(manifest, context) : []),
    [manifest, context],
  )
  const progress = useMemo(() => summarizeHomeProgress(progressStops), [progressStops])
  const currentAct = useMemo(() => currentActForTour(acts), [acts])
  const packTitle = packTitleForPurchasedTier()
  const paceLabel = getPaceOption(context.pace)?.title ?? t('tour.yourTour')

  const journeyActive =
    state !== JOURNEY_STATES.IDLE &&
    state !== JOURNEY_STATES.COMPLETE &&
    state !== JOURNEY_STATES.DAY_COMPLETE

  const currentStopTitle = useMemo(() => {
    if (step?.type === 'waypoint' && step.record) return titleForWaypoint(step.record)
    if (step?.type === 'transit' && step.targetWaypoint) {
      return titleForWaypoint(step.targetWaypoint)
    }
    const currentStop = currentAct?.stops?.find((stop) => stop.status === 'current')
    if (currentStop?.waypoint) return titleForWaypoint(currentStop.waypoint)
    return null
  }, [step, currentAct])

  const handleContinue = useCallback(() => {
    if (journeyActive) {
      navigate('/journey')
      return
    }
    if (context.pace === JOURNEY_PACE.OWN && needsOwnPaceSelection(context)) {
      navigate('/tour')
      return
    }
    const tourIds = manifest ? getTourWaypointIds(manifest, context) : []
    const firstId = tourIds[0]
    let sequenceIndex = context.currentSequenceIndex ?? 0
    if (manifest && firstId && !journeyActive && (context.currentSequenceIndex ?? 0) === 0) {
      sequenceIndex = Math.max(
        0,
        findSequenceIndexForWaypoint(manifest, firstId, context.path, context.promotedOptionalIds),
      )
    }
    begin({
      pace: context.pace,
      path: context.path,
      sequenceIndex,
      customWaypointIds: context.customWaypointIds,
    })
    navigate('/journey')
  }, [begin, context, journeyActive, manifest, navigate])

  const handleStartFromHere = useCallback(async () => {
    if (!manifest || geoBusy) return
    setGeoBusy(true)
    const result = await startFromNearestTourStop({
      manifest,
      context,
      state,
      requestJumpToWaypoint,
    })
    setGeoBusy(false)
    if (result === 'jumped') {
      navigate('/journey')
      return
    }
    if (result === 'no_gps') navigate('/map')
  }, [context, geoBusy, manifest, navigate, requestJumpToWaypoint, state])

  const handleRewatchTutorial = useCallback(() => {
    navigate('/begin?replayOnboarding=1')
  }, [navigate])

  if (loading) {
    return (
      <div
        className="cw-grain"
        data-testid="home-loading"
        style={{
          background: HOME.canvas,
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          fontFamily: F.body,
          color: HOME.muted,
        }}
      >
        {t('home.loading')}
      </div>
    )
  }

  if (error || !manifest) {
    return (
      <div
        className="cw-grain"
        style={{ background: HOME.canvas, height: '100%', padding: 32, fontFamily: F.body }}
      >
        <p style={{ color: HOME.muted }}>{error?.message ?? t('home.unavailable')}</p>
        <Link
          to="/begin"
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: HOME.accent,
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          {t('home.openBegin')}
        </Link>
      </div>
    )
  }

  const continueLabel = journeyActive
    ? t('home.cta.continueWalk')
    : progress.completed > 0 || progress.skipped > 0
      ? t('home.cta.resumeTour')
      : t('home.cta.beginTour')

  return (
    <div
      className="cw-grain"
      data-testid="home-screen"
      style={{
        background: HOME.canvas,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: F.body,
        color: HOME.ink,
        overflow: 'hidden',
        paddingBottom: SHELL_TAB_BAR_INSET,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 16px 6px',
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <ChronowalkMark />
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: F.display,
                fontSize: 22,
                fontWeight: 450,
                lineHeight: 1.1,
                color: HOME.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {packTitle}
            </h1>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12,
                color: HOME.muted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {paceLabel}
              {currentAct?.title ? ` · ${currentAct.title}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openSettings}
          aria-label={t('home.actions.settings')}
          data-testid="home-settings"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: `1px solid ${HOME.line}`,
            background: HOME.card,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: HOME.ink,
            flexShrink: 0,
          }}
        >
          <Settings size={16} />
        </button>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '4px 16px 10px',
          overflow: 'hidden',
        }}
      >
        <HomeProgressArc
          stops={progressStops}
          completed={progress.completed}
          total={progress.total}
          percent={progress.percent}
          currentStopTitle={currentStopTitle}
        />

        <section
          style={{
            flex: '1 1 0',
            minHeight: 96,
            maxHeight: 150,
            borderRadius: 14,
            overflow: 'hidden',
            border: `1px solid ${HOME.line}`,
            background: '#1F1C18',
            position: 'relative',
          }}
        >
          <HomeMapPeek manifest={manifest} context={context} />
          <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 10,
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(20,18,15,0.72)',
              color: '#F7F1E8',
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            {t('home.map.badge')}
          </div>
        </section>

        <div style={{ flexShrink: 0, display: 'grid', gap: 7 }}>
          <button
            type="button"
            data-testid="home-continue"
            onClick={handleContinue}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: 'none',
              background: HOME.accent,
              color: '#fff',
              fontFamily: F.body,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(196, 92, 42, 0.28)',
            }}
          >
            {continueLabel}
          </button>

          <button
            type="button"
            data-testid="home-start-here"
            disabled={geoBusy}
            onClick={() => void handleStartFromHere()}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${HOME.line}`,
              background: HOME.card,
              color: HOME.ink,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 13,
              cursor: geoBusy ? 'wait' : 'pointer',
              opacity: geoBusy ? 0.7 : 1,
            }}
          >
            {geoBusy ? t('home.cta.locating') : t('home.cta.startHere')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <QuickAction
            icon={Settings}
            label={t('home.actions.settings')}
            onClick={openSettings}
            testId="home-quick-settings"
          />
          <QuickAction
            icon={BookOpen}
            label={t('home.actions.tutorial')}
            onClick={handleRewatchTutorial}
            testId="home-quick-tutorial"
          />
          <QuickAction
            icon={HelpCircle}
            label={t('home.actions.support')}
            onClick={() => setSupportOpen(true)}
            testId="home-quick-support"
          />
          <QuickAction
            icon={ListTree}
            label={t('home.actions.roadmap')}
            onClick={() => navigate('/tour')}
            testId="home-quick-roadmap"
          />
        </div>
      </div>

      <HomeSupportSheet open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
