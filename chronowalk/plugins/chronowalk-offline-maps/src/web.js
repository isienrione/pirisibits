import { WebPlugin } from '@capacitor/core'

/**
 * Web stub — native Mapbox offline maps are iOS-only.
 * The app bridge must not call this path for real downloads.
 */
export class ChronoWalkOfflineMapsWeb extends WebPlugin {
  async isSupported() {
    return { supported: false, platform: 'web' }
  }

  async getRegionStatus() {
    return {
      supported: false,
      status: 'not_downloaded',
      progress: null,
      completedResourceCount: null,
      requiredResourceCount: null,
    }
  }

  async downloadRegion() {
    throw this.unavailable('Native offline maps are only available on iOS')
  }

  async deleteRegion() {
    throw this.unavailable('Native offline maps are only available on iOS')
  }
}
