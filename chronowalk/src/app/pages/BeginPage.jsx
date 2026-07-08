import { Navigate } from 'react-router-dom'
import BeginFlow from '../../components/begin/BeginFlow'
import { hasAccess } from '../../lib/config'

import RedesignBeginFlow from '../../redesign/RedesignBeginFlow.jsx'

const useFigmaRedesign = true

export function BeginPage() {
  if (!hasAccess()) {
    return <Navigate to="/landing" replace />
  }

  return useFigmaRedesign ? <RedesignBeginFlow /> : <BeginFlow />
}
