import type { ImageSourcePropType } from 'react-native'
import type { RouteItemView, Treatment } from '@chronowalk/domain'

export const places = {
  welcome: require('../../assets/places/welcome.jpg') as ImageSourcePropType,
  colosseumNow: require('../../assets/places/colosseum-now.jpg') as ImageSourcePropType,
  colosseumThen: require('../../assets/places/colosseum-then.jpg') as ImageSourcePropType,
  colosseumInteriorNow: require('../../assets/places/colosseum-interior-now.jpg') as ImageSourcePropType,
  colosseumInteriorThen: require('../../assets/places/colosseum-interior-then.jpg') as ImageSourcePropType,
  titusNow: require('../../assets/places/titus-now.jpg') as ImageSourcePropType,
  basilicaNow: require('../../assets/places/basilica-now.jpg') as ImageSourcePropType,
  sacraNow: require('../../assets/places/sacra-now.jpg') as ImageSourcePropType,
  vestaNow: require('../../assets/places/vesta-now.jpg') as ImageSourcePropType,
  largoNow: require('../../assets/places/largo-now.jpg') as ImageSourcePropType,
  largoThen: require('../../assets/places/largo-then.jpg') as ImageSourcePropType,
  forum: require('../../assets/places/forum.jpg') as ImageSourcePropType,
  pantheon: require('../../assets/places/pantheon.jpg') as ImageSourcePropType,
  street: require('../../assets/places/street.jpg') as ImageSourcePropType,
  map: require('../../assets/places/map.jpg') as ImageSourcePropType,
  emblemLight: require('../../assets/emblem-light.png') as ImageSourcePropType,
  emblemDark: require('../../assets/emblem-dark.png') as ImageSourcePropType,
}

const NOW: Record<string, ImageSourcePropType> = {
  w01: places.colosseumNow,
  w02: places.colosseumInteriorNow,
  w03: places.titusNow,
  w06: places.basilicaNow,
  w07: places.sacraNow,
  w08: places.vestaNow,
  w20: places.largoNow,
}

const THEN: Record<string, ImageSourcePropType> = {
  w01: places.colosseumThen,
  w02: places.colosseumInteriorThen,
  w20: places.largoThen,
}

export function imageForItem(item: { id: string; treatment?: Treatment } | null | undefined): ImageSourcePropType {
  if (!item) return places.forum
  return NOW[item.id] ?? (item.treatment === 'hero' ? places.colosseumNow : places.forum)
}

export function thenImageForItem(item: { id: string } | null | undefined): ImageSourcePropType | null {
  if (!item) return null
  return THEN[item.id] ?? null
}

export function walkingImage(next: RouteItemView | null | undefined): ImageSourcePropType {
  if (!next) return places.street
  if (next.id === 'w01') return places.colosseumNow
  if (next.id === 'w03') return places.titusNow
  if (next.id === 'w20') return places.street
  return places.street
}

export function coverForTreatment(treatment: Treatment | undefined): ImageSourcePropType {
  switch (treatment) {
    case 'hero':
      return places.colosseumNow
    case 'discovery':
      return places.titusNow
    case 'reveal':
      return places.vestaNow
    case 'mystery':
      return places.street
    default:
      return places.forum
  }
}
