import type { ComposedRoute, RouteDelta, RouteItemView, RouteTimeReport, WhyReason } from '@chronowalk/domain'
import { copy } from './index'

export function formatDuration(min: number): string {
  if (min < 60) return `About ${min} minutes`
  const hours = Math.floor(min / 60)
  const rest = min % 60
  if (rest === 0) return hours === 1 ? 'About 1 hour' : `About ${hours} hours`
  return `About ${hours} hr ${rest} min`
}

export function durationLabel(time: RouteTimeReport): string {
  const base = formatDuration(time.totalEstimatedMin)
  if (!time.walkingMinComplete) return `${base} · ${copy.home.walkingApprox.toLowerCase()}`
  return base
}

export function displayTitle(item: RouteItemView | null | undefined, mysteryRevealed: boolean): string {
  if (!item) return copy.arrival.titleFallback
  if (item.mystery.isMystery && !mysteryRevealed) return item.spoilerSafeTitle
  return item.title
}

export function spokenLine(item: RouteItemView | null | undefined): string {
  if (!item) return ''
  const extra = item as RouteItemView & { firstSpokenLine?: string | null }
  return extra.firstSpokenLine ?? item.arrivalLine ?? item.lookCue ?? ''
}

export function travelerWhy(reason: WhyReason, budgetMin?: number): string {
  if (reason.id === 'interest-antiquity') return copy.why.antiquity
  if (reason.id === 'interest-city') return copy.why.livingCity
  if (reason.id === 'interest-river') return copy.why.river
  if (reason.kind === 'time') return copy.why.time(budgetMin ?? 120)
  if (reason.kind === 'sequence') return copy.why.sequence
  if (reason.kind === 'alternative-lost') return copy.why.alternative
  return reason.statement
    .replace(/DEMO_ONLY[,—\s]*/gi, '')
    .replace(/not a City Engine decision\.?/gi, '')
    .trim()
}

export function travelerDelta(delta: RouteDelta | null): { headline: string; time: string } {
  if (!delta) {
    return { headline: copy.recomposed.kept, time: copy.recomposed.timeUnknown }
  }
  const note = delta.notes.join(' ')
  let headline: string = copy.recomposed.kept
  if (/later room|Bifurcation/i.test(note)) headline = copy.recomposed.laterRoom
  else if (/Skipped/i.test(note)) headline = copy.recomposed.skipped
  else if (/Closed/i.test(note)) headline = copy.recomposed.closed
  else if (/Time changed|published draft/i.test(note)) headline = copy.recomposed.swapped
  const time =
    delta.timeDeltaMin == null ? copy.recomposed.timeUnknown : copy.recomposed.time(delta.timeDeltaMin)
  return { headline, time }
}

export function walkLabel(item: RouteItemView): string {
  if (item.walkingMin != null) return `${copy.score.walk} · ${copy.score.minutes(item.walkingMin)}`
  return copy.score.walkUnpublished
}

export function visitLabel(item: RouteItemView): string | null {
  if (item.experienceMin == null) return null
  return copy.score.minutes(item.experienceMin)
}

export function routePayoff(route: ComposedRoute): string {
  const mystery = route.items.find((item) => item.treatment === 'mystery')
  if (mystery) return copy.home.payoff
  const last = [...route.items].reverse().find((item) => item.kind === 'experience')
  return last ? last.spoilerSafeTitle : ''
}
