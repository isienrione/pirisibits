import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DocumentSeo } from '../useDocumentSeo.js'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentSeo />
      <Routes>
        <Route path="*" element={<div>page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DocumentSeo', () => {
  beforeEach(() => {
    document.head.querySelectorAll('meta[name="robots"], link[rel="canonical"]').forEach((el) => {
      el.remove()
    })
  })

  afterEach(() => {
    cleanup()
    document.head.querySelectorAll('meta[name="robots"], link[rel="canonical"]').forEach((el) => {
      el.remove()
    })
  })

  it('sets index+canonical on /', () => {
    renderAt('/')
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index,follow',
    )
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://chronowalk.com/',
    )
  })

  it('does not advertise /landing as indexable', () => {
    renderAt('/landing')
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,nofollow',
    )
    expect(document.querySelector('link[rel="canonical"]')).toBeNull()
  })

  it('sets index+canonical on legal and contact routes', () => {
    for (const path of ['/legal/terms', '/legal/privacy', '/legal/refund', '/contact']) {
      cleanup()
      renderAt(path)
      expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
        'index,follow',
      )
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
        `https://chronowalk.com${path}`,
      )
    }
  })

  it('sets noindex and removes canonical on private app routes', () => {
    for (const path of ['/access', '/invite', '/journey', '/walk-together', '/preview']) {
      cleanup()
      renderAt(path)
      expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
        'noindex,nofollow',
      )
      expect(document.querySelector('link[rel="canonical"]')).toBeNull()
    }
  })
})
