import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Headphones, HelpCircle, Settings } from 'lucide-react'
import { T, F, SHELL_TAB_BAR_INSET } from './tokens.js'
import { Eyebrow } from './ui/index.js'
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
import { getPaceOption } from '../data/romePacing.js'
import {
  buildMyTourActs,
  currentActForTour,
  getTourWaypointIds,
  needsOwnPaceSelection,
  summarizeMyTour,
  findSequenceIndexForWaypoint,
} from '../content/myTourPlan.js'
import { JOURNEY_PACE } from '../data/romePacing.js'
import { titleForWaypoint } from './lib/waypointPresentation.js'

function ChronowalkMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="9.5" stroke={T.ember} strokeWidth="1.5" />
      <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={T.ember} strokeWidth="1.5" />
      <line x1="11" y1="7" x2="18" y2="15" stroke={T.actV} strokeWidth="1" opacity="0.6" />
      <line x1="11" y1="7" x2="4" y2="15" stroke={T.actVI} strokeWidth="1" opacity="0.6" />
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
        gap: 8,
        padding: '14px 8px 12px',
        borderRadius: 14,
        border: `1px solid ${T.limestone}`,
        background: T.warmWhite,
        color: T.ink,
        cursor: 'pointer',
        fontFamily: F.body,
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          background: `${T.gold}18`,
          color: T.bronze,
        }}
      >
        <Icon size={18} strokeWidth={1.85} aria-hidden />
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
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
  const progress = useMemo(() => summarizeMyTour(acts), [acts])
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
          background: T.bone,
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          fontFamily: F.body,
          color: T.muted,
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
        style={{ background: T.bone, height: '100%', padding: 32, fontFamily: F.body }}
      >
        <p style={{ color: T.muted }}>{error?.message ?? t('home.unavailable')}</p>
        <Link
          to="/begin"
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: T.ember,
            color: T.obsidian,
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
    : progress.completed > 0
      ? t('home.cta.resumeTour')
      : t('home.cta.beginTour')

  return (
    <div
      className="cw-grain"
      data-testid="home-screen"
      style={{
        background: T.bone,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: F.body,
        color: T.ink,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px 8px',
          paddingTop: 'max(14px, env(safe-area-inset-top))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChronowalkMark />
          <div>
            <Eyebrow color={T.bronze}>{t('home.eyebrow')}</Eyebrow>
            <h1
              style={{
                margin: '2px 0 0',
                fontFamily: F.display,
                fontSize: 26,
                fontWeight: 400,
                lineHeight: 1.1,
                color: T.ink,
              }}
            >
              {t('home.title')}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={openSettings}
          aria-label={t('home.actions.settings')}
          data-testid="home-settings"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: `1px solid ${T.limestone}`,
            background: T.warmWhite,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: T.ink,
          }}
        >
          <Settings size={18} />
        </button>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 20px',
          paddingBottom: `calc(24px + ${SHELL_TAB_BAR_INSET})`,
        }}
      >
        <section style={{ marginBottom: 18 }}>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.bronze,
              fontWeight: 650,
            }}
          >
            {t('home.tourLabel')}
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: F.display,
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.15,
              color: T.ink,
            }}
          >
            {packTitle}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: `${T.ink}99` }}>
            {t('home.paceLine', { pace: paceLabel })}
            {currentAct?.title
              ? ` · ${t('home.actLine', { act: currentAct.title })}`
              : null}
          </p>
        </section>

        <div style={{ marginBottom: 16 }}>
          <HomeProgressArc
            completed={progress.completed}
            total={progress.total}
            currentStopTitle={currentStopTitle}
          />
        </div>

        <section
          style={{
            marginBottom: 16,
            borderRadius: 18,
            overflow: 'hidden',
            border: `1px solid ${T.limestone}`,
            background: T.charcoal,
            height: 168,
            position: 'relative',
          }}
        >
          <HomeMapPeek manifest={manifest} context={context} />
          <div
            style={{
              position: 'absolute',
              left: 12,
              bottom: 12,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(11,11,13,0.72)',
              color: T.warmWhite,
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            {t('home.map.badge')}
          </div>
        </section>

        <button
          type="button"
          data-testid="home-continue"
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: '15px 16px',
            borderRadius: 14,
            border: 'none',
            background: T.ember,
            color: T.obsidian,
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 10,
            boxShadow: `0 8px 24px ${T.ember}44`,
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
            padding: '13px 16px',
            borderRadius: 14,
            border: `1px solid ${T.limestone}`,
            background: T.warmWhite,
            color: T.ink,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 14,
            cursor: geoBusy ? 'wait' : 'pointer',
            marginBottom: 18,
            opacity: geoBusy ? 0.7 : 1,
          }}
        >
          {geoBusy ? t('home.cta.locating') : t('home.cta.startHere')}
        </button>

        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
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
        </div>

        <button
          type="button"
          onClick={() => navigate('/tour')}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: `${T.ink}88`,
            fontFamily: F.body,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Headphones size={15} aria-hidden />
          {t('home.openTourRoadmap')}
        </button>
      </div>

      <HomeSupportSheet open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
