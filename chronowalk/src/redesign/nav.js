import { createContext } from 'react'

/** Navigate between redesign screens by id (prototype) or route (production). */
export const RedesignNavCtx = createContext({
  navigate: () => {},
  navigateToRoute: () => {},
})
