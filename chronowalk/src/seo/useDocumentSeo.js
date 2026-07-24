import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveDocumentSeo } from './siteRoutes.js'

const ROBOTS_META_NAME = 'robots'
const CANONICAL_REL = 'canonical'

function ensureMetaByName(name) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensureLinkByRel(rel) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  return el
}

function removeLinkByRel(rel) {
  const el = document.head.querySelector(`link[rel="${rel}"]`)
  if (el) el.remove()
}

/**
 * Applies route-aware robots + canonical tags for SPA navigations.
 * Public marketing/legal/contact pages get canonical absolute HTTPS URLs;
 * credential / transactional / app routes get noindex.
 */
export function useDocumentSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const { robots, canonicalHref } = resolveDocumentSeo(pathname)
    const robotsMeta = ensureMetaByName(ROBOTS_META_NAME)
    const previousRobots = robotsMeta.getAttribute('content')
    robotsMeta.setAttribute('content', robots)

    const previousCanonical = document.head
      .querySelector(`link[rel="${CANONICAL_REL}"]`)
      ?.getAttribute('href')

    if (canonicalHref) {
      ensureLinkByRel(CANONICAL_REL).setAttribute('href', canonicalHref)
    } else {
      removeLinkByRel(CANONICAL_REL)
    }

    return () => {
      if (previousRobots != null) robotsMeta.setAttribute('content', previousRobots)
      else robotsMeta.remove()

      if (previousCanonical) {
        ensureLinkByRel(CANONICAL_REL).setAttribute('href', previousCanonical)
      } else {
        removeLinkByRel(CANONICAL_REL)
      }
    }
  }, [pathname])
}

/** Mount inside BrowserRouter so useLocation works. */
export function DocumentSeo() {
  useDocumentSeo()
  return null
}
