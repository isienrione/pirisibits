import { createContext, useContext } from 'react'
import { useFamilyWalk } from '../../hooks/useFamilyWalk.js'

const FamilyWalkCtx = createContext(null)

export function FamilyWalkProvider({ children }) {
  const value = useFamilyWalk()
  return <FamilyWalkCtx.Provider value={value}>{children}</FamilyWalkCtx.Provider>
}

export function useFamilyWalkContext() {
  const ctx = useContext(FamilyWalkCtx)
  if (!ctx) {
    throw new Error('useFamilyWalkContext requires FamilyWalkProvider')
  }
  return ctx
}

/** Optional - returns null outside provider (e.g. isolated tests). */
export function useOptionalFamilyWalk() {
  return useContext(FamilyWalkCtx)
}
