import { useLocation, useNavigate } from 'react-router-dom'
import { useV2Journey } from '../../hooks/useV2Journey.js'
import { resolveBackNavigation, shouldShowGlobalBack } from '../lib/backNavigation.js'
import BackNavButton from './BackNavButton.jsx'

export default function FlowEscapeButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: journeyState, transition } = useV2Journey()

  if (!shouldShowGlobalBack({ pathname: location.pathname, journeyState })) {
    return null
  }

  const { label, run } = resolveBackNavigation({
    pathname: location.pathname,
    journeyState,
  })

  return (
    <BackNavButton
      fixed
      label={label}
      onClick={() => run(navigate, transition)}
      data-testid="global-back"
    />
  )
}
