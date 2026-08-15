import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, HelpCircle, Map as MapIcon, MapPinned, Navigation, Route, Settings } from 'lucide-react'
import { T, F, SHELL_TAB_BAR_INSET } from './tokens.js'
import HomeMapPeek from './ui/HomeMapPeek.jsx'
import HomeProgressArc from './ui/HomeProgressArc.jsx'
import HomeSupportSheet from './ui/HomeSupportSheet.jsx'
import { LandingZoomableImageViewer } from '../landing/v4/LandingPackagePosterViewer.jsx'
import { getPackRoutePreview } from '../landing/packRoutePreview.js'
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

/** Soft Ancient Rome motif — columns + arch, decorative only. */
function RomeMotif() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 160"
      style={{
        position: 'absolute',
        right: -18,
        top: 36,
        width: 168,
        height: 122,
        opacity: 0.16,
        pointerEvents: 'none',
      }}
    >
      <path
        d="M40 140 V58 M70 140 V58 M40 58 H70 M30 52 H80"
        fill="none"
        stroke={T.actIV}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M100 140 V72 M160 140 V72 M100 72 Q130 28 160 72"
        fill="none"
        stroke={T.actVI}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="186" cy="48" r="16" fill="none" stroke={T.actIII} strokeWidth="4" />
      <path d="M186 36 V48 L196 48" fill="none" stroke={T.actV} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

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
        minHeight: 78,
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          display: 'grid',
          placeItems: 'center',
          background: `${accent}22`,
          color: accent,
        }}
      >
        <Icon size={16} strokeWidth={1.9} aria-hidden />
      </span>
      <span
        style={{
          fontSize: 12,
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
  const [routeOpen, setRouteOpen] = useState(false)

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
          color: '#8A8174',
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
        <p style={{ color: '#8A8174' }}>{error?.message ?? t('home.unavailable')}</p>
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
        background: `
          radial-gradient(90% 60% at 100% 0%, rgba(78,155,143,0.16) 0%, transparent 55%),
          radial-gradient(70% 50% at 0% 100%, rgba(177,74,110,0.12) 0%, transparent 50%),
          radial-gradient(50% 40% at 80% 80%, rgba(232,161,60,0.12) 0%, transparent 45%),
          linear-gradient(180deg, #FFFEFA 0%, ${T.bone} 48%, #F4EEE4 100%)
        `,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: F.body,
        color: T.ink,
        overflow: 'hidden',
        paddingBottom: SHELL_TAB_BAR_INSET,
        position: 'relative',
      }}
    >
      <RomeMotif />

      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 16px 10px',
          paddingTop: 'max(18px, calc(env(safe-area-inset-top) + 12px))',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          <div style={{ paddingTop: 4 }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="9.5" stroke={T.actIV} strokeWidth="1.5" />
              <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={T.actIII} strokeWidth="1.5" />
              <line x1="11" y1="7" x2="18" y2="15" stroke={T.actV} strokeWidth="1" opacity="0.7" />
              <line x1="11" y1="7" x2="4" y2="15" stroke={T.actVI} strokeWidth="1" opacity="0.7" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 650,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: T.actIV,
              }}
            >
              {t('home.tourLabel')}
            </p>
            <h1
              style={{
                margin: '4px 0 0',
                fontFamily: F.display,
                fontSize: 24,
                fontWeight: 450,
                lineHeight: 1.1,
                color: T.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {packTitle}
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: '#8A8174',
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
            border: `1px solid ${T.limestone}`,
            background: '#FFFEFA',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: T.ink,
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
          padding: '6px 16px 10px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
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
            onClick={() => navigate('/map')}
            testId="home-map"
            ariaLabel={t('home.map.openAria')}
            style={{
              padding: 0,
              overflow: 'hidden',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, minHeight: 110, position: 'relative', pointerEvents: 'none' }}>
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

          <div style={{ display: 'grid', gap: 10, minHeight: 0 }}>
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
                size={18}
                color={T.warmWhite}
                aria-hidden
                style={{ alignSelf: 'center' }}
              />
              <div style={{ textAlign: 'center' }}>
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
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(250,246,239,0.82)' }}>
                  {t('home.cta.continueHint')}
                </p>
              </div>
            </DashCard>

            <DashCard
              onClick={() => void handleStartFromHere()}
              testId="home-start-here"
              style={{
                opacity: geoBusy ? 0.7 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  display: 'grid',
                  placeItems: 'center',
                  background: `${T.actVI}22`,
                  color: T.actVI,
                }}
              >
                <MapPinned size={15} aria-hidden />
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 650,
                  lineHeight: 1.25,
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
            gap: 8,
            flexShrink: 0,
          }}
        >
          <ActionTile
            icon={Settings}
            label={t('home.actions.settings')}
            onClick={openSettings}
            testId="home-quick-settings"
            accent={T.actIII}
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
          onClose={() => setRouteOpen(false)}
        />
      ) : null}
    </div>
  )
}
