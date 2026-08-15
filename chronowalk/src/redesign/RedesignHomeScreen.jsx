import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, HelpCircle, ListTree, MapPinned, Navigation, Settings } from 'lucide-react'
import { T, F, SHELL_TAB_BAR_INSET } from './tokens.js'
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

function ChronowalkMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="9.5" stroke={T.ember} strokeWidth="1.5" />
      <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={T.ember} strokeWidth="1.5" />
      <line x1="11" y1="7" x2="18" y2="15" stroke={T.actV} strokeWidth="1" opacity="0.55" />
      <line x1="11" y1="7" x2="4" y2="15" stroke={T.actVI} strokeWidth="1" opacity="0.55" />
    </svg>
  )
}

function DashCard({ children, onClick, testId, style = {} }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      data-testid={testId}
      onClick={onClick}
      style={{
        border: 'none',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 18,
        background: 'linear-gradient(180deg, #222228 0%, #17171C 100%)',
        boxShadow: 'inset 0 1px 0 rgba(250,246,239,0.06)',
        color: T.warmWhite,
        fontFamily: F.body,
        padding: 14,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

function ActionTile({ icon: Icon, label, hint, onClick, testId, accent = T.ember }) {
  return (
    <DashCard onClick={onClick} testId={testId} style={{ minHeight: 78, padding: '12px 12px 11px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            background: `${accent}22`,
            color: accent,
          }}
        >
          <Icon size={15} strokeWidth={1.9} aria-hidden />
        </span>
      </div>
      <p
        style={{
          margin: '10px 0 0',
          fontSize: 13,
          fontWeight: 650,
          lineHeight: 1.2,
          color: T.warmWhite,
        }}
      >
        {label}
      </p>
      {hint ? (
        <p style={{ margin: '3px 0 0', fontSize: 11, color: `${T.muted}`, lineHeight: 1.2 }}>
          {hint}
        </p>
      ) : null}
    </DashCard>
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
          background: T.obsidian,
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
        style={{ background: T.obsidian, height: '100%', padding: 32, fontFamily: F.body }}
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
    : progress.completed > 0 || progress.skipped > 0
      ? t('home.cta.resumeTour')
      : t('home.cta.beginTour')

  return (
    <div
      className="cw-grain"
      data-testid="home-screen"
      style={{
        background: `radial-gradient(120% 80% at 50% -10%, #2A2418 0%, ${T.obsidian} 52%)`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: F.body,
        color: T.warmWhite,
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
          padding: '10px 16px 8px',
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
                color: T.warmWhite,
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
                color: T.muted,
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
            border: `1px solid ${T.warmWhite}18`,
            background: `${T.charcoal}`,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: T.warmWhite,
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
          gap: 10,
          padding: '2px 16px 10px',
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

        <div
          style={{
            flex: '1 1 0',
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: 10,
          }}
        >
          <DashCard
            style={{
              padding: 0,
              overflow: 'hidden',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, minHeight: 110, position: 'relative' }}>
              <HomeMapPeek manifest={manifest} context={context} />
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 10,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'rgba(11,11,13,0.72)',
                  color: T.warmWhite,
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 650,
                  pointerEvents: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <MapPinned size={11} aria-hidden />
                {t('home.map.badge')}
              </div>
            </div>
          </DashCard>

          <div style={{ display: 'grid', gap: 10, minHeight: 0 }}>
            <DashCard
              onClick={handleContinue}
              testId="home-continue"
              style={{
                background: `linear-gradient(160deg, ${T.terracotta} 0%, #C24722 100%)`,
                boxShadow: '0 10px 24px rgba(228, 85, 46, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 0,
              }}
            >
              <Navigation size={18} color={T.warmWhite} aria-hidden />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: F.display,
                    fontSize: 18,
                    fontWeight: 500,
                    lineHeight: 1.15,
                    color: T.warmWhite,
                  }}
                >
                  {continueLabel}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(250,246,239,0.78)' }}>
                  {t('home.cta.continueHint')}
                </p>
              </div>
            </DashCard>

            <DashCard
              onClick={() => void handleStartFromHere()}
              testId="home-start-here"
              style={{ opacity: geoBusy ? 0.7 : 1 }}
            >
              <MapPinned size={16} color={T.actIV} aria-hidden />
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 13,
                  fontWeight: 650,
                  lineHeight: 1.25,
                  color: T.warmWhite,
                }}
              >
                {geoBusy ? t('home.cta.locating') : t('home.cta.startHere')}
              </p>
            </DashCard>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <ActionTile
            icon={Settings}
            label={t('home.actions.settings')}
            onClick={openSettings}
            testId="home-quick-settings"
            accent={T.ember}
          />
          <ActionTile
            icon={BookOpen}
            label={t('home.actions.tutorial')}
            onClick={handleRewatchTutorial}
            testId="home-quick-tutorial"
            accent={T.actVI}
          />
          <ActionTile
            icon={HelpCircle}
            label={t('home.actions.support')}
            onClick={() => setSupportOpen(true)}
            testId="home-quick-support"
            accent={T.actV}
          />
          <ActionTile
            icon={ListTree}
            label={t('home.actions.roadmap')}
            onClick={() => navigate('/tour')}
            testId="home-quick-roadmap"
            accent={T.actII}
          />
        </div>
      </div>

      <HomeSupportSheet open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
