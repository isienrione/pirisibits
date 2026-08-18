import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CONTEXT_INTERESTS,
  TIME_BUDGETS,
} from '../../content/rome/heroRecommendationMeta.js'
import { completeNativeContext } from '../../lib/guestSession.js'
import { getLocationFix, LOCATION_STATUS } from '../../lib/locationAccess.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'

const MAX_INTERESTS = 3

export default function NativeContextFlow() {
  const t = useT()
  const navigate = useNavigate()
  const [step, setStep] = useState('interests')
  const [interestIds, setInterestIds] = useState([])
  const [surpriseMe, setSurpriseMe] = useState(false)
  const [timeBudgetId, setTimeBudgetId] = useState(null)
  const [locationPhase, setLocationPhase] = useState('primer')

  const toggleInterest = (id) => {
    setSurpriseMe(false)
    setInterestIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_INTERESTS) return current
      return [...current, id]
    })
  }

  const finish = (locationStatus, lastPosition) => {
    completeNativeContext({
      interestIds: surpriseMe ? [] : interestIds,
      surpriseMe,
      timeBudgetId,
      locationStatus,
      lastPosition,
    })
    track(TRACK_EVENTS.CONTEXT_COMPLETED, {
      interests: surpriseMe ? ['surprise'] : interestIds,
      time_budget: timeBudgetId,
      location_status: locationStatus,
    })
    navigate('/home', { replace: true })
  }

  const requestLocation = async () => {
    setLocationPhase('loading')
    const result = await getLocationFix({ timeoutMs: 12000 })
    if (result.status === LOCATION_STATUS.SUCCESS) {
      setLocationPhase('success')
      finish('granted', result.position)
      return
    }
    const status =
      result.status === LOCATION_STATUS.DENIED
        ? 'denied'
        : result.status === LOCATION_STATUS.TIMEOUT
          ? 'timeout'
          : 'unavailable'
    finish(status, null)
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

      {step === 'interests' ? (
        <>
          <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '18px 0 8px' }}>
            {t('native.context.interests.title')}
          </h1>
          <p style={{ margin: '0 0 22px', color: T.muted, lineHeight: 1.45 }}>
            {t('native.context.interests.body')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
            {CONTEXT_INTERESTS.map((interest) => {
              const selected = interestIds.includes(interest.id)
              return (
                <button
                  key={interest.id}
                  type="button"
                  data-testid={`native-context-interest-${interest.id}`}
                  aria-pressed={selected}
                  onClick={() => toggleInterest(interest.id)}
                  style={{
                    minHeight: 48,
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: selected ? `1.5px solid ${T.gold}` : '1.5px solid rgba(250,246,239,0.16)',
                    background: selected ? 'rgba(212,175,55,0.14)' : 'rgba(250,246,239,0.04)',
                    color: T.bone,
                    fontFamily: F.body,
                    fontSize: 16,
                  }}
                >
                  {t(`native.context.interest.${interest.id}`)}
                </button>
              )
            })}
            <button
              type="button"
              data-testid="native-context-surprise"
              aria-pressed={surpriseMe}
              onClick={() => {
                setSurpriseMe(true)
                setInterestIds([])
              }}
              style={{
                minHeight: 48,
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 14,
                border: surpriseMe ? `1.5px solid ${T.gold}` : '1.5px solid rgba(250,246,239,0.16)',
                background: surpriseMe ? 'rgba(212,175,55,0.14)' : 'transparent',
                color: T.bone,
                fontFamily: F.body,
                fontSize: 16,
              }}
            >
              {t('native.context.surprise')}
            </button>
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-interests-continue"
            disabled={!surpriseMe && interestIds.length < 1}
            onClick={() => setStep('time')}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
        </>
      ) : null}

      {step === 'time' ? (
        <>
          <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '18px 0 8px' }}>
            {t('native.context.time.title')}
          </h1>
          <p style={{ margin: '0 0 22px', color: T.muted, lineHeight: 1.45 }}>
            {t('native.context.time.body')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {TIME_BUDGETS.map((budget) => {
              const selected = timeBudgetId === budget.id
              return (
                <button
                  key={budget.id}
                  type="button"
                  data-testid={`native-context-time-${budget.id}`}
                  aria-pressed={selected}
                  onClick={() => setTimeBudgetId(budget.id)}
                  style={{
                    minHeight: 48,
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: selected ? `1.5px solid ${T.gold}` : '1.5px solid rgba(250,246,239,0.16)',
                    background: selected ? 'rgba(212,175,55,0.14)' : 'rgba(250,246,239,0.04)',
                    color: T.bone,
                    fontFamily: F.body,
                    fontSize: 16,
                  }}
                >
                  {budget.label}
                </button>
              )
            })}
          </div>
          <PrimaryButton
            color={T.gold}
            data-testid="native-context-time-continue"
            disabled={!timeBudgetId}
            onClick={() => setStep('location')}
            style={{ marginTop: 16, minHeight: 48 }}
          >
            {t('native.context.continue')}
          </PrimaryButton>
        </>
      ) : null}

      {step === 'location' ? (
        <>
          <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '18px 0 8px' }}>
            {t('native.context.location.title')}
          </h1>
          <p style={{ margin: '0 0 12px', color: T.muted, lineHeight: 1.5 }}>
            {t('native.context.location.body')}
          </p>
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
            onClick={() => finish('denied', null)}
            style={{ marginTop: 10, minHeight: 48 }}
          >
            {t('native.context.location.skip')}
          </GhostButton>
        </>
      ) : null}
    </div>
  )
}
