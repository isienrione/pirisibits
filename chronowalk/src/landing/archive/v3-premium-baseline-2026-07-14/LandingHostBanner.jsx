import { HOST_MAP, getHost } from '../lib/host.js'
import { hostBannerPrefix } from './landingData.js'

export default function LandingHostBanner() {
  const hostCode = getHost()
  const hostName = hostCode ? HOST_MAP[hostCode] : null

  if (!hostName) return null

  return (
    <p className="cw-landing-host">
      {hostBannerPrefix} {hostName}
    </p>
  )
}
