import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThresholdChromeContext = createContext({
  chromeHidden: false,
  setChromeHidden: () => {},
})

export function ThresholdChromeProvider({ children }) {
  const [chromeHidden, setChromeHidden] = useState(false)

  const value = useMemo(
    () => ({
      chromeHidden,
      setChromeHidden,
    }),
    [chromeHidden]
  )

  return (
    <ThresholdChromeContext.Provider value={value}>{children}</ThresholdChromeContext.Provider>
  )
}

export function useThresholdChrome() {
  return useContext(ThresholdChromeContext)
}

export function useHideThresholdChrome(hidden) {
  const { setChromeHidden } = useThresholdChrome()

  useEffect(() => {
    setChromeHidden(hidden)
    return () => setChromeHidden(false)
  }, [hidden, setChromeHidden])
}
