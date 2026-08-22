import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { RouteItemView } from '@chronowalk/domain'
import { copy } from '../copy'
import { durationLabel, visitLabel, walkLabel } from '../copy/present'
import { imageForItem, places } from '../media/places'
import { color, space, type } from './tokens'
import { EditorialLabel, PrimaryAction, QuietAction } from './primitives'
import type { ComposedRoute } from '@chronowalk/domain'

export function ImmersiveCover({
  image,
  children,
  footer,
  dim = 0.42,
}: {
  image: ImageSourcePropType
  children: ReactNode
  footer?: ReactNode
  dim?: number
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={styles.flex}>
      <Image source={image} style={styles.coverImage} resizeMode="cover" />
      <LinearGradient
        colors={[`rgba(22,19,15,${dim})`, 'rgba(22,19,15,0.18)', 'rgba(22,19,15,0.88)']}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.coverInner, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 18) }]}>
        <View style={styles.coverCopy}>{children}</View>
        {footer}
      </View>
    </View>
  )
}

export function EditorialHeader({
  kicker,
  title,
  body,
  inverted = false,
}: {
  kicker: string
  title: string
  body?: string
  inverted?: boolean
}) {
  return (
    <View style={styles.header}>
      <EditorialLabel inverted={inverted}>{kicker}</EditorialLabel>
      <Text style={[styles.display, { color: inverted ? color.warmWhite : color.ink900 }]}>{title}</Text>
      {body ? (
        <Text style={[styles.body, { color: inverted ? color.warmWhite : color.ink800 }]}>{body}</Text>
      ) : null}
    </View>
  )
}

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dots} accessibilityLabel={`${step} of ${total}`}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={[styles.dot, index < step && styles.dotOn]} />
      ))}
    </View>
  )
}

export function ChoiceRow({
  title,
  hint,
  selected,
  onPress,
}: {
  title: string
  hint?: string
  selected?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <View style={[styles.choiceMark, selected && styles.choiceMarkOn]} />
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        {hint ? <Text style={styles.choiceHint}>{hint}</Text> : null}
      </View>
    </Pressable>
  )
}

export function RouteScore({
  route,
  mysteryRevealed,
}: {
  route: ComposedRoute
  mysteryRevealed: boolean
}) {
  return (
    <View style={styles.score}>
      {route.items.map((item, index) => (
        <RouteStep
          key={item.id}
          item={item}
          mysteryRevealed={mysteryRevealed}
          first={index === 0}
        />
      ))}
    </View>
  )
}

export function RouteStep({
  item,
  mysteryRevealed,
  first,
}: {
  item: RouteItemView
  mysteryRevealed: boolean
  first?: boolean
}) {
  if (item.kind === 'walk') {
    return (
      <View style={styles.walkStep}>
        <View style={styles.spine} />
        <Text style={styles.walkText}>{walkLabel(item)}</Text>
      </View>
    )
  }
  if (item.treatment === 'hero') {
    return (
      <View style={[styles.heroStep, !first && { marginTop: 8 }]}>
        <Image source={imageForItem(item)} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(22,19,15,0.78)']} style={styles.heroGrad} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>{copy.score.hero}</Text>
          <Text style={styles.heroTitle}>{item.title}</Text>
          <Text style={styles.heroMeta}>
            {item.lookCue}
            {visitLabel(item) ? `  ·  ${visitLabel(item)}` : ''}
          </Text>
        </View>
      </View>
    )
  }
  if (item.treatment === 'mystery') {
    return (
      <View style={styles.mysteryStep}>
        <Text style={styles.microKicker}>{copy.score.mystery}</Text>
        <Text style={styles.mysteryTitle}>
          {mysteryRevealed ? item.title : item.spoilerSafeTitle}
        </Text>
        <Text style={styles.choiceHint}>{copy.score.sealed}</Text>
      </View>
    )
  }
  if (item.treatment === 'reveal') {
    return (
      <View style={styles.revealStep}>
        <Image source={imageForItem(item)} style={styles.revealImage} resizeMode="cover" />
        <View style={styles.revealCopy}>
          <Text style={styles.microKicker}>{copy.score.reveal}</Text>
          <Text style={styles.discoveryTitle}>{item.title}</Text>
          {visitLabel(item) ? <Text style={styles.choiceHint}>{visitLabel(item)}</Text> : null}
        </View>
      </View>
    )
  }
  if (item.treatment === 'micro') {
    return (
      <View style={styles.microStep}>
        <Text style={styles.microName}>
          {item.title}
          {visitLabel(item) ? `  ·  ${visitLabel(item)}` : ''}
        </Text>
      </View>
    )
  }
  return (
    <View style={styles.discoveryStep}>
      <Image source={imageForItem(item)} style={styles.discoveryThumb} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <Text style={styles.microKicker}>{copy.score.discovery}</Text>
        <Text style={styles.discoveryTitle}>{item.title}</Text>
        {item.approachLine ? <Text style={styles.choiceHint}>{item.approachLine}</Text> : null}
      </View>
    </View>
  )
}

export function WalkingInstrument({
  image,
  nextTitle,
  status,
  distance,
  primaryLabel,
  onPrimary,
  onMap,
  onList,
}: {
  image: ImageSourcePropType
  nextTitle: string
  status: string
  distance?: string | null
  primaryLabel: string
  onPrimary: () => void
  onMap: () => void
  onList: () => void
}) {
  return (
    <ImmersiveCover
      image={image}
      dim={0.28}
      footer={
        <View style={{ gap: 12 }}>
          <PrimaryAction label={primaryLabel} onPress={onPrimary} />
          <View style={styles.rowActions}>
            <QuietAction inverted label={copy.walk.map} onPress={onMap} />
            <Text style={styles.dotSep}>·</Text>
            <QuietAction inverted label={copy.walk.list} onPress={onList} />
          </View>
        </View>
      }
    >
      <Image source={places.emblemDark} style={styles.emblem} resizeMode="contain" />
      <EditorialLabel inverted>{copy.walk.kicker}</EditorialLabel>
      <Text style={styles.walkNext}>{copy.walk.next}</Text>
      <Text style={styles.coverTitle}>{nextTitle}</Text>
      <Text style={styles.coverBody}>{distance ?? status}</Text>
    </ImmersiveCover>
  )
}

export function ArrivalConfirm({
  image,
  title,
  line,
  confirmed,
  onConfirm,
  onBegin,
}: {
  image: ImageSourcePropType
  title: string
  line: string
  confirmed: boolean
  onConfirm: () => void
  onBegin: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView contentContainerStyle={[styles.arrival, { paddingTop: insets.top }]} bounces={false}>
      <Image source={image} style={styles.arrivalImage} resizeMode="cover" />
      <EditorialLabel>{copy.arrival.kicker}</EditorialLabel>
      <Text style={styles.display}>{title}</Text>
      <Text style={styles.body}>{line}</Text>
      <PrimaryAction
        label={confirmed ? copy.arrival.confirmed : copy.arrival.confirm}
        onPress={onConfirm}
        disabled={confirmed}
      />
      <PrimaryAction label={copy.arrival.begin} onPress={onBegin} quiet={!confirmed} disabled={!confirmed} />
    </ScrollView>
  )
}

export function AudioRuntime({
  image,
  lookCue,
  spoken,
  progress = 0.34,
  onComplete,
}: {
  image: ImageSourcePropType
  lookCue: string
  spoken: string
  progress?: number
  onComplete: () => void
}) {
  return (
    <View style={styles.flex}>
      <Image source={image} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(22,19,15,0.25)', 'rgba(22,19,15,0.88)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.runtimeInner}>
        <View style={styles.lookPill}>
          <Text style={styles.lookKicker}>{copy.hero.look}</Text>
          <Text style={styles.lookCue}>{lookCue}</Text>
        </View>
        <View style={styles.player}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.playerMeta}>Listening</Text>
          <Text style={styles.spoken} numberOfLines={5}>
            {spoken}
          </Text>
        </View>
        <PrimaryAction label={copy.hero.complete} onPress={onComplete} />
      </View>
    </View>
  )
}

export function CompactDiscovery({
  image,
  title,
  body,
  onComplete,
}: {
  image: ImageSourcePropType
  title: string
  body: string
  onComplete: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.flexPad, { paddingTop: Math.max(insets.top, 8) }]}>
      <Image source={image} style={styles.compactImage} resizeMode="cover" />
      <EditorialLabel>{copy.discovery.kicker}</EditorialLabel>
      <Text style={styles.displaySmall}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.discovery.complete} onPress={onComplete} />
    </View>
  )
}

export function SealedMystery({
  title,
  hint,
  detour,
  onTake,
  onReveal,
}: {
  title: string
  hint: string
  detour: string
  onTake: () => void
  onReveal: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.flexPad, { backgroundColor: color.obsidian, paddingTop: Math.max(insets.top, 20) }]}>
      <EditorialLabel inverted>{copy.mystery.sealedKicker}</EditorialLabel>
      <Text style={[styles.display, { color: color.warmWhite }]}>{title}</Text>
      <Text style={[styles.body, { color: color.warmWhite }]}>{hint}</Text>
      <Text style={styles.sealedMeta}>{detour}</Text>
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.mystery.takeMe} onPress={onTake} />
      <PrimaryAction quiet inverted label={copy.mystery.reveal} onPress={onReveal} />
    </View>
  )
}

export function RevealedMystery({
  image,
  title,
  body,
  onThenNow,
}: {
  image: ImageSourcePropType
  title: string
  body: string
  onThenNow: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.flexPad, { paddingTop: Math.max(insets.top, 8) }]}>
      <Image source={image} style={styles.revealHero} resizeMode="cover" />
      <EditorialLabel>{copy.mystery.revealedKicker}</EditorialLabel>
      <Text style={styles.displaySmall}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={{ flex: 1 }} />
      <PrimaryAction label={copy.mystery.thenNow} onPress={onThenNow} />
    </View>
  )
}

export function ThenNowHold({
  now,
  then,
  title,
  onComplete,
}: {
  now: ImageSourcePropType
  then: ImageSourcePropType | null
  title: string
  onComplete: () => void
}) {
  const [holding, setHolding] = useState(false)
  const showThen = Boolean(then && holding)
  return (
    <View style={styles.flex}>
      <Pressable
        onPressIn={() => setHolding(true)}
        onPressOut={() => setHolding(false)}
        style={styles.flex}
      >
        <Image source={showThen && then ? then : now} style={styles.thenCover} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(22,19,15,0.2)', 'rgba(22,19,15,0.78)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.thenInner}>
          <EditorialLabel inverted>{copy.thenNow.kicker}</EditorialLabel>
          <Text style={styles.coverTitle}>{title}</Text>
          <View style={styles.thenChip}>
            <Text style={styles.thenChipText}>
              {showThen ? copy.thenNow.then : copy.thenNow.now}
              {then ? `  ·  ${copy.thenNow.hold}` : ''}
            </Text>
          </View>
          {then ? (
            <Image source={then} style={styles.thenStamp} resizeMode="cover" />
          ) : null}
        </View>
      </Pressable>
      <View style={styles.thenFooter}>
        <PrimaryAction label={copy.thenNow.complete} onPress={onComplete} />
      </View>
    </View>
  )
}

export function RouteForkCard({
  title,
  impact,
  recommended,
  onPress,
}: {
  title: string
  impact: string
  recommended?: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.forkCard, recommended && styles.forkCardOn]}>
      {recommended ? <Text style={styles.microKicker}>{copy.fork.recommended}</Text> : null}
      <Text style={recommended ? styles.discoveryTitle : styles.microName}>{title}</Text>
      <Text style={styles.choiceHint}>{impact}</Text>
    </Pressable>
  )
}

export function StatusChip({ label, inverted = false }: { label: string; inverted?: boolean }) {
  return (
    <View style={[styles.chip, inverted && styles.chipInverted]}>
      <Text style={[styles.chipText, inverted && { color: color.warmWhite }]}>{label}</Text>
    </View>
  )
}

export function HomeProposal({
  route,
  onStart,
  onWhy,
  onAdjust,
  onScore,
}: {
  route: ComposedRoute
  onStart: () => void
  onWhy: () => void
  onAdjust: () => void
  onScore?: () => void
}) {
  const hero = route.items.find((item) => item.treatment === 'hero') ?? route.items.find((item) => item.kind === 'experience')
  return (
    <View style={styles.flex}>
      <ImageBackground source={hero ? imageForItem(hero) : places.colosseumNow} style={styles.homeHero} imageStyle={{ resizeMode: 'cover' }}>
        <LinearGradient colors={['rgba(22,19,15,0.15)', 'rgba(22,19,15,0.82)']} style={styles.homeGrad}>
          <EditorialLabel inverted>{copy.home.kicker}</EditorialLabel>
          <Text style={styles.coverTitle}>{route.title}</Text>
          <Text style={styles.coverBody}>{copy.home.character}</Text>
          <Text style={styles.homeTime}>{durationLabel(route.time)}</Text>
        </LinearGradient>
      </ImageBackground>
      <View style={styles.homeBody}>
        <Pressable onPress={onScore} accessibilityRole="button" accessibilityLabel={copy.home.openScore}>
          <ArcPreview route={route} />
        </Pressable>
        <PrimaryAction label={copy.home.start} onPress={onStart} />
        <View style={styles.rowActions}>
          <QuietAction label={copy.home.why} onPress={onWhy} />
          <Text style={[styles.dotSep, { color: color.ink800 }]}>·</Text>
          <QuietAction label={copy.home.adjust} onPress={onAdjust} />
        </View>
      </View>
    </View>
  )
}

function ArcPreview({ route }: { route: ComposedRoute }) {
  const beats = route.items.filter((item) => item.kind === 'experience')
  return (
    <View style={styles.arc} accessibilityLabel="Route arc">
      {beats.map((item, index) => (
        <View key={item.id} style={styles.arcItem}>
          <View
            style={[
              styles.arcMark,
              item.treatment === 'hero' && styles.arcHero,
              item.treatment === 'mystery' && styles.arcMystery,
              item.treatment === 'reveal' && styles.arcReveal,
            ]}
          />
          {index < beats.length - 1 ? <View style={styles.arcLine} /> : null}
        </View>
      ))}
    </View>
  )
}

export function PagePad({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[{ flex: 1, paddingHorizontal: space.edge, paddingTop: Math.max(insets.top, 12) }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.obsidian },
  coverImage: {
    position: 'absolute',
    top: '-12%',
    left: 0,
    right: 0,
    height: '128%',
    width: '100%',
  },
  thenCover: {
    position: 'absolute',
    top: '-28%',
    left: 0,
    right: 0,
    height: '155%',
    width: '100%',
  },
  flexPad: { flex: 1, paddingHorizontal: space.edge, paddingBottom: space.l, gap: space.m, backgroundColor: color.bone },
  coverInner: { flex: 1, paddingHorizontal: space.edge, justifyContent: 'space-between' },
  coverCopy: { gap: 10, maxWidth: 340 },
  coverTitle: {
    fontFamily: type.display,
    fontSize: 34,
    lineHeight: 40,
    color: color.warmWhite,
  },
  coverBody: {
    fontFamily: type.ui,
    fontSize: 16,
    lineHeight: 23,
    color: color.warmWhite,
  },
  header: { gap: 10 },
  display: {
    fontFamily: type.display,
    fontSize: 30,
    lineHeight: 36,
    color: color.ink900,
  },
  displaySmall: {
    fontFamily: type.display,
    fontSize: 26,
    lineHeight: 32,
    color: color.ink900,
  },
  body: {
    fontFamily: type.ui,
    fontSize: 16,
    lineHeight: 24,
    color: color.ink800,
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  dot: { width: 18, height: 2, backgroundColor: color.hairline },
  dotOn: { backgroundColor: color.ember },
  choice: {
    minHeight: 64,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
  },
  choiceOn: { backgroundColor: 'transparent' },
  choiceMark: { width: 2, height: 28, backgroundColor: color.hairline },
  choiceMarkOn: { backgroundColor: color.ember },
  choiceCopy: { flex: 1, gap: 2 },
  choiceTitle: { fontFamily: type.uiMedium, fontSize: 17, color: color.ink900 },
  choiceHint: { fontFamily: type.ui, fontSize: 13, color: color.ink800, lineHeight: 18 },
  score: { gap: 4, paddingBottom: space.l },
  walkStep: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingLeft: 8 },
  spine: { width: 1, height: 18, backgroundColor: color.ember },
  walkText: { fontFamily: type.condensedMedium, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 12, color: color.ink800 },
  heroStep: { height: 168, overflow: 'hidden', marginVertical: 8 },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGrad: { ...StyleSheet.absoluteFillObject },
  heroCopy: { flex: 1, justifyContent: 'flex-end', padding: space.m, gap: 4 },
  heroKicker: { fontFamily: type.condensed, color: color.ember, letterSpacing: 1.8, textTransform: 'uppercase', fontSize: 12 },
  heroTitle: { fontFamily: type.display, fontSize: 28, color: color.warmWhite },
  heroMeta: { fontFamily: type.ui, fontSize: 13, color: color.warmWhite },
  discoveryStep: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center' },
  discoveryThumb: { width: 72, height: 88 },
  discoveryTitle: { fontFamily: type.displayMedium, fontSize: 20, color: color.ink900 },
  microStep: { paddingVertical: 6, paddingLeft: 4 },
  microName: { fontFamily: type.ui, fontSize: 15, color: color.ink900 },
  microKicker: { fontFamily: type.condensed, letterSpacing: 1.6, textTransform: 'uppercase', fontSize: 11, color: color.emberDeep },
  mysteryStep: {
    marginLeft: 12,
    paddingLeft: 14,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: color.muted,
    gap: 4,
  },
  mysteryTitle: { fontFamily: type.displayItalic, fontSize: 22, color: color.ink900 },
  revealStep: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'center' },
  revealImage: { width: 96, height: 72 },
  revealCopy: { flex: 1, gap: 2 },
  emblem: { width: 36, height: 36, marginBottom: 8 },
  walkNext: { fontFamily: type.condensed, letterSpacing: 2, textTransform: 'uppercase', color: color.muted, fontSize: 12 },
  rowActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  dotSep: { color: color.muted, fontFamily: type.ui },
  arrival: { paddingBottom: space.xl, gap: space.m, paddingHorizontal: space.edge },
  arrivalImage: { width: '100%', height: 300 },
  runtimeInner: { flex: 1, justifyContent: 'flex-end', padding: space.edge, gap: space.m, paddingBottom: 28 },
  lookPill: { gap: 4 },
  lookKicker: { fontFamily: type.condensed, letterSpacing: 2, textTransform: 'uppercase', color: color.ember, fontSize: 12 },
  lookCue: { fontFamily: type.displayItalic, fontSize: 22, color: color.warmWhite },
  player: { gap: 10, paddingTop: 8 },
  progressTrack: { height: 2, backgroundColor: color.hairlineOnDark },
  progressFill: { height: 2, backgroundColor: color.ember },
  playerMeta: { fontFamily: type.condensed, letterSpacing: 1.6, textTransform: 'uppercase', color: color.muted, fontSize: 11 },
  spoken: { fontFamily: type.ui, fontSize: 16, lineHeight: 24, color: color.warmWhite },
  compactImage: { width: '100%', height: 168, marginHorizontal: -space.edge, marginTop: 0 },
  sealedMeta: { fontFamily: type.condensed, letterSpacing: 1.4, textTransform: 'uppercase', color: color.muted, fontSize: 12 },
  revealHero: { width: '100%', height: 240, marginHorizontal: -space.edge, marginTop: -4 },
  thenInner: { flex: 1, justifyContent: 'flex-end', padding: space.edge, gap: 10, paddingBottom: 96 },
  thenChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,19,15,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  thenChipText: { fontFamily: type.ui, fontSize: 13, color: color.warmWhite },
  thenStamp: { position: 'absolute', right: 22, top: 56, width: 72, height: 88, borderWidth: 1, borderColor: color.warmWhite },
  thenFooter: { position: 'absolute', left: space.edge, right: space.edge, bottom: 24 },
  forkCard: { paddingVertical: 14, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairline },
  forkCardOn: { padding: 16, backgroundColor: color.warmWhite, borderBottomWidth: 0, marginHorizontal: -4 },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: color.warmWhite },
  chipInverted: { backgroundColor: 'rgba(245,239,227,0.12)' },
  chipText: { fontFamily: type.condensed, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 11, color: color.ink800 },
  homeHero: { height: 380 },
  homeGrad: { flex: 1, justifyContent: 'flex-end', padding: space.edge, gap: 8, paddingBottom: 22 },
  homeTime: { fontFamily: type.condensed, letterSpacing: 1.4, textTransform: 'uppercase', color: color.ember, fontSize: 13 },
  homeBody: { flex: 1, padding: space.edge, gap: 14, backgroundColor: color.bone },
  arc: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  arcItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  arcMark: { width: 7, height: 7, backgroundColor: color.ink900 },
  arcHero: { width: 14, height: 14, backgroundColor: color.actArena },
  arcMystery: { width: 9, height: 9, backgroundColor: color.muted, transform: [{ rotate: '45deg' }] },
  arcReveal: { width: 10, height: 10, backgroundColor: color.ember },
  arcLine: { flex: 1, height: 1, backgroundColor: color.hairline, marginHorizontal: 4 },
})
