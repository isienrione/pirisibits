import { createContext, createElement, useContext, type ReactNode } from 'react'
import type { EditorialDensity } from './tokens'

const DensityContext = createContext<EditorialDensity>(2)

export function DensityProvider({
  value,
  children,
}: {
  value: EditorialDensity
  children: ReactNode
}) {
  return createElement(DensityContext.Provider, { value }, children)
}

export function useDensity(): EditorialDensity {
  return useContext(DensityContext)
}

export function assertNoDecorativeD0(density: EditorialDensity, primitive: string) {
  if (density === 0) {
    throw new Error(`D0 forbids decorative primitive ${primitive}`)
  }
}
