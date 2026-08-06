import { useCallback, useMemo, useState } from 'react'
import { shouldUseNativeAppEntry, getNativeEntryModel } from './nativeEntryRouting.js'
import { NativeCityHome } from './NativeCityHome.jsx'
import { NativeProductList } from './NativeProductList.jsx'
import { NativeButton } from './NativeButton.jsx'
import { isReducedMotionPreferred } from './nativeHaptics.js'
import './nativeEntry.css'

/**
 * Root native app entry — polished city home / multi-city / products.
 */
export function NativeAppEntry({
  forceNative = false,
  modelOptions,
  purchaseService,
  downloadService,
} = {}) {
  const [selectedCityId, setSelectedCityId] = useState(null)
  const [screen, setScreen] = useState('home') // home | products
  const reducedMotion = isReducedMotionPreferred()

  const active = forceNative || shouldUseNativeAppEntry()

  const model = useMemo(
    () =>
      getNativeEntryModel({
        ...modelOptions,
        selectedCityId: selectedCityId ?? modelOptions?.selectedCityId ?? null,
      }),
    [modelOptions, selectedCityId],
  )

  const showProducts = useCallback(() => setScreen('products'), [])
  const showHome = useCallback(() => setScreen('home'), [])

  if (!active) {
    return null
  }

  if (!model.ok && model.mode === 'empty') {
    return (
      <div
        className={`cw-native-shell cw-native-empty ${reducedMotion ? 'cw-native-shell--reduced' : 'cw-native-shell--motion'}`}
        data-testid="native-app-entry-empty"
        role="alert"
      >
        <div className="cw-native-shell__panel">
          <p className="cw-native-eyebrow">ChronoWalk</p>
          <h1 className="cw-native-title">Nothing to explore yet</h1>
          <p className="cw-native-lede">
            No published cities are available on this build. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (model.mode === 'city_list') {
    return (
      <div
        className={`cw-native-shell cw-native-city-list ${reducedMotion ? 'cw-native-shell--reduced' : 'cw-native-shell--motion'}`}
        data-testid="native-app-entry-city-list"
      >
        <div className="cw-native-shell__panel">
          <header className="cw-native-products__header">
            <p className="cw-native-eyebrow">ChronoWalk</p>
            <h1 className="cw-native-title">Choose a city</h1>
            <p className="cw-native-lede">Each city is a complete walking chapter.</p>
          </header>
          <ul className="cw-native-products__list">
            {model.cities.map((city) => (
              <li key={city.cityId} className="cw-native-products__item">
                <h2 className="cw-native-products__name">{city.name}</h2>
                <NativeButton
                  variant="secondary"
                  testId={`native-select-city-${city.cityId}`}
                  aria-label={`Open ${city.name}`}
                  onClick={() => {
                    setSelectedCityId(city.cityId)
                    setScreen('home')
                  }}
                >
                  Open {city.name}
                </NativeButton>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (screen === 'products') {
    return (
      <NativeProductList
        products={model.products}
        cityName={model.city?.name}
        purchaseService={purchaseService}
        onBack={showHome}
      />
    )
  }

  return (
    <div data-testid="native-app-entry">
      <NativeCityHome
        model={model}
        purchaseService={purchaseService}
        downloadService={downloadService}
        onExploreProducts={showProducts}
        onOpenDownloads={showProducts}
      />
    </div>
  )
}
