/**
 * Crossfade ambience while crossing the Threshold (Web Audio API).
 */
export class ThresholdAudioCrossfade {
  constructor() {
    this.context = null
    this.nowGain = null
    this.thenGain = null
    this.nowSource = null
    this.thenSource = null
  }

  async ensureContext() {
    if (typeof window === 'undefined') return null

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null

    if (!this.context) {
      this.context = new AudioContextClass()
      this.nowGain = this.context.createGain()
      this.thenGain = this.context.createGain()
      this.nowGain.connect(this.context.destination)
      this.thenGain.connect(this.context.destination)
      this.nowGain.gain.value = 1
      this.thenGain.gain.value = 0
    }

    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    return this.context
  }

  async start(nowUrl, thenUrl) {
    const ctx = await this.ensureContext()
    if (!ctx) return

    await this.stop()

    const load = async (url) => {
      if (!url) return null
      try {
        const response = await fetch(url)
        if (!response.ok) return null
        const buffer = await response.arrayBuffer()
        return await ctx.decodeAudioData(buffer)
      } catch {
        return null
      }
    }

    const [nowBuffer, thenBuffer] = await Promise.all([load(nowUrl), load(thenUrl)])

    if (nowBuffer) {
      this.nowSource = ctx.createBufferSource()
      this.nowSource.buffer = nowBuffer
      this.nowSource.loop = true
      this.nowSource.connect(this.nowGain)
      this.nowSource.start(0)
    }

    if (thenBuffer) {
      this.thenSource = ctx.createBufferSource()
      this.thenSource.buffer = thenBuffer
      this.thenSource.loop = true
      this.thenSource.connect(this.thenGain)
      this.thenSource.start(0)
      this.thenGain.gain.value = 0
    }
  }

  rampToThen(durationMs) {
    if (!this.context || !this.nowGain || !this.thenGain) return

    const now = this.context.currentTime
    const duration = durationMs / 1000

    this.nowGain.gain.cancelScheduledValues(now)
    this.thenGain.gain.cancelScheduledValues(now)
    this.nowGain.gain.setValueAtTime(this.nowGain.gain.value, now)
    this.thenGain.gain.setValueAtTime(this.thenGain.gain.value, now)
    this.nowGain.gain.linearRampToValueAtTime(0, now + duration)
    this.thenGain.gain.linearRampToValueAtTime(1, now + duration)
  }

  rampToNow(durationMs) {
    if (!this.context || !this.nowGain || !this.thenGain) return

    const now = this.context.currentTime
    const duration = durationMs / 1000

    this.nowGain.gain.cancelScheduledValues(now)
    this.thenGain.gain.cancelScheduledValues(now)
    this.nowGain.gain.setValueAtTime(this.nowGain.gain.value, now)
    this.thenGain.gain.setValueAtTime(this.thenGain.gain.value, now)
    this.nowGain.gain.linearRampToValueAtTime(1, now + duration)
    this.thenGain.gain.linearRampToValueAtTime(0, now + duration)
  }

  async stop() {
    const stopSource = (source) => {
      try {
        source?.stop()
      } catch {
        // already stopped
      }
    }

    stopSource(this.nowSource)
    stopSource(this.thenSource)
    this.nowSource = null
    this.thenSource = null

    if (this.nowGain) this.nowGain.gain.value = 1
    if (this.thenGain) this.thenGain.gain.value = 0
  }
}
