import { MIX_CONFIG } from './mix.config.js'
import { dbToGain } from './db.js'
import { resolveNarrationUrl, resolvePlanItemUrl, resolveSystemUrl } from './audioUrl.js'
import {
  buildTransitPlan,
  buildWaypointPlan,
  resolveActiveZone,
} from './buildPlaybackPlan.js'

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

    // Controllable narration session (play/pause/seek/skip across a plan).
    this.session = null

    // User-selected narration speed (see appPreferences STORY_PLAYBACK_SPEEDS).
    this.playbackRate = 1

    this.presenceTimer = null
    this.longwalkTimer = null
    this.activeTransitId = null
    this.transitStartedAt = null
    this.longwalkPlayed = false

    this.onNarrationChange = null
    this.onInterruptionChange = null
    this.onProgress = null
    // Fires only when a narration plan reaches its natural end (not on
    // stop/pause/seek), so callers can reveal the "story finished" moment.
    this.onNarrationEnded = null

    this.playbackInterrupted = false
    this.playingBeforeHidden = false
    this.activePlayback = null
    this.interruptedPlayback = null
    this.visibilityListenerAttached = false
  }

  handleVisibilityChange = () => {
    if (typeof document === 'undefined') return

    if (document.hidden) {
      this.onPageHidden()
      return
    }

    void this.onPageVisible()
  }

  handleForegroundReturn = () => {
    if (typeof document === 'undefined' || document.hidden) return
    void this.onPageVisible()
  }

  attachVisibilityListener() {
    if (this.visibilityListenerAttached || typeof document === 'undefined') return

    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('focus', this.handleForegroundReturn)
    window.addEventListener('pageshow', this.handleForegroundReturn)
    this.visibilityListenerAttached = true
  }

  detachVisibilityListener() {
    if (!this.visibilityListenerAttached || typeof document === 'undefined') return

    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('focus', this.handleForegroundReturn)
    window.removeEventListener('pageshow', this.handleForegroundReturn)
    this.visibilityListenerAttached = false
  }

  onPageHidden() {
    this.playingBeforeHidden = this.narrationPlaying
  }

  async onPageVisible() {
    await this.syncPlaybackState()
    this.playingBeforeHidden = false
  }

  async syncPlaybackState() {
    if (this.context?.state === 'suspended' && this.context.resume) {
      try {
        await this.context.resume()
      } catch {
        // Resume may require a user gesture after another app steals the session.
      }
    }

    const contextSuspended = this.context?.state === 'suspended'
    const needsResume =
      this.playingBeforeHidden &&
      Boolean(this.activePlayback) &&
      (!this.narrationPlaying || contextSuspended)

    if (needsResume) {
      this.interruptedPlayback = { ...this.activePlayback }
    }

    this.setPlaybackInterrupted(needsResume)
    return needsResume
  }

  isPlaybackInterrupted() {
    return this.playbackInterrupted
  }

  setPlaybackInterrupted(interrupted) {
    if (this.playbackInterrupted === interrupted) return
    this.playbackInterrupted = interrupted
    this.onInterruptionChange?.(interrupted)
  }

  async resumeInterruptedPlayback() {
    await this.init()

    if (this.context?.state === 'suspended' && this.context.resume) {
      await this.context.resume()
    }

    const target = this.interruptedPlayback ?? this.activePlayback
    this.setPlaybackInterrupted(false)
    this.interruptedPlayback = null

    if (!target) return true

    if (target.kind === 'transit') {
      await this.playTransit(target.id)
    } else {
      await this.playWaypoint(target.id)
    }

    return true
  }

  clearActivePlayback() {
    this.activePlayback = null
    this.interruptedPlayback = null
    this.setPlaybackInterrupted(false)
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

  /** Resume AudioContext during a user gesture (iOS Safari autoplay). */
  primeForGesture() {
    void this.init().then((ctx) => {
      if (ctx?.state === 'suspended' && ctx.resume) void ctx.resume()
    })
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

  setCompletedTransitIds(ids = []) {
    this.completedTransitIds = new Set(ids)
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

    this.activePlayback = { kind: 'waypoint', id: waypointId }
    return this.playPlan(plan)
  }

  clearTransitSession() {
    this.activeTransitId = null
    this.transitStartedAt = null
    this.longwalkPlayed = false
    if (this.longwalkTimer) {
      clearTimeout(this.longwalkTimer)
      this.longwalkTimer = null
    }
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
    if (this.longwalkTimer) {
      clearTimeout(this.longwalkTimer)
      this.longwalkTimer = null
    }
    this.scheduleLongwalkCheck(transit)

    const plan = buildTransitPlan(
      this.manifest,
      transitId,
      this.path,
      this.getPlaybackContext()
    )

    this.activePlayback = { kind: 'transit', id: transitId }
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
    if (!this.context || !plan.length) return false

    const generation = ++this.playbackGeneration
    this.stopNarrationSources()
    this.session = {
      plan,
      index: 0,
      generation,
      source: null,
      buffer: null,
      startedAt: 0,
      offset: 0,
      paused: false,
    }
    await this.startCurrentItem(0)
    return this.narrationPlaying
  }

  async startCurrentItem(offset = 0) {
    const session = this.session
    if (!session || session.generation !== this.playbackGeneration || !this.context) return

    const item = session.plan[session.index]
    if (!item) {
      this.finishSession()
      return
    }

    const url = resolvePlanItemUrl(item)
    if (!url) {
      session.index += 1
      session.offset = 0
      await this.startCurrentItem(0)
      return
    }

    const buffer = await this.loadBuffer(url, this.context)
    // Bail if the session was replaced/stopped while the buffer was loading.
    if (this.session !== session || session.generation !== this.playbackGeneration || !this.context) {
      return
    }

    if (!buffer) {
      session.index += 1
      session.offset = 0
      await this.startCurrentItem(0)
      return
    }

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = this.playbackRate || 1
    source.connect(this.narrationGain)

    const startOffset = Math.min(Math.max(offset, 0), buffer.duration || 0)
    session.source = source
    session.buffer = buffer
    session.offset = startOffset
    session.startedAt = this.context.currentTime
    session.paused = false
    this.activeSources.push(source)

    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source)
      const active = this.session
      // Ignore endings from sources we deliberately detached (pause/seek/stop).
      if (!active || active.source !== source) return
      if (active.generation !== this.playbackGeneration || active.paused) return

      active.source = null
      active.index += 1
      active.offset = 0
      if (active.index >= active.plan.length) {
        this.finishSession()
      } else {
        void this.startCurrentItem(0)
      }
    }

    source.start(0, startOffset)
    this.setNarrationPlaying(true)
    this.emitProgress()
  }

  finishSession() {
    const ended = this.activePlayback
    this.session = null
    this.setNarrationPlaying(false)
    if (!this.playbackInterrupted) {
      this.activePlayback = null
    }
    this.emitProgress()
    // Natural completion only — stop()/teardown() clear the session directly and
    // never route through here.
    this.onNarrationEnded?.(ended)
  }

  detachCurrentSource() {
    const session = this.session
    if (!session?.source) return
    const src = session.source
    session.source = null
    try {
      src.stop()
    } catch {
      // already stopped
    }
    this.activeSources = this.activeSources.filter((s) => s !== src)
  }

  getNarrationTime() {
    const session = this.session
    if (!session) return 0
    if (session.paused || !session.source || !this.context) return session.offset
    const rate = this.playbackRate || 1
    return session.offset + Math.max(this.context.currentTime - session.startedAt, 0) * rate
  }

  setPlaybackRate(rate) {
    const next = Number.isFinite(rate) && rate > 0 ? rate : 1
    const session = this.session
    // Re-anchor a live source so elapsed time stays continuous across the change.
    if (session?.source && !session.paused && this.context) {
      session.offset = this.getNarrationTime()
      session.startedAt = this.context.currentTime
      this.playbackRate = next
      try {
        session.source.playbackRate.value = next
      } catch {
        // Some engines reject rate changes on a stopped source; ignore.
      }
    } else {
      this.playbackRate = next
    }
    this.emitProgress()
  }

  getNarrationProgress() {
    const session = this.session
    if (!session) {
      return {
        currentTime: 0,
        duration: 0,
        chapterIndex: 0,
        chapterCount: 0,
        itemIndex: 0,
        itemCount: 0,
        playing: false,
        paused: false,
      }
    }

    const narrationIndices = session.plan
      .map((item, i) => (item.type === 'narration' ? i : -1))
      .filter((i) => i >= 0)
    const chapterCount = narrationIndices.length
    const reached = narrationIndices.filter((i) => i <= session.index).length
    const chapterIndex = Math.max(Math.min(reached, chapterCount) - 1, 0)

    return {
      currentTime: this.getNarrationTime(),
      duration: session.buffer?.duration ?? 0,
      chapterIndex,
      chapterCount,
      itemIndex: session.index,
      itemCount: session.plan.length,
      playing: this.narrationPlaying,
      paused: session.paused,
    }
  }

  emitProgress() {
    this.onProgress?.(this.getNarrationProgress())
  }

  pauseNarration() {
    const session = this.session
    if (!session || session.paused || !session.source) return
    session.offset = this.getNarrationTime()
    session.paused = true
    this.detachCurrentSource()
    this.setNarrationPlaying(false)
    this.emitProgress()
  }

  async resumeNarration() {
    const session = this.session
    if (!session || !session.paused) return
    await this.init()
    if (this.context?.state === 'suspended' && this.context.resume) {
      try {
        await this.context.resume()
      } catch {
        // Resume may require a fresh user gesture.
      }
    }
    session.paused = false
    this.setNarrationPlaying(true)
    await this.startCurrentItem(session.offset)
  }

  toggleNarration() {
    const session = this.session
    if (!session) return
    if (session.paused) {
      void this.resumeNarration()
    } else {
      this.pauseNarration()
    }
  }

  async seekNarration(seconds) {
    const session = this.session
    if (!session) return

    const duration = session.buffer?.duration ?? 0
    const target = Number.isFinite(seconds) ? seconds : 0

    // Cross into adjacent chapters when skipping past the current item's edges.
    if (duration && target >= duration && session.index < session.plan.length - 1) {
      await this.jumpToItem(session.index + 1, 0)
      return
    }
    if (target < 0 && session.index > 0) {
      await this.jumpToItem(session.index - 1, 0)
      return
    }

    const clamped = Math.min(Math.max(target, 0), duration || 0)
    const wasPlaying = !session.paused && Boolean(session.source)
    this.detachCurrentSource()
    session.offset = clamped
    if (wasPlaying) {
      await this.startCurrentItem(clamped)
    } else {
      this.emitProgress()
    }
  }

  skipNarration(deltaSeconds) {
    return this.seekNarration(this.getNarrationTime() + deltaSeconds)
  }

  async jumpToItem(index, offset = 0) {
    const session = this.session
    if (!session) return
    const clampedIndex = Math.min(Math.max(index, 0), session.plan.length - 1)
    const wasPlaying = !session.paused
    this.detachCurrentSource()
    session.index = clampedIndex
    session.offset = offset
    session.buffer = null
    if (wasPlaying) {
      session.paused = false
      await this.startCurrentItem(offset)
    } else {
      session.paused = true
      this.emitProgress()
    }
  }

  async jumpToChapter(chapterIndex) {
    const session = this.session
    if (!session) return
    const narrationIndices = session.plan
      .map((item, i) => (item.type === 'narration' ? i : -1))
      .filter((i) => i >= 0)
    const target = narrationIndices[chapterIndex]
    if (target === undefined) return
    await this.jumpToItem(target, 0)
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
    this.session = null
    this.setNarrationPlaying(false)
    this.clearActivePlayback()
    this.emitProgress()
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

      await this.playSystemCue(this.manifest?.system?.presence, {
        levelDb: this.mix.presence.levelDb,
      })
      this.schedulePresencePulse()
    }, delay)
  }

  scheduleLongwalkCheck(transit) {
    const expectedMs = (transit.duration_s ?? 60) * 1000
    const thresholdMs = expectedMs * this.mix.longwalk.thresholdMultiplier

    this.longwalkTimer = setTimeout(async () => {
      this.longwalkTimer = null

      if (this.activeTransitId !== transit.id || this.longwalkPlayed) {
        return
      }

      const elapsed = Date.now() - (this.transitStartedAt ?? Date.now())
      if (elapsed >= thresholdMs) {
        this.longwalkPlayed = true
        await this.playSystemCue(this.manifest?.system?.longwalk, {
          levelDb: this.mix.longwalk.levelDb,
        })
      }
    }, thresholdMs)
  }

  async playSystemCue(filename, { levelDb = 0 } = {}) {
    if (!filename) return
    const url = resolveSystemUrl(filename)
    await this.playOneShot(url, levelDb)
  }

  async playUiCue(cueKey) {
    const filename = this.manifest?.system?.ui?.[cueKey]
    if (!filename) return
    await this.playSystemCue(filename)
  }

  async playArrivalChime() {
    await this.playUiCue('arrival')
  }

  async playCompletionChime() {
    await this.playUiCue('completion')
  }

  async playResumeCue(cueKey) {
    const filename = this.manifest?.system?.resume?.[cueKey]
    if (!filename) return
    const url = resolveNarrationUrl(filename)
    await this.playOneShot(url)
  }

  async playOneShot(url, levelDb = 0) {
    if (!url) return

    await this.init()
    if (!this.context) return

    const buffer = await this.loadBuffer(url, this.context)
    if (!buffer) return

    const source = this.context.createBufferSource()
    source.buffer = buffer

    const cueGain = this.context.createGain()
    cueGain.gain.value = dbToGain(levelDb)

    source.connect(cueGain)
    cueGain.connect(this.systemGain)
    source.start(0)
    this.activeSources.push(source)
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source)
    }
  }

  teardown() {
    this.detachVisibilityListener()
    this.stopPresence()
    this.stopNarration()
    this.clearTransitSession()
    this.playbackGeneration += 1
    this.playingBeforeHidden = false

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
