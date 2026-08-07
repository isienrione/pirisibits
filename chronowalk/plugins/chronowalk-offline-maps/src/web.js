import { WebPlugin } from '@capacitor/core'

/**
 * Web stub — native Mapbox offline maps are iOS-only.
 * The app bridge must not call this path for real downloads / native maps.
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

  async openTestMap() {
    return {
      opened: false,
      supported: false,
      errorCode: 'unsupported_platform',
    }
  }

  async openTransitMap() {
    return {
      opened: false,
      supported: false,
      errorCode: 'unsupported_platform',
    }
  }

  async updateTransitMap() {
    return {
      updated: false,
      supported: false,
      errorCode: 'unsupported_platform',
    }
  }

  async closeTransitMap() {
    return {
      closed: true,
      supported: false,
      errorCode: 'unsupported_platform',
    }
  }

  async recenterTransitMap() {
    return {
      recentered: false,
      supported: false,
      errorCode: 'unsupported_platform',
    }
  }

  async setTransitMapVisible() {
    return {
      visible: false,
      supported: false,
      errorCode: 'unsupported_platform',
    }
  }
}
