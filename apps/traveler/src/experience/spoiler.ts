import type { RouteItemView } from '@chronowalk/domain'

export function visibleMysteryTitle(item: Pick<RouteItemView, 'title' | 'spoilerSafeTitle'>, revealed: boolean) {
  return revealed ? item.title : item.spoilerSafeTitle
}

export function leaksIdentity(haystack: string, trueTitle: string) {
  if (!trueTitle.trim()) return false
  return haystack.toLowerCase().includes(trueTitle.toLowerCase())
}

export function collectPreRevealText(item: RouteItemView) {
  return [
    item.spoilerSafeTitle,
    item.mystery.hint ?? '',
    item.lookCue ?? '',
    item.approachLine ?? '',
  ].join(' ')
}
