import { T } from '../tokens.js'
import { getNowPhotoUrl } from '../images.js'
import { getAct } from '../../content/manifest.js'

const ACT_COLOR = {
  act1: T.actI,
  act2: T.actII,
  act3: T.actIII,
  act4: T.actIV,
  act5: T.actV,
  act6: T.actVI,
  encore: T.encore,
}

const ACT_NUMERAL = {
  act1: 'I',
  act2: 'II',
  act3: 'III',
  act4: 'IV',
  act5: 'V',
  act6: 'VI',
  encore: 'ENC',
}

export function accentForWaypoint(waypoint, manifest) {
  const actId = waypoint?.act
  if (actId && ACT_COLOR[actId]) return ACT_COLOR[actId]
  if (actId && manifest) {
    const act = getAct(manifest, actId)
    if (act?.numeral && ACT_COLOR[`act${act.numeral.toLowerCase().replace('enc', 'encore')}`]) {
      return ACT_COLOR[actId]
    }
  }
  return T.actI
}

export function numeralForWaypoint(waypoint) {
  return ACT_NUMERAL[waypoint?.act] ?? 'I'
}

export function photoForWaypoint(waypoint) {
  if (waypoint?.photo) return waypoint.photo
  if (waypoint?.reconstruction?.now) return waypoint.reconstruction.now
  if (waypoint?.legacy_stop_id) return getNowPhotoUrl(waypoint.legacy_stop_id)
  return getNowPhotoUrl('colosseum')
}

export function thenPhotoForWaypoint(waypoint) {
  return waypoint?.reconstruction?.then ?? photoForWaypoint(waypoint)
}

export function titleForWaypoint(waypoint) {
  return waypoint?.title ?? waypoint?.name ?? 'Rome'
}

export function approachCopy(waypoint) {
  return waypoint?.approachLine ?? 'Keep walking — Rome is just ahead.'
}

export function arrivalCopy(waypoint) {
  const line = waypoint?.arrivalLine ?? 'Take a second. Look up.'
  return line.replace(/\s*\/\s*/g, '\n')
}

export function signatureLine(waypoint) {
  return waypoint?.sigLine ?? waypoint?.reflection ?? 'The city keeps its place for you.'
}
