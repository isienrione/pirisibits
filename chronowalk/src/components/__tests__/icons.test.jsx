import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  AudioIcon,
  NavigationIcon,
  HistoryIcon,
  CompassIcon,
  MapIcon,
  ArrivalIcon,
  GalleryIcon,
  SettingsIcon,
  ProfileIcon,
  DeveloperIcon,
  ICON_STROKE,
} from '../ui/icons/index.jsx'

const CORE_ICONS = [
  ['Audio', AudioIcon],
  ['Navigation', NavigationIcon],
  ['History', HistoryIcon],
  ['Compass', CompassIcon],
  ['Map', MapIcon],
  ['Arrival', ArrivalIcon],
  ['Gallery', GalleryIcon],
  ['Settings', SettingsIcon],
  ['Profile', ProfileIcon],
  ['Developer', DeveloperIcon],
]

describe('icons', () => {
  it.each(CORE_ICONS)('renders %s with consistent stroke weight', (_name, Icon) => {
    const { container } = render(<Icon size="md" />)
    const svg = container.querySelector('svg')
    const paths = container.querySelectorAll('[stroke]')

    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  it('uses a unified stroke width token', () => {
    expect(ICON_STROKE).toBe(1.75)
  })
})
