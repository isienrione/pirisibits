import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { TravelerInterest, TravelerProfile } from '@chronowalk/domain'
import {
  Body,
  Cluster,
  EditorialLabel,
  InstrumentMetric,
  Meta,
  PaperRule,
  PhotoPlaceholder,
  PrimaryAction,
  RouteLine,
  Screen,
  Title,
} from '../design/primitives'
import { DensityProvider } from '../design/DensityProvider'
import { color, space, type } from '../design/tokens'
import { MapSurface } from '../map/MapSurface'
import { SCREEN_REGISTRY } from '../registry/screenInventory'
import { useActiveItem, useTraveler } from '../state/TravelerContext'
import type { ScreenId } from '../state/types'
import fixture from '../demo/generated/mobileFixture.json'
import { screenForTreatment } from '../experience/resolvers'
import { distanceMeters, shouldOfferArrival } from '../location/foregroundLocation'

function progress(step: number) {
  return `0${step} / 05`
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string
  selected?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  )
}

function DemoMark() {
  return <Meta>DEMO_ONLY · not a City Engine decision</Meta>
}

function profileFromDraft(onboarding: ReturnType<typeof useTraveler>['state']['onboarding']): TravelerProfile | null {
  if (!onboarding.interests?.length || !onboarding.explorationStyle || !onboarding.mobility || !onboarding.timeBudgetMin) {
    return null
  }
  return {
    interests: onboarding.interests,
    explorationStyle: onboarding.explorationStyle,
    mobility: onboarding.mobility,
    timeBudgetMin: onboarding.timeBudgetMin,
  }
}

function tokenFromEnv() {
  return process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? ''
}

export function WelcomeScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen tone="immersion" density={3}>
      <Cluster>
        <EditorialLabel inverted>ChronoWalk</EditorialLabel>
        <Title inverted>A city, composed for the hours you actually have.</Title>
        <Body inverted>
          Rome, from published stops. This draft does not claim a finished algorithm.
        </Body>
      </Cluster>
      <PrimaryAction label="Begin" onPress={() => dispatch({ type: 'setScreen', screen: 'A03' })} />
    </Screen>
  )
}

export function InterestsScreen() {
  const { state, dispatch } = useTraveler()
  const toggle = (interest: TravelerInterest) => {
    const current = new Set(state.onboarding.interests ?? [])
    if (current.has(interest)) current.delete(interest)
    else current.add(interest)
    dispatch({ type: 'patchOnboarding', patch: { interests: [...current] } })
  }
  return (
    <Screen density={2}>
      <EditorialLabel>{progress(1)}</EditorialLabel>
      <Title>What should the afternoon lean toward?</Title>
      <Choice
        label="Antiquity — stone, sequence, Forum"
        selected={state.onboarding.interests?.includes('antiquity')}
        onPress={() => toggle('antiquity')}
      />
      <Choice
        label="Living city — piazzas and water"
        selected={state.onboarding.interests?.includes('living-city')}
        onPress={() => toggle('living-city')}
      />
      <Choice
        label="The river"
        selected={state.onboarding.interests?.includes('river')}
        onPress={() => toggle('river')}
      />
      <PrimaryAction
        label="Continue"
        disabled={!state.onboarding.interests?.length}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A05' })}
      />
    </Screen>
  )
}

export function StyleScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={2}>
      <EditorialLabel>{progress(2)}</EditorialLabel>
      <Title>How do you like to move through a place?</Title>
      <Choice
        label="Linger"
        selected={state.onboarding.explorationStyle === 'linger'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { explorationStyle: 'linger' } })}
      />
      <Choice
        label="Cover ground"
        selected={state.onboarding.explorationStyle === 'cover-ground'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { explorationStyle: 'cover-ground' } })}
      />
      <Choice
        label="Mixed"
        selected={state.onboarding.explorationStyle === 'mixed'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { explorationStyle: 'mixed' } })}
      />
      <PrimaryAction
        label="Continue"
        disabled={!state.onboarding.explorationStyle}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A06' })}
      />
    </Screen>
  )
}

export function MobilityScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>{progress(3)}</EditorialLabel>
      <Title>Stairs, or not.</Title>
      <Body>The Capitoline climb is documented as stairs in the Rome transit copy.</Body>
      <Choice
        label="Walking is fine, including stairs"
        selected={state.onboarding.mobility === 'walking'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { mobility: 'walking' } })}
      />
      <Choice
        label="Keep stairs limited"
        selected={state.onboarding.mobility === 'limited-stairs'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { mobility: 'limited-stairs' } })}
      />
      <PrimaryAction
        label="Continue"
        disabled={!state.onboarding.mobility}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A07' })}
      />
    </Screen>
  )
}

export function TimeScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={2}>
      <EditorialLabel>{progress(4)}</EditorialLabel>
      <Title>How many minutes do you actually have?</Title>
      {([60, 120, 180] as const).map((budget) => (
        <Choice
          key={budget}
          label={`${budget} minutes`}
          selected={state.onboarding.timeBudgetMin === budget}
          onPress={() => dispatch({ type: 'patchOnboarding', patch: { timeBudgetMin: budget } })}
        />
      ))}
      <PrimaryAction
        label="Continue"
        disabled={!state.onboarding.timeBudgetMin}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A08' })}
      />
    </Screen>
  )
}

export function LocationPermissionScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>{progress(5)}</EditorialLabel>
      <Title>Location, only when you walk.</Title>
      <Body>
        ChronoWalk uses foreground location to notice arrival. You can plan the draft without it. Always / background is never requested.
      </Body>
      <PrimaryAction
        label="Allow while walking"
        onPress={() => {
          dispatch({ type: 'patchOnboarding', patch: { locationChoice: 'granted' } })
          dispatch({ type: 'setScreen', screen: 'A10' })
        }}
      />
      <PrimaryAction
        quiet
        label="Plan without location"
        onPress={() => {
          dispatch({ type: 'patchOnboarding', patch: { locationChoice: 'skipped' } })
          dispatch({ type: 'setScreen', screen: 'A10' })
        }}
      />
    </Screen>
  )
}

export function ReadyScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen density={2}>
      <EditorialLabel>Ready</EditorialLabel>
      <Title>We’ll assemble a published draft for those minutes.</Title>
      <DemoMark />
      <PrimaryAction label="Compose the afternoon" onPress={() => dispatch({ type: 'setScreen', screen: 'K01' })} />
    </Screen>
  )
}

export function ComposingScreen() {
  const { state, dispatch, service } = useTraveler()
  const fragments = ['Arena', 'Arch', 'Vault', 'Way']
  const go = () => {
    const profile = profileFromDraft(state.onboarding)
    if (!profile) return
    const permission = state.onboarding.locationChoice ?? 'skipped'
    const session = {
      cityId: 'rome' as const,
      locationMode: permission === 'granted' ? ('on-street' as const) : ('planning' as const),
      permission,
      startedAtIso: new Date().toISOString(),
    }
    dispatch({ type: 'setProfile', profile, session })
    dispatch({ type: 'setRoute', route: service.composeProposal(profile, session) })
    dispatch({ type: 'setScreen', screen: 'B01' })
  }
  return (
    <Screen density={2}>
      <EditorialLabel>Assembling</EditorialLabel>
      <Title>Fragments of a documented sequence.</Title>
      <View style={styles.fragments}>
        {fragments.map((fragment, index) => (
          <Text
            key={fragment}
            style={[
              styles.fragment,
              state.reduceMotion ? null : { opacity: 1, transform: [{ translateY: index * 2 }] },
            ]}
          >
            {fragment}
          </Text>
        ))}
      </View>
      <DemoMark />
      <PrimaryAction label="See the draft" onPress={go} />
    </Screen>
  )
}

export function HomeProposalScreen() {
  const { state, dispatch } = useTraveler()
  const route = state.route
  if (!route) return <Screen><Body>No draft yet.</Body></Screen>
  const hero = route.items.find((item) => item.treatment === 'hero') ?? route.items.find((item) => item.kind === 'experience')
  return (
    <Screen density={2}>
      <EditorialLabel>Today</EditorialLabel>
      <Title>{route.honestyLine}</Title>
      <PaperRule />
      <Body>{hero?.title}</Body>
      <Meta>
        {route.time.totalEstimatedMin} min estimated · {route.time.timeFit}
      </Meta>
      <DemoMark />
      <PrimaryAction label="Open the score" onPress={() => dispatch({ type: 'setScreen', screen: 'B04' })} />
      <PrimaryAction quiet label="Settings" onPress={() => dispatch({ type: 'setScreen', screen: 'I01' })} />
      <PrimaryAction quiet label="Why this" onPress={() => dispatch({ type: 'setScreen', screen: 'B05' })} />
      <PrimaryAction quiet label="Adjust" onPress={() => dispatch({ type: 'setScreen', screen: 'B06' })} />
    </Screen>
  )
}

export function HomeActiveScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>Active</EditorialLabel>
      <Title>{state.route?.title ?? 'No route'}</Title>
      <Body>A draft is in progress. Resume does not restart onboarding.</Body>
      <PrimaryAction label="Resume walking" onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
    </Screen>
  )
}

export function RouteScoreScreen() {
  const { state, dispatch } = useTraveler()
  const route = state.route
  if (!route) return null
  return (
    <Screen density={2}>
      <ScrollView contentContainerStyle={{ gap: space.s, paddingBottom: space.xl }}>
        <EditorialLabel>Score</EditorialLabel>
        <Title>{route.title}</Title>
        <Meta>
          target {route.time.targetBudgetMin} · experience {route.time.experienceMin} · walking{' '}
          {route.time.walkingMinComplete ? route.time.walkingMin : 'partial'} · buffer {route.time.bufferMin} · total{' '}
          {route.time.totalEstimatedMin} · Δ {route.time.budgetDeltaMin} · {route.time.timeFit}
        </Meta>
        {route.items.map((item) => {
          if (item.kind === 'walk') {
            return (
              <View key={item.id} style={styles.walkRow}>
                <RouteLine />
                <Meta>
                  Walk{item.walkingMin != null ? ` · ${item.walkingMin} min` : ' · minutes unpublished'}
                </Meta>
              </View>
            )
          }
          if (item.treatment === 'hero') {
            return (
              <View key={item.id} style={styles.heroBlock}>
                <EditorialLabel>Hero</EditorialLabel>
                <Title>{item.title}</Title>
                <Body>{item.lookCue}</Body>
              </View>
            )
          }
          if (item.treatment === 'mystery') {
            return (
              <View key={item.id} style={styles.lateral}>
                <EditorialLabel>Lateral</EditorialLabel>
                <Title>{item.spoilerSafeTitle}</Title>
                <Meta>Sealed until reveal</Meta>
              </View>
            )
          }
          if (item.treatment === 'micro') {
            return (
              <Text key={item.id} style={styles.micro}>
                {item.title}
                {item.experienceMin ? ` · ${item.experienceMin}m` : ''}
              </Text>
            )
          }
          return (
            <View key={item.id} style={styles.discovery}>
              <EditorialLabel>{item.treatment}</EditorialLabel>
              <Body>{item.title}</Body>
            </View>
          )
        })}
        <PrimaryAction label="Walk this draft" onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
        <PrimaryAction quiet label="Back" onPress={() => dispatch({ type: 'setScreen', screen: 'B01' })} />
      </ScrollView>
    </Screen>
  )
}

export function WhyThisScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={2}>
      <EditorialLabel>Why this</EditorialLabel>
      <Title>Reasons that exist in the sources.</Title>
      {(state.route?.why ?? []).map((reason) => (
        <View key={reason.id} style={styles.why}>
          <RouteLine />
          <Body>{reason.statement}</Body>
          <Meta>{reason.sourceId}</Meta>
        </View>
      ))}
      <PrimaryAction label="Back" onPress={() => dispatch({ type: 'setScreen', screen: 'B04' })} />
    </Screen>
  )
}

export function AdjustPlanScreen() {
  const { state, dispatch, service } = useTraveler()
  const apply = (budget: 60 | 120 | 180) => {
    if (!state.route) return
    const result = service.adaptRoute(state.route, { type: 'time', budget }, state.cursor)
    dispatch({ type: 'setRoute', route: result.route })
    dispatch({ type: 'setDelta', delta: result.delta })
    dispatch({ type: 'setScreen', screen: 'B04' })
  }
  return (
    <Screen density={1}>
      <EditorialLabel>Adjust</EditorialLabel>
      <Title>Change the minutes. The service answers.</Title>
      <Body>60, 120, and 180 are three published drafts. The screen does not mutate arrays itself.</Body>
      <PrimaryAction label="60 minutes" onPress={() => apply(60)} />
      <PrimaryAction label="120 minutes" onPress={() => apply(120)} />
      <PrimaryAction label="180 minutes" onPress={() => apply(180)} />
    </Screen>
  )
}

export function WalkInstrumentScreen() {
  const { state, dispatch } = useTraveler()
  const item = useActiveItem()
  const nextExperience = state.route?.items.slice(state.cursor).find((entry) => entry.kind === 'experience')
  const target = nextExperience?.coordinate
    ? { lat: nextExperience.coordinate.lat, lng: nextExperience.coordinate.lng, radiusM: nextExperience.arrivalRadiusM ?? 40 }
    : null
  const offer = shouldOfferArrival(state.location, target)
  const distance =
    state.session.locationMode === 'planning' || state.location.status !== 'ok' || !target
      ? null
      : distanceMeters(state.location, target)
  return (
    <DensityProvider value={0}>
      <Screen tone="immersion" density={0}>
        <EditorialLabel inverted>Walking</EditorialLabel>
        <InstrumentMetric kicker="Next" value={nextExperience?.spoilerSafeTitle ?? 'End of draft'} />
        {distance != null ? <InstrumentMetric kicker="Distance" value={String(distance)} unit="m" /> : null}
        <Meta inverted>
          {state.location.status === 'ok'
            ? 'Fix ok — not turn-by-turn'
            : state.location.status === 'weak'
              ? 'GPS weak'
              : state.location.status === 'denied'
                ? 'Location denied — continue from the list'
                : 'Planning / no live distance'}
        </Meta>
        {offer ? (
          <PrimaryAction label="You may have arrived" onPress={() => dispatch({ type: 'setScreen', screen: 'C03' })} />
        ) : (
          <PrimaryAction
            label="I’m here"
            onPress={() => {
              if (nextExperience) dispatch({ type: 'arrive', itemId: nextExperience.id })
              dispatch({ type: 'setScreen', screen: 'C03' })
            }}
          />
        )}
        <PrimaryAction quiet label="Route control" onPress={() => dispatch({ type: 'setScreen', screen: 'C04' })} />
      </Screen>
    </DensityProvider>
  )
}

export function ArrivalScreen() {
  const { dispatch, state } = useTraveler()
  const item = useActiveItem()
  const experience = item?.kind === 'experience' ? item : item
  return (
    <Screen density={1}>
      <EditorialLabel>Arrival</EditorialLabel>
      <Title>{experience?.spoilerSafeTitle ?? 'This place'}</Title>
      <Body>{experience?.arrivalLine ?? experience?.approachLine ?? 'Confirm before anything is told.'}</Body>
      <PrimaryAction
        label="Confirm I’m here"
        onPress={() => {
          if (experience) dispatch({ type: 'arrive', itemId: experience.id })
          dispatch({ type: 'confirmArrival' })
        }}
      />
      <PrimaryAction
        label="Begin the experience"
        disabled={!state.experience.confirmedArrival}
        onPress={() => {
          dispatch({ type: 'beginExperience' })
          const screen = screenForTreatment(experience?.treatment ?? 'discovery', false)
          dispatch({ type: 'setScreen', screen })
        }}
      />
      <Meta>Arrival and beginning are separate actions.</Meta>
    </Screen>
  )
}

export function RouteControlScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>Control</EditorialLabel>
      <Title>The instrument, not the catalog.</Title>
      <PrimaryAction label="List" onPress={() => dispatch({ type: 'setScreen', screen: 'C05' })} />
      <PrimaryAction label="Map" onPress={() => dispatch({ type: 'setScreen', screen: 'C06' })} />
      <PrimaryAction label="Skip a stop" onPress={() => dispatch({ type: 'setScreen', screen: 'E04' })} />
      <PrimaryAction quiet label="Back to walking" onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
      <PrimaryAction quiet label="Settings" onPress={() => dispatch({ type: 'setScreen', screen: 'I01' })} />
    </Screen>
  )
}

export function ActiveListScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <ScrollView>
        <EditorialLabel>Remainder</EditorialLabel>
        {(state.route?.items ?? []).map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => {
              dispatch({ type: 'setCursor', cursor: index })
              dispatch({ type: 'setScreen', screen: item.kind === 'walk' ? 'C01' : 'C03' })
            }}
          >
            <Text style={index === state.cursor ? styles.now : styles.micro}>
              {item.mystery.isMystery ? item.spoilerSafeTitle : item.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  )
}

export function ActiveMapScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <DensityProvider value={0}>
      <Screen density={0}>
        <EditorialLabel>Map</EditorialLabel>
        <MapSurface
          items={state.route?.items ?? []}
          token={tokenFromEnv()}
          forceNoToken={state.sim === 'no-token'}
          mysteryRevealed={state.experience.mysteryRevealed}
          activeId={state.route?.items[state.cursor]?.id}
          planning={state.session.locationMode === 'planning'}
          onSelect={(item) => {
            dispatch({ type: 'setScreen', screen: 'F03' })
            const index = state.route?.items.findIndex((entry) => entry.id === item.id) ?? 0
            dispatch({ type: 'setCursor', cursor: Math.max(0, index) })
          }}
        />
        <PrimaryAction quiet label="List" onPress={() => dispatch({ type: 'setScreen', screen: 'C05' })} />
      </Screen>
    </DensityProvider>
  )
}

export function ResumeScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>Resume</EditorialLabel>
      <Title>{state.route?.items[state.cursor]?.spoilerSafeTitle ?? 'No active draft'}</Title>
      <Body>Same item, same cursor. Onboarding is not replayed.</Body>
      <PrimaryAction label="Continue" onPress={() => dispatch({ type: 'setScreen', screen: state.route ? 'C01' : 'A01' })} />
      <PrimaryAction quiet label="Close the afternoon" onPress={() => dispatch({ type: 'setScreen', screen: 'B01' })} />
    </Screen>
  )
}

export function HeroCoverScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen tone="immersion" density={3}>
      <EditorialLabel inverted>Hero</EditorialLabel>
      <Title inverted>{item?.title}</Title>
      <Body inverted>{item?.lookCue}</Body>
      <PhotoPlaceholder label={item?.archive.caption ?? 'Sourced still — or pending'} />
      <PrimaryAction label="Enter" onPress={() => dispatch({ type: 'setScreen', screen: 'D02' })} />
    </Screen>
  )
}

export function HeroRuntimeScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen tone="immersion" density={2}>
      <EditorialLabel inverted>Look</EditorialLabel>
      <Body inverted>{item?.lookCue}</Body>
      <Body inverted>{(item as { firstSpokenLine?: string } | null)?.firstSpokenLine ?? item?.arrivalLine}</Body>
      <PrimaryAction label="Complete" onPress={() => dispatch({ type: 'setScreen', screen: 'D12' })} />
    </Screen>
  )
}

export function DiscoveryScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen density={2}>
      <EditorialLabel>Discovery</EditorialLabel>
      <Title>{item?.title}</Title>
      <Body>{item?.approachLine ?? item?.arrivalLine}</Body>
      <PrimaryAction label="Complete" onPress={() => dispatch({ type: 'setScreen', screen: 'D12' })} />
    </Screen>
  )
}

export function MysterySealedScreen() {
  const { dispatch, state } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen density={2}>
      <EditorialLabel>Sealed</EditorialLabel>
      <Title>{item?.spoilerSafeTitle ?? fixture.mysterySpoilerSafeTitle}</Title>
      <Body>{item?.mystery.hint ?? fixture.mysteryHint}</Body>
      <Meta>
        Detour {item?.mystery.detourCostMin != null ? `${item.mystery.detourCostMin} min` : 'unpublished'}
      </Meta>
      <PrimaryAction
        label="Take me"
        onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })}
      />
      <PrimaryAction
        label="Reveal now"
        onPress={() => {
          dispatch({ type: 'revealMystery' })
          dispatch({ type: 'setScreen', screen: 'D08' })
        }}
      />
      <Meta>Reveal is a decision, not a game.</Meta>
    </Screen>
  )
}

export function MysteryRevealedScreen() {
  const { dispatch, state } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen density={2}>
      <EditorialLabel>Revealed</EditorialLabel>
      <Title>{state.experience.mysteryRevealed ? fixture.mysteryTrueTitle : item?.spoilerSafeTitle}</Title>
      <Body>{item?.arrivalLine}</Body>
      <PrimaryAction label="Then / Now" onPress={() => dispatch({ type: 'setScreen', screen: 'D09' })} />
    </Screen>
  )
}

export function RevealScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  const hasArchive = Boolean(item?.archive.then?.uri && item.archive.now?.uri)
  return (
    <Screen tone="immersion" density={3}>
      <EditorialLabel inverted>Then / Now</EditorialLabel>
      <Title inverted>{item?.title}</Title>
      {hasArchive ? (
        <>
          <PhotoPlaceholder label={`Now · ${item?.archive.now?.credit ?? 'sourced'}`} />
          <PhotoPlaceholder label={`Then · ${item?.archive.caption ?? 'sourced'}`} />
        </>
      ) : (
        <Body inverted>Archivo pendiente — interacción de diseño. No fake photograph is shown.</Body>
      )}
      <Meta inverted>{item?.archive.caption}</Meta>
      <PrimaryAction label="Complete" onPress={() => dispatch({ type: 'setScreen', screen: 'D12' })} />
    </Screen>
  )
}

export function ExperienceCompleteScreen() {
  const { state, dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen density={2}>
      <EditorialLabel>Held</EditorialLabel>
      <Title>{item?.spoilerSafeTitle}</Title>
      <Body>No points. The rest of the afternoon can still change.</Body>
      <PrimaryAction
        label="What next"
        onPress={() => {
          if (item) dispatch({ type: 'completeExperience', itemId: item.id })
          dispatch({ type: 'setScreen', screen: 'E01' })
        }}
      />
    </Screen>
  )
}

export function ForkScreen() {
  const { state, dispatch, service } = useTraveler()
  const choose = (optionId: string) => {
    if (!state.route) return
    dispatch({ type: 'setScreen', screen: 'K02' })
    const result = service.adaptRoute(state.route, { type: 'choose', optionId }, state.cursor)
    dispatch({ type: 'setRoute', route: result.route, cursor: Math.min(state.cursor, result.route.items.length - 1) })
    dispatch({ type: 'setDelta', delta: result.delta })
  }
  return (
    <Screen density={2}>
      <EditorialLabel>Fork</EditorialLabel>
      <Title>{fixture.bifurcation.dominant.title}</Title>
      <Body>{fixture.bifurcation.dominant.impact}</Body>
      <PrimaryAction label="Stay in the valley" onPress={() => choose('continue-forum')} />
      {fixture.bifurcation.alternatives.map((alt) => (
        <PrimaryAction key={alt.id} quiet label={alt.title} onPress={() => choose(alt.id)} />
      ))}
      <PrimaryAction quiet label="Follow the plan" onPress={() => choose('stay')} />
    </Screen>
  )
}

export function RecomposingScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={2}>
      <EditorialLabel>Recomposing</EditorialLabel>
      <Title>{state.reduceMotion ? 'The remainder, rewritten.' : 'Lines sliding into a new order.'}</Title>
      <PrimaryAction label="See the delta" onPress={() => dispatch({ type: 'setScreen', screen: 'E03' })} />
    </Screen>
  )
}

export function RecomposedScreen() {
  const { state, dispatch } = useTraveler()
  const delta = state.lastDelta
  return (
    <Screen density={2}>
      <EditorialLabel>Changed</EditorialLabel>
      <Title>What actually moved.</Title>
      {delta?.timeDeltaMin != null ? <Body>Time Δ {delta.timeDeltaMin} min</Body> : <Meta>Time delta omitted — unpublished walking minutes.</Meta>}
      {delta?.walkingDeltaMin != null ? <Body>Walking Δ {delta.walkingDeltaMin} min</Body> : null}
      <Body>Removed: {delta?.removedIds.join(', ') || 'none'}</Body>
      <PrimaryAction label="Continue" onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
      <PrimaryAction quiet label="Active home" onPress={() => dispatch({ type: 'setScreen', screen: 'B03' })} />
    </Screen>
  )
}

export function SkipScreen() {
  const { state, dispatch, service } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen density={1}>
      <EditorialLabel>Skip</EditorialLabel>
      <Title>Remove this stop. No penalty.</Title>
      <Body>{item?.spoilerSafeTitle}</Body>
      <PrimaryAction
        label="Remove it"
        onPress={() => {
          if (!state.route || !item) return
          const result = service.adaptRoute(state.route, { type: 'skip', itemId: item.id }, state.cursor)
          dispatch({ type: 'setRoute', route: result.route, cursor: Math.min(state.cursor, result.route.items.length - 1) })
          dispatch({ type: 'setDelta', delta: result.delta })
          dispatch({ type: 'setScreen', screen: 'E03' })
        }}
      />
    </Screen>
  )
}

export function CityMapScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>City</EditorialLabel>
      <MapSurface
        items={state.route?.items ?? []}
        token={tokenFromEnv()}
        forceNoToken={state.sim === 'no-token'}
        mysteryRevealed={state.experience.mysteryRevealed}
        activeId={state.route?.items[state.cursor]?.id}
        onSelect={() => dispatch({ type: 'setScreen', screen: 'F03' })}
      />
    </Screen>
  )
}

export function MapDetailSheetScreen() {
  const { dispatch, state } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen density={1}>
      <EditorialLabel>{item?.treatment}</EditorialLabel>
      <Title>{item?.mystery.isMystery && !state.experience.mysteryRevealed ? item.spoilerSafeTitle : item?.title}</Title>
      <Meta>Provenance {item?.provenance}</Meta>
      <Meta>{item?.experienceMin ? `${item.experienceMin} min visit (low)` : 'Visit minutes unpublished'}</Meta>
      <PrimaryAction
        label="Save"
        onPress={() => {
          if (item) dispatch({ type: 'save', itemId: item.id })
        }}
      />
      <PrimaryAction quiet label="Close" onPress={() => dispatch({ type: 'setScreen', screen: 'F01' })} />
    </Screen>
  )
}

export function SavedScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>Saved locally</EditorialLabel>
      <Title>No account.</Title>
      {state.savedIds.length ? state.savedIds.map((id) => <Body key={id}>{id}</Body>) : <Body>Nothing saved yet.</Body>}
      <PrimaryAction quiet label="Back" onPress={() => dispatch({ type: 'setScreen', screen: 'I01' })} />
    </Screen>
  )
}

export function SettingsScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>Settings</EditorialLabel>
      <Title>Traveler</Title>
      <Body>Reduce motion is {state.reduceMotion ? 'on' : 'off'}.</Body>
      <PrimaryAction
        quiet
        label="Toggle reduce motion"
        onPress={() => dispatch({ type: 'setReduceMotion', value: !state.reduceMotion })}
      />
      {typeof __DEV__ !== 'undefined' && __DEV__ ? (
        <>
          <EditorialLabel>DEV</EditorialLabel>
          <PrimaryAction label="Screen gallery" onPress={() => dispatch({ type: 'setScreen', screen: 'Gallery' })} />
          <PrimaryAction label="Diagnostics" onPress={() => dispatch({ type: 'setScreen', screen: 'Diagnostics' })} />
          {(['off', 'gps-weak', 'permission-denied', 'no-token', 'planning', 'offline'] as const).map((sim) => (
            <PrimaryAction key={sim} quiet label={`Sim: ${sim}`} onPress={() => dispatch({ type: 'setSim', sim })} />
          ))}
        </>
      ) : null}
    </Screen>
  )
}

export function OfflineScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen density={1}>
      <EditorialLabel>Offline</EditorialLabel>
      <Title>The active draft is still here.</Title>
      <Body>No pretend media download. Metadata already on device is enough to continue walking.</Body>
      <PrimaryAction label="Continue the route" onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
    </Screen>
  )
}

export function GpsWeakScreen() {
  const { dispatch } = useTraveler()
  return (
    <DensityProvider value={0}>
      <Screen tone="immersion" density={0}>
        <EditorialLabel inverted>GPS weak</EditorialLabel>
        <Body inverted>Accuracy is too coarse to claim a distance. Use the list, or wait.</Body>
        <PrimaryAction label="Use the list" onPress={() => dispatch({ type: 'setScreen', screen: 'C05' })} />
        <PrimaryAction quiet label="Keep waiting" onPress={() => dispatch({ type: 'setScreen', screen: 'K05' })} />
      </Screen>
    </DensityProvider>
  )
}

export function SeekingLocationScreen() {
  const { dispatch, state } = useTraveler()
  return (
    <DensityProvider value={0}>
      <Screen tone="immersion" density={0}>
        <InstrumentMetric kicker="Location" value={state.location.status} />
        <PrimaryAction label="Back" onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
      </Screen>
    </DensityProvider>
  )
}

export function DetailHuntScreen() {
  const { dispatch } = useTraveler()
  const entry = SCREEN_REGISTRY.find((item) => item.id === 'L01')
  return (
    <Screen density={2}>
      <EditorialLabel>Visual draft</EditorialLabel>
      <Title>Detail Hunt</Title>
      <Body>{entry?.missingForFunctional}</Body>
      <Meta>Not counted as finished.</Meta>
      <PrimaryAction quiet label="Back" onPress={() => dispatch({ type: 'closeOverlay' })} />
    </Screen>
  )
}

export function ContractScreen({ id }: { id: ScreenId }) {
  const { dispatch } = useTraveler()
  const entry = SCREEN_REGISTRY.find((item) => item.id === id)
  return (
    <Screen density={entry?.density ?? 1}>
      <EditorialLabel>
        {entry?.id} · {entry?.status}
      </EditorialLabel>
      <Title>{entry?.title}</Title>
      <Body>{entry?.purpose}</Body>
      <Meta>Gate {entry?.gate} · D{entry?.density}</Meta>
      <Body>Qué falta para funcional: {entry?.missingForFunctional ?? 'Nothing listed — see status.'}</Body>
      <PrimaryAction label="Back to gallery" onPress={() => dispatch({ type: 'setScreen', screen: 'Gallery' })} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  choice: {
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: color.ink800,
    justifyContent: 'center',
  },
  choiceOn: {
    backgroundColor: color.warmWhite,
  },
  choiceText: {
    fontFamily: type.uiFallback,
    fontSize: 18,
    color: color.ink900,
  },
  fragments: {
    gap: space.s,
  },
  fragment: {
    fontFamily: type.displayFallback,
    fontSize: 28,
    color: color.ink900,
  },
  walkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  heroBlock: {
    minHeight: 180,
    justifyContent: 'flex-end',
    gap: space.s,
    paddingVertical: space.l,
  },
  discovery: {
    paddingVertical: space.s,
  },
  micro: {
    fontFamily: type.uiFallback,
    fontSize: 15,
    color: color.ink900,
    paddingVertical: 4,
  },
  now: {
    fontFamily: type.displayFallback,
    fontSize: 22,
    color: color.ink900,
    paddingVertical: 8,
  },
  lateral: {
    marginLeft: space.l,
    paddingVertical: space.m,
    borderLeftWidth: 2,
    borderLeftColor: color.muted,
    paddingLeft: space.m,
  },
  why: {
    gap: 6,
    paddingVertical: space.s,
  },
})
