import {
  LANDING_COLOSSEUM_NOW,
  LANDING_COLOSSEUM_THEN,
  LANDING_HERO,
  LANDING_CINEMATIC_INTERLUDE,
  LANDING_AFTER_ROME,
  LANDING_ENDING,
  LANDING_V2,
  LANDING_PANTHEON_NOW,
} from '../landingVisualAssets.js'
import { ROME_TIERS } from '../landingData.js'
import { LANDING_TIER_ROUTES, LANDING_ROUTE_STOPS } from '../landingTierRoutes.js'
import { getLandingTierStats } from '../landingTierStats.js'

const ETERNA = ROME_TIERS.find((t) => t.id === 'rome-complete')
const ANTICA = ROME_TIERS.find((t) => t.id === 'rome-essential')
const HISTORICA = ROME_TIERS.find((t) => t.id === 'rome-central')

function tierCard(tier) {
  const stats = getLandingTierStats(tier.id)
  return {
    id: tier.id,
    name: tier.name,
    description: tier.outcome,
    price: tier.price,
    priceNote: 'one-time',
    duration: stats.routeTimeLabel,
    stops: stats.stopCount,
    cta: tier.primaryCta,
  }
}

/** Product-true Roma Eterna stop names (21 — excludes scripted rest pause). */
export const HERO_COVERAGE_STOPS = LANDING_TIER_ROUTES['rome-complete'].map(
  (id) => LANDING_ROUTE_STOPS[id]?.title ?? id,
)

/**
 * Secondary hero slides — copy audited against live catalog.
 * Corrections vs source art:
 * - 22 stops → 21 (product truth)
 * - $17.99 / $12 → €14.99 / €9.99
 * - Antica 13 stops / Via Appia claim → 12 stops, Forum–Colosseum core
 * - Historica 7 stops → 8
 * - Chile street map on “Intelligent Navigation” replaced with Rome imagery
 */
export const HERO_SLIDESHOW_SLIDES = [
  {
    id: 'then-now',
    layout: 'split-threshold',
    brand: 'CHRONOWALK',
    title: 'ChronoWalk Rome',
    subtitle: 'Walk freely, keep the context.',
    background: LANDING_CINEMATIC_INTERLUDE,
    nowSrc: LANDING_COLOSSEUM_NOW,
    thenSrc: LANDING_COLOSSEUM_THEN,
    features: [
      {
        title: 'Uncertainty, labeled',
        body: "We show you what's known — and what's not.",
      },
      {
        title: 'Reconstructions from your viewpoint',
        body: 'Press and hold to compare past and present.',
      },
      {
        title: 'Scripts written for this route',
        body: 'Research-led narration, curated for this city.',
      },
      {
        title: 'Walk Rome your way',
        body: 'One continuous route. Pause or explore freely.',
      },
    ],
  },
  {
    id: 'ruin-room',
    layout: 'copy-phone',
    brand: 'CHRONOWALK',
    title: 'The Ruin Becomes the Room.',
    subtitle: 'Hold your screen to view verified, evidence-based reconstructions.',
    background: LANDING_PANTHEON_NOW,
    phoneSrc: LANDING_V2.screenListening,
    phoneAlt: 'ChronoWalk Pantheon free preview',
    features: [
      {
        title: 'Same viewpoint.',
        body: 'Past and present, aligned for clarity.',
      },
      {
        title: 'Evidence first.',
        body: 'What we know, what we infer.',
      },
      {
        title: 'Walk freely.',
        body: 'One continuous route. Pause or explore.',
      },
    ],
    footer: 'Start exploring — try a free sneak peek',
  },
  {
    id: 'gps',
    layout: 'copy-phone',
    brand: 'CHRONOWALK',
    title: 'Smart GPS Guidance.',
    subtitle: 'Audio chapters unlock automatically as you approach the stones.',
    background: LANDING_HERO,
    phoneSrc: LANDING_V2.screenMap,
    phoneAlt: 'ChronoWalk walking map guidance',
    features: [
      {
        title: 'GPS-accurate routes',
        body: 'Know exactly where you are and where to go next.',
      },
      {
        title: 'Automatic audio',
        body: 'Stories play when you arrive at each stop.',
      },
      {
        title: 'Contextual insights',
        body: 'See what mattered most, right where it happened.',
      },
      {
        title: 'Works offline',
        body: 'No signal? No problem. Your walk continues.',
      },
    ],
  },
  {
    id: 'audio',
    layout: 'copy-phone',
    brand: 'CHRONOWALK',
    title: 'Deep Audio Narratives.',
    subtitle: 'Professionally researched scripts written exclusively for this route.',
    background: LANDING_AFTER_ROME,
    phoneSrc: LANDING_V2.screenListening,
    phoneAlt: 'ChronoWalk audio narration player',
    featuresStacked: true,
    features: [
      {
        title: 'Authentic & Accurate',
        body: 'Researched, written, and reviewed by experts.',
      },
      {
        title: 'Immersive Storytelling',
        body: 'Professional narration brings history to life.',
      },
      {
        title: 'Stay in Context',
        body: 'Listen or read — built for the way you explore.',
      },
    ],
  },
  {
    id: 'navigation',
    layout: 'copy-phone',
    brand: 'CHRONOWALK',
    title: 'Intelligent Navigation.',
    subtitle: 'Explore at your own pace without losing your place.',
    background: '/landing/real-moment/wander.jpg',
    phoneSrc: LANDING_V2.screenMap,
    phoneAlt: 'ChronoWalk route guidance',
    features: [
      {
        title: 'Smart re-centering',
        body: 'We gently guide you back.',
      },
      {
        title: 'Context-aware',
        body: 'Your place in the story stays intact.',
      },
      {
        title: 'Wander freely',
        body: 'Detours are part of the journey.',
      },
      {
        title: 'Built for discovery',
        body: 'Rome rewards curiosity.',
      },
    ],
  },
  {
    id: 'evidence',
    layout: 'evidence',
    brand: 'CHRONOWALK',
    title: 'Evidence You Can Check.',
    subtitle: 'Rigorous, verified data — free of generic AI travel fluff.',
    background: LANDING_CINEMATIC_INTERLUDE,
    features: [
      {
        title: 'Uncertainty, labeled.',
        body: 'Where the record is thin, we say so. Threshold captions note interpretive details — colors, crowds, conjecture.',
      },
      {
        title: 'Reconstruction from your viewpoint.',
        body: "At landmarks, press and hold to compare today's stones with a researched reconstruction in front of you.",
      },
      {
        title: 'Scripts written for this route.',
        body: "Narration is researched and produced for ChronoWalk's Rome walk — curated for this city.",
      },
    ],
    banner:
      'Built on primary sources, field research, and transparent methods. You get the context. You decide what it means.',
  },
  {
    id: 'coverage',
    layout: 'coverage',
    brand: 'CHRONOWALK',
    title: 'Comprehensive Coverage.',
    subtitleParts: [
      { text: String(HERO_COVERAGE_STOPS.length), gold: true },
      { text: ' historical coordinates mapped across the city.' },
    ],
    background: LANDING_HERO,
    stops: HERO_COVERAGE_STOPS,
    calloutTitle: 'One continuous route.',
    calloutBody: 'Ancient sites. Timeless story.',
  },
  {
    id: 'packages',
    layout: 'packages',
    brand: 'CHRONOWALK',
    title: 'Flexible Packages.',
    subtitle: 'One purchase, no subscriptions, your own pace.',
    background: LANDING_ENDING,
    packages: [
      {
        ...tierCard(ETERNA),
        description: 'The complete city loop — all 21 stops across ancient Rome.',
        image: LANDING_CINEMATIC_INTERLUDE.desktopSrc,
      },
      {
        ...tierCard(ANTICA),
        description: 'The ancient core — Colosseum, Forum, and Capitoline Hill.',
        image: '/landing/real-moment/forum.jpg',
      },
      {
        ...tierCard(HISTORICA),
        description: 'The centro loop — stories around the Pantheon.',
        image: '/landing/real-moment/pantheon.jpg',
      },
    ],
    features: [
      { title: 'Works offline', body: 'No signal? No problem.' },
      { title: 'Audio + stories', body: 'Immersive, research-led narration.' },
      { title: 'Pause anytime', body: 'Your walk, your pace, your schedule.' },
      { title: 'Yours forever', body: 'One purchase. Lifetime access.' },
    ],
  },
]
