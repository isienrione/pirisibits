import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  HelpCircle,
  Map as MapIcon,
  MapPinned,
  Navigation,
  RotateCcw,
  Route,
  Settings,
} from 'lucide-react'
import ChronoWalkLogo from '../components/ui/ChronoWalkLogo.jsx'
import { T, F } from './tokens.js'
import HomeMapPeek from './ui/HomeMapPeek.jsx'
import HomeProgressArc from './ui/HomeProgressArc.jsx'
import HomeResetConfirmSheet from './ui/HomeResetConfirmSheet.jsx'
import HomeResumeStopSheet from './ui/HomeResumeStopSheet.jsx'
import HomeStopHero from './ui/HomeStopHero.jsx'
import HomeSupportSheet from './ui/HomeSupportSheet.jsx'
import HomeTutorialSheet from './ui/HomeTutorialSheet.jsx'
import { LandingZoomableImageViewer } from '../landing/v4/LandingPackagePosterViewer.jsx'
import { getPackRoutePreview } from '../landing/packRoutePreview.js'
import { useSettingsSheet } from './context/SettingsSheetContext.jsx'
import { useSharedWalkGuard } from './context/SharedWalkGuardContext.jsx'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { useJourneyStep } from '../hooks/useJourneyStep.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { packTitleForPurchasedTier } from '../lib/appEntry.js'
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

function DashCard({ children, onClick, testId, ariaLabel, style = {} }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      data-testid={testId}
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        border: `1px solid ${T.limestone}`,
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 18,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF8F2 100%)',
        boxShadow: '0 8px 20px rgba(26, 22, 18, 0.05)',
        color: T.ink,
        fontFamily: F.body,
        padding: 14,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

function ActionTile({ icon: Icon, label, onClick, testId, ariaLabel, accent = T.ember }) {
  return (
    <DashCard
      onClick={onClick}
      testId={testId}
      ariaLabel={ariaLabel}
      style={{
        minHeight: 72,
        padding: '10px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        textAlign: 'center',
      }}
    >
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
      <span
        style={{
          fontSize: 11,
          fontWeight: 650,
          lineHeight: 1.15,
          color: T.ink,
        }}
      >
        {label}
      </span>
    </DashCard>
  )
}

function resolveHomeWaypoint(step, currentAct, acts) {
  if (step?.type === 'waypoint' && step.record) return step.record
  if (step?.type === 'transit' && step.targetWaypoint) return step.targetWaypoint
  const currentStop = currentAct?.stops?.find((stop) => stop.status === 'current')
  if (currentStop?.waypoint) return currentStop.waypoint
  const nextStop = currentAct?.stops?.find(
    (stop) => stop.status === 'upcoming' || stop.status === 'current',
  )
  if (nextStop?.waypoint) return nextStop.waypoint
  for (const act of acts ?? []) {
    const stop = act.stops?.find((entry) => entry.waypoint)
    if (stop?.waypoint) return stop.waypoint
  }
  return null
}

export default function RedesignHomeScreen() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { openSettings } = useSettingsSheet()
  const { requestJumpToWaypoint } = useSharedWalkGuard()
  const { state, context, begin, reset, openAtSequence } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  )
  const [geoBusy, setGeoBusy] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [routeOpen, setRouteOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [startOverOpen, setStartOverOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)

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
  const routePreview = useMemo(() => getPackRoutePreview(context.pace), [context.pace])

  const journeyActive =
    state !== JOURNEY_STATES.IDLE &&
    state !== JOURNEY_STATES.COMPLETE &&
    state !== JOURNEY_STATES.DAY_COMPLETE

  const currentWaypoint = useMemo(
    () => resolveHomeWaypoint(step, currentAct, acts),
    [step, currentAct, acts],
  )

  const currentStopTitle = useMemo(
    () => (currentWaypoint ? titleForWaypoint(currentWaypoint) : null),
    [currentWaypoint],
  )

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
    const hasProgress =
      (context.completedWaypointIds?.length ?? 0) > 0 ||
      (context.completedTransitIds?.length ?? 0) > 0 ||
      (context.currentSequenceIndex ?? 0) > 0

    if (hasProgress) {
      openAtSequence({
        pace: context.pace,
        path: context.path,
        sequenceIndex,
        customWaypointIds: context.customWaypointIds,
      })
    } else {
      begin({
        pace: context.pace,
        path: context.path,
        sequenceIndex,
        customWaypointIds: context.customWaypointIds,
      })
    }
    navigate('/journey')
  }, [begin, context, journeyActive, manifest, navigate, openAtSequence])

  const handleOpenResumeStop = useCallback(() => {
    if (!manifest) return
    setResumeOpen(true)
  }, [manifest])

  const handleChooseResumeStop = useCallback(
    async (waypointId) => {
      if (!manifest || !waypointId || geoBusy) return
      setGeoBusy(true)
      const jumped = await requestJumpToWaypoint(manifest, waypointId, context, state)
      setGeoBusy(false)
      if (jumped) {
        setResumeOpen(false)
        navigate('/journey')
      }
    },
    [context, geoBusy, manifest, navigate, requestJumpToWaypoint, state],
  )

  const handleRouteHotspot = useCallback(
    async (spot) => {
      const waypointId = spot?.waypointId
      if (!manifest || !waypointId || geoBusy) return
      setGeoBusy(true)
      const jumped = await requestJumpToWaypoint(manifest, waypointId, context, state)
      setGeoBusy(false)
      if (jumped) {
        setRouteOpen(false)
        navigate('/journey')
        return
      }
      // Card-only stickers (e.g. Circus Maximus View) are not in the walk sequence —
      // open the stop card so travelers can still hear the chapter.
      setRouteOpen(false)
      navigate(`/journal/${waypointId}`)
    },
    [context, geoBusy, manifest, navigate, requestJumpToWaypoint, state],
  )

  const handleRewatchTutorial = useCallback(() => {
    setTutorialOpen(true)
  }, [])

  const handleConfirmStartOver = useCallback(() => {
    setStartOverOpen(false)
    reset()
    begin({
      pace: context.pace,
      path: context.path,
      sequenceIndex: 0,
      customWaypointIds: context.customWaypointIds,
    })
    navigate('/journey')
  }, [begin, context.customWaypointIds, context.pace, context.path, navigate, reset])

  const openRouteDrawing = useCallback(() => {
    if (routePreview?.cardImage) {
      setRouteOpen(true)
      return
    }
    navigate('/tour')
  }, [navigate, routePreview])

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
            background: T.actIV,
            color: T.warmWhite,
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
        background: T.bone,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: F.body,
        color: T.ink,
        overflow: 'hidden',
        // Companion frame already reserves the tab bar via --wc-shell-tab-inset.
        position: 'relative',
      }}
    >
      <HomeStopHero waypoint={currentWaypoint}>
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 16px 10px',
            paddingTop: 'max(18px, calc(env(safe-area-inset-top) + 12px))',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
            <div style={{ paddingTop: 2, flexShrink: 0 }}>
              <ChronoWalkLogo size={28} variant="dark" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 650,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(250,246,239,0.88)',
                }}
              >
                {t('home.tourLabel')}
              </p>
              <h1
                style={{
                  margin: '4px 0 0',
                  fontFamily: F.display,
                  fontSize: 26,
                  fontWeight: 450,
                  lineHeight: 1.1,
                  color: T.warmWhite,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 1px 12px rgba(11,11,13,0.35)',
                }}
              >
                {packTitle}
              </h1>
              <p
                style={{
                  margin: '5px 0 0',
                  fontSize: 12,
                  color: 'rgba(250,246,239,0.78)',
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
              marginTop: 2,
              borderRadius: 999,
              border: '1px solid rgba(250,246,239,0.35)',
              background: 'rgba(11,11,13,0.28)',
              backdropFilter: 'blur(8px)',
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
      </HomeStopHero>

      <div
        data-testid="home-widgets"
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          padding: '0 14px 10px',
          marginTop: -18,
          position: 'relative',
          zIndex: 2,
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
            height: 152,
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: 9,
          }}
        >
          <DashCard
            onClick={() => navigate('/map')}
            testId="home-map"
            ariaLabel={t('home.map.openAria')}
            style={{
              padding: 0,
              overflow: 'hidden',
              minHeight: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, minHeight: 0, position: 'relative', pointerEvents: 'none' }}>
              <HomeMapPeek manifest={manifest} context={context} />
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 10,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'rgba(255, 254, 250, 0.92)',
                  color: T.actIV,
                  border: `1px solid color-mix(in srgb, ${T.actIV} 35%, transparent)`,
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 650,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <MapIcon size={11} aria-hidden />
                {t('home.map.badge')}
              </div>
            </div>
          </DashCard>

          <div style={{ display: 'grid', gap: 9, minHeight: 0, height: '100%' }}>
            <DashCard
              onClick={handleContinue}
              testId="home-continue"
              style={{
                border: 'none',
                background: `linear-gradient(160deg, ${T.actIV} 0%, #3F857C 55%, ${T.actII} 100%)`,
                boxShadow: '0 10px 24px rgba(78, 155, 143, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 0,
                textAlign: 'center',
              }}
            >
              <Navigation
                size={17}
                color={T.warmWhite}
                aria-hidden
                style={{ alignSelf: 'center' }}
              />
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: F.display,
                    fontSize: continueLabel.length > 14 ? 14 : 17,
                    fontWeight: 500,
                    lineHeight: 1.15,
                    color: T.warmWhite,
                  }}
                >
                  {continueLabel}
                </p>
                {continueLabel === t('home.cta.beginTour') ? (
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'rgba(250,246,239,0.82)' }}>
                    {t('home.cta.continueHint')}
                  </p>
                ) : null}
              </div>
            </DashCard>

            <DashCard
              onClick={handleOpenResumeStop}
              testId="home-start-here"
              style={{
                opacity: geoBusy ? 0.7 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 8,
                padding: '10px 8px',
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  display: 'grid',
                  placeItems: 'center',
                  background: `${T.actVI}22`,
                  color: T.actVI,
                }}
              >
                <MapPinned size={14} aria-hidden />
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 650,
                  lineHeight: 1.2,
                  color: T.ink,
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
            gap: 7,
          }}
        >
          <ActionTile
            icon={RotateCcw}
            label={t('home.actions.startOver')}
            onClick={() => setStartOverOpen(true)}
            testId="home-quick-start-over"
            ariaLabel={t('home.actions.startOverAria')}
            accent={T.actI}
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
            icon={Route}
            label={t('home.actions.route')}
            onClick={openRouteDrawing}
            testId="home-quick-route"
            ariaLabel={t('home.actions.routeAria', {
              name: routePreview?.name ?? packTitle,
            })}
            accent={T.actII}
          />
        </div>
      </div>

      <HomeSupportSheet open={supportOpen} onClose={() => setSupportOpen(false)} />
      <HomeTutorialSheet open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <HomeResumeStopSheet
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        manifest={manifest}
        context={context}
        onChooseStop={(waypointId) => void handleChooseResumeStop(waypointId)}
      />
      <HomeResetConfirmSheet
        open={startOverOpen}
        onClose={() => setStartOverOpen(false)}
        onConfirm={handleConfirmStartOver}
        title={t('home.startOver.title')}
        body={t('home.startOver.body')}
        confirmLabel={t('home.startOver.confirm')}
        testId="home-start-over-confirm"
      />

      {routePreview?.cardImage ? (
        <LandingZoomableImageViewer
          open={routeOpen}
          title={t('home.routeViewer.title', { name: routePreview.name ?? packTitle })}
          src={routePreview.cardImage}
          width={routePreview.cardWidth}
          height={routePreview.cardHeight}
          alt=""
          accent={routePreview.theme ?? 'eterna'}
          hint={t('home.routeViewer.hint')}
          hotspots={routePreview.hotspots}
          onHotspotSelect={(spot) => void handleRouteHotspot(spot)}
          onClose={() => setRouteOpen(false)}
        />
      ) : null}
    </div>
  )
}
