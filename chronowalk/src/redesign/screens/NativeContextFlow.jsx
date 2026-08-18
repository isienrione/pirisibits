/**
 * Progressive Travel Context onboarding — not a single questionnaire.
 *
 * Required first-run (~60–90s): interests → (optional refine) → style →
 * mobility/urban comfort → trip horizon (+ optional one anchor) →
 * availableTimeNow → location. Meal/end-of-session intent is session
 * context and is asked later, not here.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ANCHOR_TYPES,
  CONTEXT_INTERESTS,
  TIME_BUDGETS,
  TRIP_HORIZONS,
  URBAN_COMFORT,
  inferResidency,
  inferTimeOfDay,
  subInterestsForParents,
} from '../../lib/travelContext/index.js'
import { completeNativeContext } from '../../lib/guestSession.js'
import { getLocationFix, LOCATION_STATUS } from '../../lib/locationAccess.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'

const MAX_INTERESTS = 4
const REQUIRED_STEPS = ['interests', 'style', 'mobility', 'trip', 'time', 'location']

const chipBase = {
  minHeight: 48,
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: 14,
  fontFamily: F.body,
  fontSize: 15,
  color: T.bone,
}

function selectedStyle(on) {
  return {
    border: on ? `1.5px solid ${T.gold}` : '1.5px solid rgba(250,246,239,0.16)',
    background: on ? 'rgba(212,175,55,0.14)' : 'rgba(250,246,239,0.04)',
  }
}

function Choice({ testId, selected, onClick, children, style }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={selected}
      onClick={onClick}
      style={{ ...chipBase, ...selectedStyle(selected), ...style }}
    >
      {children}
    </button>
  )
}

function Progress({ step, t }) {
  const index = REQUIRED_STEPS.indexOf(step)
  const label =
    index === -1 ? t('native.context.progress.optional') : t('native.context.progress', { current: index + 1, total: REQUIRED_STEPS.length })
  return (
    <p
      data-testid="native-context-progress"
      style={{
        margin: '10px 0 0',
        fontFamily: F.body,
        fontSize: 12,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: T.muted,
      }}
    >
      {label}
    </p>
  )
}

function Heading({ title, body }) {
  return (
    <>
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: '14px 0 8px', lineHeight: 1.15 }}>
        {title}
      </h1>
      {body ? (
        <p style={{ margin: '0 0 18px', color: T.muted, lineHeight: 1.45 }}>{body}</p>
      ) : null}
    </>
  )
}

export default function NativeContextFlow() {
  const t = useT()
  const navigate = useNavigate()
  const [step, setStep] = useState('interests')
  const [interestIds, setInterestIds] = useState([])
  const [surpriseMe, setSurpriseMe] = useState(false)
  const [avoidSubInterestIds, setAvoidSubInterestIds] = useState([])
  const [explorationStyle, setExplorationStyle] = useState('mix')
  const [iconicVsHidden, setIconicVsHidden] = useState('mix')
  const [depthVsBreadth, setDepthVsBreadth] = useState('mix')
  const [walkingTolerance, setWalkingTolerance] = useState('moderate')
  const [transportModes, setTransportModes] = useState(['walk', 'transit'])
  const [urbanComfort, setUrbanComfort] = useState('lively')
  const [tripHorizon, setTripHorizon] = useState(null)
  const [showAnchorForm, setShowAnchorForm] = useState(false)
  const [anchorType, setAnchorType] = useState('ticket')
  const [anchorTitle, setAnchorTitle] = useState('')
  const [anchor, setAnchor] = useState(null)
  const [availableTimeNow, setAvailableTimeNow] = useState(null)
  const [locationPhase, setLocationPhase] = useState('primer')

  const refineOptions = useMemo(
    () => (surpriseMe ? [] : subInterestsForParents(interestIds)),
    [interestIds, surpriseMe],
  )

  const toggleInterest = (id) => {
    setSurpriseMe(false)
    setInterestIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_INTERESTS) return current
      return [...current, id]
    })
  }

  const toggleAvoidSub = (id) => {
    setAvoidSubInterestIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const toggleMode = (id) => {
    setTransportModes((current) => {
      if (current.includes(id)) {
        const next = current.filter((item) => item !== id)
        return next.length ? next : current
      }
      return [...current, id]
    })
  }

  const goAfterInterests = () => {
    const options = surpriseMe ? [] : subInterestsForParents(interestIds)
    setStep(options.length > 0 ? 'refine' : 'style')
  }

  const persistAndFinish = (locationStatus, lastPosition) => {
    const anchors = anchor ? [anchor] : []
    completeNativeContext({
      traveler: {
        positiveInterestIds: surpriseMe ? [] : interestIds,
        surpriseMe,
        avoidSubInterestIds,
        explorationStyle,
        iconicVsHidden,
        depthVsBreadth,
        urbanComfort,
        walkingTolerance,
        transportModes,
      },
      trip: {
        cityId: 'rome',
        tripHorizon,
        residency: inferResidency(tripHorizon, null),
        anchors,
      },
      session: {
        availableTimeNow,
        locationStatus,
        location: lastPosition,
        timeOfDay: inferTimeOfDay(),
      },
    })
    track(TRACK_EVENTS.CONTEXT_COMPLETED, {
      interests: surpriseMe ? ['surprise'] : interestIds,
      time_budget: availableTimeNow,
      trip_horizon: tripHorizon,
      location_status: locationStatus,
    })
    navigate('/home', { replace: true })
  }

  const requestLocation = async () => {
    setLocationPhase('loading')
    const result = await getLocationFix({ timeoutMs: 12000 })
    if (result.status === LOCATION_STATUS.SUCCESS) {
      setLocationPhase('success')
      persistAndFinish('granted', result.position)
      return
    }
    const status =
      result.status === LOCATION_STATUS.DENIED
        ? 'denied'
        : result.status === LOCATION_STATUS.TIMEOUT
          ? 'timeout'
          : 'unavailable'
    persistAndFinish(status, null)
  }

  const saveDraftAnchor = () => {
    const title = anchorTitle.trim()
    if (!title) return
    setAnchor({
      id: `anchor_${Date.now().toString(36)}`,
      type: anchorType,
      title,
    })
    setShowAnchorForm(false)
  }

  return (
    <div
      data-testid="native-context"
      data-step={step}
      style={{
        minHeight: '100%',
        height: '100dvh',
        background: T.obsidian,
        color: T.bone,
        boxSizing: 'border-box',
        padding:
          'max(28px, calc(env(safe-area-inset-top) + 16px)) 24px max(24px, calc(env(safe-area-inset-bottom) + 12px))',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: F.body,
          fontSize: 12,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: T.muted,
        }}
      >
        ChronoWalk
      </p>
      <Progress step={step} t={t} />

      {step === 'interests' ? (
        <>
          <Heading title={t('native.context.interests.title')} body={t('native.context.interests.body')} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {CONTEXT_INTERESTS.map((interest) => {
              const selected = interestIds.includes(interest.id)
              return (
                <Choice
                  key={interest.id}
                  testId={`native-context-interest-${interest.id}`}
                  selected={selected}
                  onClick={() => toggleInterest(interest.id)}
                >
                  {t(`native.context.interest.${interest.id}`)}
                </Choice>
              )
            })}
            <Choice
              testId="native-context-surprise"
              selected={surpriseMe}
              onClick={() => {
                setSurpriseMe(true)
                setInterestIds([])
              }}
              style={{ gridColumn: '1 / -1' }}
            >
              {t('native.context.surprise')}
            </Choice>
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-interests-continue"
            disabled={!surpriseMe && interestIds.length < 1}
            onClick={goAfterInterests}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
        </>
      ) : null}

      {step === 'refine' ? (
        <>
          <Heading title={t('native.context.refine.title')} body={t('native.context.refine.body')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
            {refineOptions.map((option) => {
              const selected = avoidSubInterestIds.includes(option.id)
              return (
                <Choice
                  key={option.id}
                  testId={`native-context-refine-${option.id}`}
                  selected={selected}
                  onClick={() => toggleAvoidSub(option.id)}
                >
                  {t('native.context.refine.less', { label: t(`native.context.sub.${option.id}`) })}
                </Choice>
              )
            })}
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-refine-continue"
            onClick={() => setStep('style')}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
          <GhostButton
            data-testid="native-context-refine-skip"
            onClick={() => {
              setAvoidSubInterestIds([])
              setStep('style')
            }}
            style={{ marginTop: 10, minHeight: 48 }}
          >
            {t('native.context.skip')}
          </GhostButton>
        </>
      ) : null}

      {step === 'style' ? (
        <>
          <Heading title={t('native.context.style.title')} body={t('native.context.style.body')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, overflowY: 'auto' }}>
            <Segmented
              label={t('native.context.style.exploration')}
              value={explorationStyle}
              onChange={setExplorationStyle}
              options={[
                { id: 'structured', label: t('native.context.style.structured') },
                { id: 'mix', label: t('native.context.style.mix') },
                { id: 'spontaneous', label: t('native.context.style.spontaneous') },
              ]}
              testPrefix="native-context-style-exploration"
            />
            <Segmented
              label={t('native.context.style.iconicRow')}
              value={iconicVsHidden}
              onChange={setIconicVsHidden}
              options={[
                { id: 'iconic', label: t('native.context.style.iconic') },
                { id: 'mix', label: t('native.context.style.mix') },
                { id: 'hidden', label: t('native.context.style.hidden') },
              ]}
              testPrefix="native-context-style-iconic"
            />
            <Segmented
              label={t('native.context.style.depthRow')}
              value={depthVsBreadth}
              onChange={setDepthVsBreadth}
              options={[
                { id: 'depth', label: t('native.context.style.depth') },
                { id: 'mix', label: t('native.context.style.mix') },
                { id: 'breadth', label: t('native.context.style.breadth') },
              ]}
              testPrefix="native-context-style-depth"
            />
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-style-continue"
            onClick={() => setStep('mobility')}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
        </>
      ) : null}

      {step === 'mobility' ? (
        <>
          <Heading title={t('native.context.mobility.title')} body={t('native.context.mobility.body')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
            <p style={sectionLabel}>{t('native.context.mobility.walking')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['short', 'moderate', 'long'].map((id) => (
                <Choice
                  key={id}
                  testId={`native-context-walk-${id}`}
                  selected={walkingTolerance === id}
                  onClick={() => setWalkingTolerance(id)}
                  style={{ flex: 1, textAlign: 'center', minHeight: 44, padding: '10px 8px', fontSize: 14 }}
                >
                  {t(`native.context.mobility.walk.${id}`)}
                </Choice>
              ))}
            </div>
            <p style={sectionLabel}>{t('native.context.mobility.modes')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['walk', 'native.context.mobility.walk'],
                ['transit', 'native.context.mobility.transit'],
                ['rideshare', 'native.context.mobility.rideshare'],
              ].map(([id, key]) => (
                <Choice
                  key={id}
                  testId={`native-context-mode-${id}`}
                  selected={transportModes.includes(id)}
                  onClick={() => toggleMode(id)}
                >
                  {t(key)}
                </Choice>
              ))}
            </div>
            <p style={sectionLabel}>{t('native.context.urban.title')}</p>
            <p style={{ margin: '-4px 0 0', color: T.muted, fontSize: 13, lineHeight: 1.4 }}>
              {t('native.context.urban.disclaimer')}
            </p>
            {URBAN_COMFORT.map((id) => (
              <Choice
                key={id}
                testId={`native-context-urban-${id}`}
                selected={urbanComfort === id}
                onClick={() => setUrbanComfort(id)}
              >
                {t(`native.context.urban.${id}`)}
              </Choice>
            ))}
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-mobility-continue"
            onClick={() => setStep('trip')}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
        </>
      ) : null}

      {step === 'trip' ? (
        <>
          <Heading title={t('native.context.trip.title')} body={t('native.context.trip.body')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
            {TRIP_HORIZONS.map((id) => (
              <Choice
                key={id}
                testId={`native-context-trip-horizon-${id}`}
                selected={tripHorizon === id}
                onClick={() => setTripHorizon(id)}
              >
                {t(`native.context.horizon.${id}`)}
              </Choice>
            ))}
            <p style={{ ...sectionLabel, marginTop: 12 }}>{t('native.context.plans.prompt')}</p>
            {anchor ? (
              <p data-testid="native-context-anchor-saved" style={{ margin: 0, color: T.gold }}>
                {anchor.title}
              </p>
            ) : null}
            {showAnchorForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ANCHOR_TYPES.map((id) => (
                    <Choice
                      key={id}
                      testId={`native-context-anchor-type-${id}`}
                      selected={anchorType === id}
                      onClick={() => setAnchorType(id)}
                      style={{ minHeight: 40, padding: '8px 12px', fontSize: 13 }}
                    >
                      {t(`native.context.plans.type.${id}`)}
                    </Choice>
                  ))}
                </div>
                <input
                  data-testid="native-context-anchor-title"
                  value={anchorTitle}
                  onChange={(event) => setAnchorTitle(event.target.value)}
                  placeholder={t('native.context.plans.titlePlaceholder')}
                  style={{
                    minHeight: 48,
                    borderRadius: 12,
                    border: '1.5px solid rgba(250,246,239,0.16)',
                    background: 'rgba(250,246,239,0.06)',
                    color: T.bone,
                    padding: '0 14px',
                    fontFamily: F.body,
                    fontSize: 15,
                  }}
                />
                <GhostButton data-testid="native-context-anchor-save" onClick={saveDraftAnchor} style={{ minHeight: 44 }}>
                  {t('native.context.plans.add')}
                </GhostButton>
              </div>
            ) : (
              <GhostButton
                data-testid="native-context-plans-add"
                onClick={() => setShowAnchorForm(true)}
                style={{ minHeight: 44 }}
              >
                {t('native.context.plans.add')}
              </GhostButton>
            )}
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-trip-continue"
            disabled={!tripHorizon}
            onClick={() => setStep('time')}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
        </>
      ) : null}

      {step === 'time' ? (
        <>
          <Heading title={t('native.context.time.title')} body={t('native.context.time.body')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
            {TIME_BUDGETS.map((budget) => {
              const selected = availableTimeNow === budget.id
              return (
                <Choice
                  key={budget.id}
                  testId={`native-context-time-${budget.id}`}
                  selected={selected}
                  onClick={() => setAvailableTimeNow(budget.id)}
                >
                  {t(`native.context.time.${budget.id}`)}
                </Choice>
              )
            })}
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-time-continue"
            disabled={!availableTimeNow}
            onClick={() => setStep('location')}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
        </>
      ) : null}

      {step === 'location' ? (
        <>
          <Heading title={t('native.context.location.title')} body={t('native.context.location.body')} />
          <p style={{ margin: '0 0 auto', color: 'rgba(250,246,239,0.7)', lineHeight: 1.5 }}>
            {t('native.context.location.note')}
          </p>
          {locationPhase === 'loading' ? (
            <p data-testid="native-context-location-loading" style={{ color: T.gold }}>
              {t('native.context.location.loading')}
            </p>
          ) : null}
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-location-continue"
            disabled={locationPhase === 'loading'}
            onClick={() => void requestLocation()}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.location.cta')}
          </PrimaryButton>
          <GhostButton
            data-testid="native-context-location-skip"
            disabled={locationPhase === 'loading'}
            onClick={() => persistAndFinish('denied', null)}
            style={{ marginTop: 10, minHeight: 48 }}
          >
            {t('native.context.location.skip')}
          </GhostButton>
        </>
      ) : null}
    </div>
  )
}

const sectionLabel = {
  margin: 0,
  fontFamily: F.body,
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: T.muted,
}

function Segmented({ label, value, onChange, options, testPrefix }) {
  return (
    <div>
      <p style={{ ...sectionLabel, marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((option) => (
          <Choice
            key={option.id}
            testId={`${testPrefix}-${option.id}`}
            selected={value === option.id}
            onClick={() => onChange(option.id)}
            style={{ flex: 1, textAlign: 'center', minHeight: 44, padding: '10px 6px', fontSize: 13 }}
          >
            {option.label}
          </Choice>
        ))}
      </div>
    </div>
  )
}
