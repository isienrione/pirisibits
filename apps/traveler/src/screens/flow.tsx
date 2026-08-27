import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { TravelerInterest, TravelerProfile } from '@chronowalk/domain'
import {
  Body,
  Cluster,
  EditorialLabel,
  InstrumentMetric,
  Meta,
  PrimaryAction,
  QuietAction,
  Screen,
  Title,
} from '../design/primitives'
import {
  ArrivalConfirm,
  AudioRuntime,
  ChoiceRow,
  CompactDiscovery,
  EditorialHeader,
  HomeProposal,
  ImmersiveCover,
  RevealedMystery,
  RouteForkCard,
  RouteScore,
  SealedMystery,
  StatusChip,
  StepProgress,
  ThenNowHold,
  WalkingInstrument,
} from '../design/components'
import { DensityProvider } from '../design/DensityProvider'
import { color, space, type } from '../design/tokens'
import { copy } from '../copy'
import { displayTitle, spokenLine, travelerDelta, travelerWhy } from '../copy/present'
import { MapSurface } from '../map/MapSurface'
import { SCREEN_REGISTRY } from '../registry/screenInventory'
import { useActiveItem, useTraveler } from '../state/TravelerContext'
import type { ScreenId } from '../state/types'
import fixture from '../demo/generated/mobileFixture.json'
import { screenForTreatment } from '../experience/resolvers'
import { distanceMeters, shouldOfferArrival } from '../location/foregroundLocation'
import { imageForItem, places, thenImageForItem, walkingImage } from '../media/places'

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
    <Screen tone="immersion" flush>
      <ImmersiveCover
        image={places.welcome}
        footer={<PrimaryAction label={copy.welcome.begin} onPress={() => dispatch({ type: 'setScreen', screen: 'A03' })} />}
      >
        <EditorialLabel inverted>{copy.brand.name}</EditorialLabel>
        <Title inverted>{copy.welcome.title}</Title>
        <Body inverted>{copy.welcome.body}</Body>
      </ImmersiveCover>
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
    <Screen>
      <StepProgress step={1} total={5} />
      <EditorialHeader kicker={copy.onboarding.interests.kicker} title={copy.onboarding.interests.title} />
      <ChoiceRow
        title={copy.onboarding.interests.antiquity}
        hint={copy.onboarding.interests.antiquityHint}
        selected={state.onboarding.interests?.includes('antiquity')}
        onPress={() => toggle('antiquity')}
      />
      <ChoiceRow
        title={copy.onboarding.interests.livingCity}
        hint={copy.onboarding.interests.livingCityHint}
        selected={state.onboarding.interests?.includes('living-city')}
        onPress={() => toggle('living-city')}
      />
      <ChoiceRow
        title={copy.onboarding.interests.river}
        hint={copy.onboarding.interests.riverHint}
        selected={state.onboarding.interests?.includes('river')}
        onPress={() => toggle('river')}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction
        label={copy.onboarding.continue}
        disabled={!state.onboarding.interests?.length}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A05' })}
      />
    </Screen>
  )
}

export function StyleScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <StepProgress step={2} total={5} />
      <EditorialHeader kicker={copy.onboarding.style.kicker} title={copy.onboarding.style.title} />
      <ChoiceRow
        title={copy.onboarding.style.linger}
        hint={copy.onboarding.style.lingerHint}
        selected={state.onboarding.explorationStyle === 'linger'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { explorationStyle: 'linger' } })}
      />
      <ChoiceRow
        title={copy.onboarding.style.cover}
        hint={copy.onboarding.style.coverHint}
        selected={state.onboarding.explorationStyle === 'cover-ground'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { explorationStyle: 'cover-ground' } })}
      />
      <ChoiceRow
        title={copy.onboarding.style.mixed}
        hint={copy.onboarding.style.mixedHint}
        selected={state.onboarding.explorationStyle === 'mixed'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { explorationStyle: 'mixed' } })}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction
        label={copy.onboarding.continue}
        disabled={!state.onboarding.explorationStyle}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A06' })}
      />
    </Screen>
  )
}

export function MobilityScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <StepProgress step={3} total={5} />
      <EditorialHeader
        kicker={copy.onboarding.mobility.kicker}
        title={copy.onboarding.mobility.title}
        body={copy.onboarding.mobility.body}
      />
      <ChoiceRow
        title={copy.onboarding.mobility.walking}
        selected={state.onboarding.mobility === 'walking'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { mobility: 'walking' } })}
      />
      <ChoiceRow
        title={copy.onboarding.mobility.limited}
        selected={state.onboarding.mobility === 'limited-stairs'}
        onPress={() => dispatch({ type: 'patchOnboarding', patch: { mobility: 'limited-stairs' } })}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction
        label={copy.onboarding.continue}
        disabled={!state.onboarding.mobility}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A07' })}
      />
    </Screen>
  )
}

export function TimeScreen() {
  const { state, dispatch } = useTraveler()
  const hints = { 60: copy.onboarding.time.hint60, 120: copy.onboarding.time.hint120, 180: copy.onboarding.time.hint180 }
  return (
    <Screen>
      <StepProgress step={4} total={5} />
      <EditorialHeader kicker={copy.onboarding.time.kicker} title={copy.onboarding.time.title} />
      {([60, 120, 180] as const).map((budget) => (
        <ChoiceRow
          key={budget}
          title={copy.onboarding.time.minutes(budget)}
          hint={hints[budget]}
          selected={state.onboarding.timeBudgetMin === budget}
          onPress={() => dispatch({ type: 'patchOnboarding', patch: { timeBudgetMin: budget } })}
        />
      ))}
      <View style={{ flex: 1 }} />
      <PrimaryAction
        label={copy.onboarding.continue}
        disabled={!state.onboarding.timeBudgetMin}
        onPress={() => dispatch({ type: 'setScreen', screen: 'A08' })}
      />
    </Screen>
  )
}

export function LocationPermissionScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen>
      <StepProgress step={5} total={5} />
      <EditorialHeader
        kicker={copy.onboarding.location.kicker}
        title={copy.onboarding.location.title}
        body={copy.onboarding.location.body}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction
        label={copy.onboarding.location.allow}
        onPress={() => {
          dispatch({ type: 'patchOnboarding', patch: { locationChoice: 'granted' } })
          dispatch({ type: 'setScreen', screen: 'A10' })
        }}
      />
      <PrimaryAction
        quiet
        label={copy.onboarding.location.skip}
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
    <Screen>
      <EditorialHeader
        kicker={copy.onboarding.ready.kicker}
        title={copy.onboarding.ready.title}
        body={copy.onboarding.ready.body}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.onboarding.ready.compose} onPress={() => dispatch({ type: 'setScreen', screen: 'K01' })} />
    </Screen>
  )
}

export function ComposingScreen() {
  const { state, dispatch, service } = useTraveler()
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
    <Screen tone="immersion" flush>
      <ImmersiveCover
        image={places.forum}
        dim={0.5}
        footer={<PrimaryAction label={copy.composing.seeDraft} onPress={go} />}
      >
        <EditorialLabel inverted>{copy.composing.kicker}</EditorialLabel>
        <Title inverted>{copy.composing.title}</Title>
        <View style={styles.fragments}>
          {copy.composing.fragments.map((fragment) => (
            <Text key={fragment} style={styles.fragment}>
              {fragment}
            </Text>
          ))}
        </View>
      </ImmersiveCover>
    </Screen>
  )
}

export function HomeProposalScreen() {
  const { state, dispatch } = useTraveler()
  const route = state.route
  if (!route) {
    return (
      <Screen>
        <Body>Compose an afternoon first.</Body>
      </Screen>
    )
  }
  return (
    <Screen flush>
      <HomeProposal
        route={route}
        onStart={() => dispatch({ type: 'setScreen', screen: 'C01' })}
        onScore={() => dispatch({ type: 'setScreen', screen: 'B04' })}
        onWhy={() => dispatch({ type: 'setScreen', screen: 'B05' })}
        onAdjust={() => dispatch({ type: 'setScreen', screen: 'B06' })}
      />
    </Screen>
  )
}

export function HomeActiveScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <EditorialHeader
        kicker={copy.home.activeKicker}
        title={state.route?.title ?? copy.brand.city}
        body={copy.home.activeBody}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.home.resume} onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
    </Screen>
  )
}

export function RouteScoreScreen() {
  const { state, dispatch } = useTraveler()
  const route = state.route
  if (!route) return null
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xl, gap: space.s }} showsVerticalScrollIndicator={false}>
        <EditorialHeader kicker={copy.score.kicker} title={route.title} />
        <PrimaryAction label={copy.score.start} onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
        <RouteScore route={route} mysteryRevealed={state.experience.mysteryRevealed} />
        <QuietAction label={copy.score.back} onPress={() => dispatch({ type: 'setScreen', screen: 'B01' })} />
      </ScrollView>
    </Screen>
  )
}

export function WhyThisScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: space.m, paddingBottom: space.xl }}>
        <EditorialHeader kicker={copy.why.kicker} title={copy.why.title} />
        {(state.route?.why ?? []).map((reason) => (
          <View key={reason.id} style={styles.why}>
            <View style={styles.whyRule} />
            <Body>{travelerWhy(reason, state.route?.time.targetBudgetMin)}</Body>
          </View>
        ))}
        <PrimaryAction label={copy.why.back} onPress={() => dispatch({ type: 'setScreen', screen: 'B04' })} />
      </ScrollView>
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
    <Screen>
      <EditorialHeader kicker={copy.adjust.kicker} title={copy.adjust.title} body={copy.adjust.body} />
      <PrimaryAction label={copy.adjust.m60} onPress={() => apply(60)} />
      <PrimaryAction label={copy.adjust.m120} onPress={() => apply(120)} />
      <PrimaryAction label={copy.adjust.m180} onPress={() => apply(180)} />
    </Screen>
  )
}

export function WalkInstrumentScreen() {
  const { state, dispatch } = useTraveler()
  const nextExperience = state.route?.items.slice(state.cursor).find((entry) => entry.kind === 'experience')
  const target = nextExperience?.coordinate
    ? { lat: nextExperience.coordinate.lat, lng: nextExperience.coordinate.lng, radiusM: nextExperience.arrivalRadiusM ?? 40 }
    : null
  const offer = shouldOfferArrival(state.location, target)
  const distance =
    state.session.locationMode === 'planning' || state.location.status !== 'ok' || !target
      ? null
      : distanceMeters(state.location, target)
  const status =
    state.location.status === 'ok'
      ? copy.walk.gpsOk
      : state.location.status === 'weak'
        ? copy.walk.gpsWeak
        : state.location.status === 'denied'
          ? copy.walk.gpsDenied
          : copy.walk.planning
  return (
    <DensityProvider value={0}>
      <Screen tone="immersion" flush>
        <WalkingInstrument
          image={walkingImage(nextExperience)}
          nextTitle={displayTitle(nextExperience ?? null, state.experience.mysteryRevealed)}
          status={status}
          distance={distance != null ? `${Math.round(distance)} m` : copy.walk.noDistance}
          primaryLabel={offer ? copy.walk.arrivedOffer : copy.walk.here}
          onPrimary={() => {
            if (!offer && nextExperience) dispatch({ type: 'arrive', itemId: nextExperience.id })
            dispatch({ type: 'setScreen', screen: 'C03' })
          }}
          onMap={() => dispatch({ type: 'setScreen', screen: 'C06' })}
          onList={() => dispatch({ type: 'setScreen', screen: 'C05' })}
        />
      </Screen>
    </DensityProvider>
  )
}

export function ArrivalScreen() {
  const { dispatch, state } = useTraveler()
  const item = useActiveItem()
  const experience = item
  return (
    <Screen flush>
      <ArrivalConfirm
        image={imageForItem(experience)}
        title={displayTitle(experience, state.experience.mysteryRevealed)}
        line={experience?.arrivalLine ?? experience?.approachLine ?? copy.arrival.beginHint}
        confirmed={state.experience.confirmedArrival}
        onConfirm={() => {
          if (experience) dispatch({ type: 'arrive', itemId: experience.id })
          dispatch({ type: 'confirmArrival' })
        }}
        onBegin={() => {
          dispatch({ type: 'beginExperience' })
          const screen = screenForTreatment(experience?.treatment ?? 'discovery', state.experience.mysteryRevealed)
          dispatch({ type: 'setScreen', screen })
        }}
      />
    </Screen>
  )
}

export function RouteControlScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen>
      <EditorialHeader kicker={copy.control.kicker} title={copy.control.title} />
      <PrimaryAction label={copy.control.list} onPress={() => dispatch({ type: 'setScreen', screen: 'C05' })} />
      <PrimaryAction label={copy.control.map} onPress={() => dispatch({ type: 'setScreen', screen: 'C06' })} />
      <PrimaryAction quiet label={copy.control.skip} onPress={() => dispatch({ type: 'setScreen', screen: 'E04' })} />
      <QuietAction label={copy.control.back} onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
    </Screen>
  )
}

export function ActiveListScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <EditorialLabel>{copy.list.kicker}</EditorialLabel>
      <ScrollView>
        {(state.route?.items ?? []).map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => {
              dispatch({ type: 'setCursor', cursor: index })
              dispatch({ type: 'setScreen', screen: item.kind === 'walk' ? 'C01' : 'C03' })
            }}
            style={styles.listRow}
          >
            <Text style={index === state.cursor ? styles.now : styles.micro}>
              {item.mystery.isMystery && !state.experience.mysteryRevealed ? item.spoilerSafeTitle : item.title}
            </Text>
            {index === state.cursor ? <Text style={styles.nowMark}>{copy.list.now}</Text> : null}
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
        <Screen>
        <EditorialHeader kicker={copy.map.kicker} title={copy.map.title} />
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
        <QuietAction label={copy.walk.list} onPress={() => dispatch({ type: 'setScreen', screen: 'C05' })} />
      </Screen>
    </DensityProvider>
  )
}

export function ResumeScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <EditorialHeader
        kicker={copy.resume.kicker}
        title={displayTitle(state.route?.items[state.cursor], state.experience.mysteryRevealed)}
        body={copy.resume.body}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.resume.continue} onPress={() => dispatch({ type: 'setScreen', screen: state.route ? 'C01' : 'A01' })} />
      <QuietAction label={copy.resume.close} onPress={() => dispatch({ type: 'setScreen', screen: 'B01' })} />
    </Screen>
  )
}

export function HeroCoverScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen tone="immersion" flush>
      <ImmersiveCover
        image={imageForItem(item)}
        footer={<PrimaryAction label={copy.hero.enter} onPress={() => dispatch({ type: 'setScreen', screen: 'D02' })} />}
      >
        <EditorialLabel inverted>{copy.brand.name}</EditorialLabel>
        <Title inverted>{item?.title}</Title>
        <Body inverted>{item?.lookCue}</Body>
      </ImmersiveCover>
    </Screen>
  )
}

export function HeroRuntimeScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen tone="immersion" flush>
      <AudioRuntime
        image={places.colosseumInteriorNow}
        lookCue={item?.lookCue ?? copy.arrival.look}
        spoken={spokenLine(item)}
        onComplete={() => dispatch({ type: 'setScreen', screen: 'D12' })}
      />
    </Screen>
  )
}

export function DiscoveryScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen flush>
      <CompactDiscovery
        image={imageForItem(item)}
        title={item?.title ?? ''}
        body={item?.approachLine ?? item?.arrivalLine ?? ''}
        onComplete={() => dispatch({ type: 'setScreen', screen: 'D12' })}
      />
    </Screen>
  )
}

export function MysterySealedScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  const detour =
    item?.mystery.detourCostMin != null ? copy.mystery.detour(item.mystery.detourCostMin) : copy.mystery.detourUnknown
  return (
    <Screen tone="immersion" flush>
      <SealedMystery
        title={item?.spoilerSafeTitle ?? fixture.mysterySpoilerSafeTitle}
        hint={item?.mystery.hint ?? fixture.mysteryHint}
        detour={detour}
        onTake={() => dispatch({ type: 'setScreen', screen: 'C01' })}
        onReveal={() => {
          dispatch({ type: 'revealMystery' })
          dispatch({ type: 'setScreen', screen: 'D08' })
        }}
      />
    </Screen>
  )
}

export function MysteryRevealedScreen() {
  const { dispatch, state } = useTraveler()
  const item = useActiveItem()
  const title = state.experience.mysteryRevealed ? fixture.mysteryTrueTitle : item?.spoilerSafeTitle
  return (
    <Screen>
      <RevealedMystery
        image={places.largoNow}
        title={title ?? ''}
        body={item?.arrivalLine ?? ''}
        onThenNow={() => dispatch({ type: 'setScreen', screen: 'D09' })}
      />
    </Screen>
  )
}

export function RevealScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  const now = thenImageForItem(item) ? imageForItem(item) : places.colosseumNow
  const then = thenImageForItem(item) ?? places.colosseumThen
  const title = thenImageForItem(item) ? item?.title ?? copy.thenNow.kicker : 'The Colosseum'
  return (
    <Screen tone="immersion" flush>
      <ThenNowHold now={now} then={then} title={title} onComplete={() => dispatch({ type: 'setScreen', screen: 'D12' })} />
    </Screen>
  )
}

export function ExperienceCompleteScreen() {
  const { dispatch } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen>
      <EditorialHeader kicker={copy.complete.kicker} title={item?.spoilerSafeTitle ?? ''} body={copy.complete.body} />
      <View style={{ flex: 1 }} />
      <PrimaryAction
        label={copy.complete.next}
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
    <Screen>
      <EditorialHeader kicker={copy.fork.kicker} title={copy.fork.stay} />
      <RouteForkCard
        recommended
        title={copy.fork.stay}
        impact={copy.fork.stayImpact}
        onPress={() => choose('continue-forum')}
      />
      <RouteForkCard
        title={copy.fork.later}
        impact={copy.fork.laterImpact}
        onPress={() => choose('skip-to-largo')}
      />
      <RouteForkCard
        title={copy.fork.close}
        impact={copy.fork.closeImpact}
        onPress={() => choose('close-day')}
      />
      <QuietAction label={copy.fork.follow} onPress={() => choose('stay')} />
    </Screen>
  )
}

export function RecomposingScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <EditorialHeader
        kicker={copy.recompose.kicker}
        title={state.reduceMotion ? copy.recompose.reduce : copy.recompose.title}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.recompose.see} onPress={() => dispatch({ type: 'setScreen', screen: 'E03' })} />
    </Screen>
  )
}

export function RecomposedScreen() {
  const { state, dispatch } = useTraveler()
  const presented = travelerDelta(state.lastDelta)
  return (
    <Screen>
      <EditorialHeader kicker={copy.recomposed.kicker} title={copy.recomposed.title} body={presented.headline} />
      <Body>{presented.time}</Body>
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.recomposed.continue} onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
      <QuietAction label={copy.recomposed.home} onPress={() => dispatch({ type: 'setScreen', screen: 'B03' })} />
    </Screen>
  )
}

export function SkipScreen() {
  const { state, dispatch, service } = useTraveler()
  const item = useActiveItem()
  return (
    <Screen>
      <EditorialHeader
        kicker={copy.skip.kicker}
        title={copy.skip.title}
        body={displayTitle(item, state.experience.mysteryRevealed)}
      />
      <View style={{ flex: 1 }} />
      <PrimaryAction
        label={copy.skip.remove}
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
    <Screen>
      <EditorialHeader kicker={copy.map.kicker} title={copy.map.title} />
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
  const saved = item ? state.savedIds.includes(item.id) : false
  return (
    <Screen>
      <EditorialHeader
        kicker={item?.treatment === 'hero' ? copy.score.hero : copy.map.kicker}
        title={displayTitle(item, state.experience.mysteryRevealed)}
        body={item?.experienceMin ? copy.map.aboutVisit(item.experienceMin) : copy.map.visitUnknown}
      />
      <PrimaryAction
        label={saved ? copy.map.saved : copy.map.save}
        onPress={() => {
          if (item) dispatch({ type: 'save', itemId: item.id })
        }}
      />
      <QuietAction label={copy.map.close} onPress={() => dispatch({ type: 'setScreen', screen: 'F01' })} />
    </Screen>
  )
}

export function SavedScreen() {
  const { state, dispatch } = useTraveler()
  const titles = state.savedIds.map((id) => state.route?.items.find((item) => item.id === id)?.title ?? id)
  return (
    <Screen>
      <EditorialHeader kicker={copy.saved.kicker} title={copy.saved.title} body={copy.saved.body} />
      {titles.length ? titles.map((title) => <Body key={title}>{title}</Body>) : <Body>{copy.saved.empty}</Body>}
      <View style={{ flex: 1 }} />
      <QuietAction label={copy.saved.back} onPress={() => dispatch({ type: 'setScreen', screen: 'I01' })} />
    </Screen>
  )
}

export function SettingsScreen() {
  const { state, dispatch } = useTraveler()
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: space.m, paddingBottom: space.xl }}>
        <EditorialHeader kicker={copy.settings.kicker} title={copy.settings.title} />
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>{copy.settings.motion}</Text>
            <Meta>{copy.settings.motionHint}</Meta>
          </View>
          <StatusChip label={state.reduceMotion ? copy.settings.motionOn : copy.settings.motionOff} />
        </View>
        <PrimaryAction
          quiet
          label={copy.settings.motion}
          onPress={() => dispatch({ type: 'setReduceMotion', value: !state.reduceMotion })}
        />
        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <View style={styles.devBlock}>
            <EditorialLabel>{copy.settings.developer}</EditorialLabel>
            <Body>{copy.settings.developerBody}</Body>
            <PrimaryAction label={copy.settings.gallery} onPress={() => dispatch({ type: 'setScreen', screen: 'Gallery' })} />
            <PrimaryAction quiet label={copy.settings.diagnostics} onPress={() => dispatch({ type: 'setScreen', screen: 'Diagnostics' })} />
            {(['off', 'gps-weak', 'permission-denied', 'no-token', 'planning', 'offline'] as const).map((sim) => (
              <QuietAction
                key={sim}
                label={`${copy.settings.simulate}: ${sim}`}
                onPress={() => dispatch({ type: 'setSim', sim })}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

export function OfflineScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen>
      <EditorialHeader kicker={copy.offline.kicker} title={copy.offline.title} body={copy.offline.body} />
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.offline.continue} onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
    </Screen>
  )
}

export function GpsWeakScreen() {
  const { dispatch } = useTraveler()
  return (
    <DensityProvider value={0}>
      <Screen tone="immersion">
        <Cluster>
          <EditorialLabel inverted>{copy.gps.kicker}</EditorialLabel>
          <Title inverted>{copy.gps.weakTitle}</Title>
          <Body inverted>{copy.gps.weakBody}</Body>
        </Cluster>
        <PrimaryAction label={copy.gps.list} onPress={() => dispatch({ type: 'setScreen', screen: 'C05' })} />
        <PrimaryAction quiet inverted label={copy.gps.wait} onPress={() => dispatch({ type: 'setScreen', screen: 'K05' })} />
      </Screen>
    </DensityProvider>
  )
}

export function SeekingLocationScreen() {
  const { dispatch } = useTraveler()
  return (
    <DensityProvider value={0}>
      <Screen tone="immersion">
        <InstrumentMetric kicker={copy.gps.kicker} value={copy.gps.seeking} />
        <PrimaryAction label={copy.gps.back} onPress={() => dispatch({ type: 'setScreen', screen: 'C01' })} />
      </Screen>
    </DensityProvider>
  )
}

export function DetailHuntScreen() {
  const { dispatch } = useTraveler()
  return (
    <Screen>
      <EditorialHeader kicker={copy.hunt.kicker} title={copy.hunt.title} body={copy.hunt.body} />
      <QuietAction label={copy.hunt.back} onPress={() => dispatch({ type: 'closeOverlay' })} />
    </Screen>
  )
}

export function ContractScreen({ id }: { id: ScreenId }) {
  const { dispatch } = useTraveler()
  const entry = SCREEN_REGISTRY.find((item) => item.id === id)
  return (
    <Screen>
      <EditorialLabel>{entry?.title}</EditorialLabel>
      <Title>{entry?.purpose}</Title>
      <Body>{entry?.missingForFunctional ?? 'Nothing listed.'}</Body>
      <PrimaryAction label={copy.gallery.back} onPress={() => dispatch({ type: 'setScreen', screen: 'Gallery' })} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  fragments: { gap: 6, marginTop: 12 },
  fragment: { fontFamily: type.displayItalic, fontSize: 26, color: color.warmWhite },
  why: { gap: 8, paddingVertical: 8 },
  whyRule: { width: 24, height: 1.5, backgroundColor: color.ember },
  listRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairline },
  micro: { fontFamily: type.ui, fontSize: 16, color: color.ink900 },
  now: { fontFamily: type.display, fontSize: 22, color: color.ink900 },
  nowMark: { fontFamily: type.condensed, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11, color: color.emberDeep, marginTop: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontFamily: type.uiMedium, fontSize: 16, color: color.ink900 },
  devBlock: { gap: space.m, paddingTop: space.l, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline },
})
