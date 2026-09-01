import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { R } from './RouteSurface.jsx'

/**
 * Canonical native onboarding/header.
 * status bar → safe top → Back + optional ChronoWalk identity → progress → content
 * Never a floating grey circle over the logo.
 */
export default function NativePageHeader({
  onBack,
  backTo,
  identity = true,
  progress = null,
  hideBack = false,
}) {
  const navigate = useNavigate()
  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack()
      return
    }
    if (backTo) {
      navigate(backTo)
      return
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/home')
  }

  return (
    <header className="native-page-header" data-testid="native-page-header">
      <div className="native-page-header-bar">
        {hideBack ? (
          <span className="native-page-back-spacer" aria-hidden="true" />
        ) : (
          <button
            type="button"
            className="native-page-back"
            data-testid="native-page-back"
            aria-label="Back"
            onClick={handleBack}
          >
            <ChevronLeft size={22} strokeWidth={2.15} aria-hidden />
          </button>
        )}
        {identity ? (
          <p className="native-page-identity" data-testid="native-page-identity">
            ChronoWalk
          </p>
        ) : (
          <span />
        )}
      </div>
      {progress}
    </header>
  )
}

export const nativeHeaderInk = R.ink
