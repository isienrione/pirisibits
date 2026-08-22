import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { createTravelerAppService } from '../demo/compositionRoot'
import type { TravelerAppService } from '../demo/TravelerAppService'
import { travelerReducer } from './reducer'
import { loadSession, saveSession, type KeyValueStore } from './persistence'
import { createInitialState, type TravelerAction, type TravelerState } from './types'

const TravelerStateContext = createContext<TravelerState | null>(null)
const TravelerDispatchContext = createContext<Dispatch<TravelerAction> | null>(null)
const TravelerServiceContext = createContext<TravelerAppService | null>(null)

export function TravelerProvider({
  children,
  store,
  service = createTravelerAppService(),
}: {
  children: ReactNode
  store: KeyValueStore
  service?: TravelerAppService
}) {
  const [state, dispatch] = useReducer(travelerReducer, createInitialState())

  useEffect(() => {
    let cancelled = false
    loadSession(store).then((restored) => {
      if (cancelled) return
      dispatch({ type: 'hydrate', state: restored ?? { hydrated: true } })
    })
    return () => {
      cancelled = true
    }
  }, [store])

  useEffect(() => {
    if (!state.hydrated) return
    void saveSession(store, state)
  }, [state, store])

  return (
    <TravelerServiceContext.Provider value={service}>
      <TravelerDispatchContext.Provider value={dispatch}>
        <TravelerStateContext.Provider value={state}>{children}</TravelerStateContext.Provider>
      </TravelerDispatchContext.Provider>
    </TravelerServiceContext.Provider>
  )
}

export function useTraveler() {
  const state = useContext(TravelerStateContext)
  const dispatch = useContext(TravelerDispatchContext)
  const service = useContext(TravelerServiceContext)
  if (!state || !dispatch || !service) {
    throw new Error('useTraveler must be used within TravelerProvider')
  }
  return { state, dispatch, service }
}

export function useActiveItem() {
  const { state } = useTraveler()
  return useMemo(() => {
    const items = state.route?.items ?? []
    return items[state.cursor] ?? null
  }, [state.cursor, state.route])
}
