import { ROUTE_CHANGED_EVENT } from './constants.js'
import { readRouteState } from './store.js'
import { useEffect, useState } from 'react'

export function useRouteState() {
  const [state, setState] = useState(() => readRouteState())
  useEffect(() => {
    const refresh = () => setState(readRouteState())
    window.addEventListener(ROUTE_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(ROUTE_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return state
}
