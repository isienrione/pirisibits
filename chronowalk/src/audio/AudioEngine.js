import { MIX_CONFIG } from './mix.config.js'
import { dbToGain } from './db.js'
import { resolvePlanItemUrl } from './audioUrl.js'
import {
  buildTransitPlan,
  buildWaypointPlan,
  resolveActiveZone,
} from './buildPlaybackPlan.js'
import { resolveSystemUrl } from './audioUrl.js'

const JOURNEY_WALKING = 'walking'

export class AudioEngine {
  constructor({
    manifest,
    path = 'a',
    mix = MIX_CONFIG,
    loadBuffer,
    createContext,
  } = {}) {
    this.manifest = manifest
    this.path = path
    this.mix = mix
    this.loadBuffer = loadBuffer ?? defaultLoadBuffer
    this.createContext = createContext ?? defaultCreateContext

    this.completedWaypointIds = new Set()
    this.completedTransitIds = new Set()
    this.journeyState = 'idle'

    this.context = null
    this.masterGain = null
    this.narrationGain = null
    this.bedGain = null
    this.systemGain = null

    this.currentBedKey = null
    this.bedSource = null
    this.narrationPlaying = false
    this.playbackGeneration = 0
    this.activeSources = []

    this.presenceTimer = null
    this.activeTransitId = null
    this.transitStartedAt = null
    this.longwalkPlayed = false

    this.onNarrationChange = null
  }

  async init() {
    if (this.context) return this.context

    const ctx = this.createContext()
    if (!ctx) return null

    this.context = ctx
    this.masterGain = ctx.createGain()
    this.narrationGain = ctx.createGain()
    this.bedGain = ctx.createGain()
    this.systemGain = ctx.createGain()

    this.narrationGain.connect(this.masterGain)
    this.bedGain.connect(this.masterGain)
    this.systemGain.connect(this.masterGain)
    this.masterGain.connect(ctx.destination)

    this.bedGain.gain.value = dbToGain(this.mix.bed.idleDb)
    this.narrationGain.gain.value = 1
    this.systemGain.gain.value = 1

    if (ctx.state === 'suspended' && ctx.resume) {
      await ctx.resume()
    }

    return ctx
  }

  setManifest(manifest) {
    this.manifest = manifest
  }

  setPath(path) {
    this.path = path
  }

  setCompletedWaypointIds(ids = []) {
    this.completedWaypointIds = new Set(ids)
  }

  markWaypointComplete(waypointId) {
    this.completedWaypointIds.add(waypointId)
  }

  markTransitComplete(transitId) {
    this.completedTransitIds.add(transitId)
  }

  setJourneyState(state) {
    this.journeyState = state
    if (state === JOURNEY_WALKING) {
      this.startPresence()
    } else {
      this.stopPresence()
    }
  }

  isNarrationPlaying() {
    return this.narrationPlaying
  }

  getPlaybackContext() {
    return {
      completedWaypointIds: this.completedWaypointIds,
      completedTransitIds: this.completedTransitIds,
    }
  }

  async playWaypoint(waypointId, options = {}) {
    const waypoint =
      this.manifest.waypointsById?.[waypointId] ??
      this.manifest.waypoints?.[waypointId]
    if (!waypoint) return

    const zone = resolveActiveZone(waypoint, options)
    if (zone) await this.setZone(zone)

    const plan = buildWaypointPlan(
      this.manifest,
      waypointId,
      this.path,
      this.getPlaybackContext()
    )

    await this.playPlan(plan)
  }

  async playTransit(transitId) {
    const transit = this.manifest.transits?.find?.((t) => t.id === transitId) ??
      (this.manifest.transits?.[transitId]
        ? { id: transitId, ...this.manifest.transits[transitId] }
        : null)

    if (!transit) return

    if (transit.zone) await this.setZone(transit.zone)

    this.activeTransitId = transitId
    this.transitStartedAt = Date.now()
    this.longwalkPlayed = false
    this.scheduleLongwalkCheck(transit)

    const plan = buildTransitPlan(
      this.manifest,
      transitId,
      this.path,
      this.getPlaybackContext()
    )

    await this.playPlan(plan)
  }

  async play(stopId) {
    const isTransit = Boolean(
      this.manifest.transits?.find?.((t) => t.id === stopId) ??
        this.manifest.transits?.[stopId]
    )

    if (isTransit) {
      await this.playTransit(stopId)
    } else {
      await this.playWaypoint(stopId)
    }
  }

  async setZone(zone) {
    if (!zone || zone === this.currentBedKey) return
    await this.init()
    if (!this.context || !this.manifest?.beds?.[zone]) return

    const url = resolvePlanItemUrl({
      file: this.manifest.beds[zone],
      category: 'beds',
    })

    await this.crossfadeBed(url, zone)
  }

  async crossfadeBed(url, zone) {
    if (!url || !this.context) return

    const buffer = await this.loadBuffer(url, this.context)
    if (!buffer) return

    const ctx = this.context
    const nextSource = ctx.createBufferSource()
    nextSource.buffer = buffer
    nextSource.loop = true

    const nextGain = ctx.createGain()
    nextSource.connect(nextGain)
    nextGain.connect(this.bedGain)

    const now = ctx.currentTime
    const fadeSec = this.mix.bed.crossfadeMs / 1000
    const targetBedGain = this.narrationPlaying
      ? dbToGain(this.mix.bed.duckedDb)
      : dbToGain(this.mix.bed.idleDb)

    nextGain.gain.setValueAtTime(0, now)
    nextGain.gain.linearRampToValueAtTime(1, now + fadeSec)

    if (this.bedSource) {
      try {
        this.bedSource.stop(now + fadeSec)
      } catch {
        // already stopped
      }
    }

    nextSource.start(0)
    this.bedSource = nextSource
    this.currentBedKey = zone
    this.activeSources.push(nextSource)

    this.bedGain.gain.cancelScheduledValues(now)
    this.bedGain.gain.setValueAtTime(this.bedGain.gain.value, now)
    this.bedGain.gain.linearRampToValueAtTime(targetBedGain, now + fadeSec)
  }

  async playPlan(plan) {
    await this.init()
    if (!this.context || !plan.length) return

    const generation = ++this.playbackGeneration
    this.stopNarrationSources()
    this.setNarrationPlaying(true)

    for (const item of plan) {
      if (generation !== this.playbackGeneration) return

      const url = resolvePlanItemUrl(item)
      if (!url) continue

      await this.playBuffer(url, item.type === 'insert')
    }

    if (generation === this.playbackGeneration) {
      this.setNarrationPlaying(false)
    }
  }

  playBuffer(url, isInsert = false) {
    return new Promise((resolve) => {
      if (!this.context) {
        resolve()
        return
      }

      this.loadBuffer(url, this.context).then((buffer) => {
        if (!buffer || !this.context) {
          resolve()
          return
        }

        const source = this.context.createBufferSource()
        source.buffer = buffer
        source.connect(this.narrationGain)
        source.onended = () => {
          this.activeSources = this.activeSources.filter((s) => s !== source)
          resolve()
        }
        this.activeSources.push(source)

        if (isInsert) {
          const pauseSec = (this.mix.insert.headMs + this.mix.insert.tailMs) / 2000
          source.start(0)
          // head/tail silence baked into insert files; no extra pause needed in engine
          void pauseSec
        } else {
          source.start(0)
        }
      })
    })
  }

  setNarrationPlaying(playing) {
    if (this.narrationPlaying === playing) return
    this.narrationPlaying = playing

    if (!this.context || !this.bedGain) {
      this.onNarrationChange?.(playing)
      return
    }

    const now = this.context.currentTime
    const fadeSec = 0.15
    const target = playing
      ? dbToGain(this.mix.bed.duckedDb)
      : dbToGain(this.mix.bed.idleDb)

    this.bedGain.gain.cancelScheduledValues(now)
    this.bedGain.gain.setValueAtTime(this.bedGain.gain.value, now)
    this.bedGain.gain.linearRampToValueAtTime(target, now + fadeSec)

    this.onNarrationChange?.(playing)

    if (!playing && this.journeyState === JOURNEY_WALKING) {
      this.startPresence()
    }
  }

  stopNarration() {
    this.playbackGeneration += 1
    this.stopNarrationSources()
    this.setNarrationPlaying(false)
  }

  stopNarrationSources() {
    for (const source of this.activeSources) {
      try {
        source.stop()
      } catch {
        // already stopped
      }
    }
    this.activeSources = []
  }

  startPresence() {
    if (this.presenceTimer || this.narrationPlaying) return
    this.schedulePresencePulse()
  }

  stopPresence() {
    if (this.presenceTimer) {
      clearTimeout(this.presenceTimer)
      this.presenceTimer = null
    }
  }

  schedulePresencePulse() {
    const { intervalMs, jitterMs } = this.mix.presence
    const jitter = (Math.random() * 2 - 1) * jitterMs
    const delay = Math.max(1000, intervalMs + jitter)

    this.presenceTimer = setTimeout(async () => {
      this.presenceTimer = null

      if (this.journeyState !== JOURNEY_WALKING || this.narrationPlaying) {
        if (this.journeyState === JOURNEY_WALKING) this.schedulePresencePulse()
        return
      }

      await this.playSystemCue(this.manifest?.system?.presence)
      this.schedulePresencePulse()
    }, delay)
  }

  scheduleLongwalkCheck(transit) {
    const expectedMs = (transit.duration_s ?? 60) * 1000
    const thresholdMs = expectedMs * this.mix.longwalk.thresholdMultiplier

    setTimeout(async () => {
      if (
        this.activeTransitId !== transit.id ||
        this.longwalkPlayed ||
        this.narrationPlaying
      ) {
        return
      }

      const elapsed = Date.now() - (this.transitStartedAt ?? Date.now())
      if (elapsed >= thresholdMs) {
        this.longwalkPlayed = true
        await this.playSystemCue(this.manifest?.system?.longwalk)
      }
    }, thresholdMs)
  }

  async playSystemCue(filename) {
    if (!filename) return
    const url = resolveSystemUrl(filename)
    if (!url) return

    await this.init()
    if (!this.context) return

    const buffer = await this.loadBuffer(url, this.context)
    if (!buffer) return

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.connect(this.systemGain)
    source.start(0)
    this.activeSources.push(source)
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source)
    }
  }

  teardown() {
    this.stopPresence()
    this.stopNarration()
    this.playbackGeneration += 1

    if (this.bedSource) {
      try {
        this.bedSource.stop()
      } catch {
        // ignore
      }
      this.bedSource = null
    }

    if (this.context?.close) {
      this.context.close()
    }

    this.context = null
    this.masterGain = null
    this.narrationGain = null
    this.bedGain = null
    this.systemGain = null
    this.currentBedKey = null
    this.activeTransitId = null
    this.transitStartedAt = null
  }
}

async function defaultLoadBuffer(url, context) {
  if (typeof fetch === 'undefined' || !context?.decodeAudioData) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return await context.decodeAudioData(arrayBuffer)
  } catch {
    return null
  }
}

function defaultCreateContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  return new AudioContextClass()
}

export function createAudioEngine(manifest, options = {}) {
  return new AudioEngine({ manifest, ...options })
}

export { JOURNEY_WALKING }
