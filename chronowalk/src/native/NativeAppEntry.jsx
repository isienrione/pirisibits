import { useCallback, useMemo, useState } from 'react'
import { shouldUseNativeAppEntry, getNativeEntryModel } from './nativeEntryRouting.js'
import { NativeCityHome } from './NativeCityHome.jsx'
import { NativeProductList } from './NativeProductList.jsx'
import { T, F } from '../redesign/tokens.js'
import { GhostButton } from '../redesign/ui/GhostButton.jsx'
import './nativeEntry.css'

/**
 * Root native app entry — city home or multi-city list, then products.
 *
 * @param {{
 *   forceNative?: boolean,
 *   modelOptions?: object,
 *   purchaseService?: object,
 *   downloadService?: object,
 * }} [props]
 */
export function NativeAppEntry({
  forceNative = false,
  modelOptions,
  purchaseService,
  downloadService,
} = {}) {
  const [selectedCityId, setSelectedCityId] = useState(null)
  const [screen, setScreen] = useState('home') // home | products

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
      <div className="cw-native-entry" data-testid="native-app-entry-empty">
        <h1 className="cw-native-entry__title">ChronoWalk</h1>
        <p className="cw-native-entry__body">{model.message}</p>
      </div>
    )
  }

  if (model.mode === 'city_list') {
    return (
      <div className="cw-native-entry" data-testid="native-app-entry-city-list">
        <header className="cw-native-entry__brand">
          <p className="cw-native-entry__eyebrow">ChronoWalk</p>
          <h1 className="cw-native-entry__title">Choose a city</h1>
        </header>
        <ul className="cw-native-products__list">
          {model.cities.map((city) => (
            <li key={city.cityId} className="cw-native-products__item">
              <h2 className="cw-native-products__name">{city.name}</h2>
              <GhostButton
                onClick={() => {
                  setSelectedCityId(city.cityId)
                  setScreen('home')
                }}
                data-testid={`native-select-city-${city.cityId}`}
              >
                Open {city.name}
              </GhostButton>
            </li>
          ))}
        </ul>
        <style>{`
          .cw-native-entry__title, .cw-native-products__name { font-family: ${F.display}; color: ${T.warmWhite}; }
          .cw-native-entry__eyebrow { font-family: ${F.body}; }
        `}</style>
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
      />
    </div>
  )
}
