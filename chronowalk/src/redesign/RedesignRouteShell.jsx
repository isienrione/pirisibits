import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RedesignNavCtx } from './nav.js'

const SCREEN_ROUTES = {
  A1: '/',
  A2: '/preview',
  A3: '/access/confirmed',
  B1: '/welcome',
  B2: '/setup',
  B3: '/begin',
  B4: '/begin',
  C1: '/tour',
  C1b: '/tour',
  C2: '/journey',
  C3: '/journey',
  C4: '/journey',
  C5: '/journey',
  C6: '/journey',
  C7: '/journey',
  C8a: '/journey',
  C8b: '/journey',
  C8c: '/journey',
  C8d: '/journey',
  C9: '/no-ticket',
  C5r: '/journey',
  D1: '/map',
  E1: '/journal',
  E2: '/journal',
  F1: '/letter',
  F2: '/letter',
  G1: '/settings',
  G2: '/credits',
  G3: '/settings',
  G4: '/walk-together',
}

export default function RedesignRouteShell({ children }) {
  const navigate = useNavigate()

  const navigateById = useCallback(
    (screenId) => {
      const route = SCREEN_ROUTES[screenId]
      if (route) navigate(route)
    },
    [navigate],
  )

  const value = useMemo(
    () => ({
      navigate: navigateById,
      navigateToRoute: (path) => navigate(path),
    }),
    [navigate, navigateById],
  )

  return <RedesignNavCtx.Provider value={value}>{children}</RedesignNavCtx.Provider>
}
