/**
 * Imperative helpers for SPA document title / description / Open Graph tags.
 */

function ensureMetaByName(name) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensureMetaByProperty(property) {
  let el = document.head.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  return el
}

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   canonicalHref?: string | null,
 *   ogImage?: string | null,
 *   ogImageAlt?: string | null,
 *   ogType?: string,
 * }} meta
 * @returns {() => void} restore previous values
 */
export function applyDocumentMeta({
  title,
  description,
  canonicalHref = null,
  ogImage = null,
  ogImageAlt = null,
  ogType = 'website',
}) {
  const previousTitle = document.title
  document.title = title

  const descMeta = ensureMetaByName('description')
  const previousDescription = descMeta.getAttribute('content')
  descMeta.setAttribute('content', description)

  const ogPairs = [
    ['og:title', title],
    ['og:description', description],
    ['og:type', ogType],
    ['og:site_name', 'ChronoWalk'],
  ]
  if (canonicalHref) ogPairs.push(['og:url', canonicalHref])
  if (ogImage) ogPairs.push(['og:image', ogImage])
  if (ogImageAlt) ogPairs.push(['og:image:alt', ogImageAlt])

  const twitterPairs = [
    ['twitter:card', ogImage ? 'summary_large_image' : 'summary'],
    ['twitter:title', title],
    ['twitter:description', description],
  ]
  if (ogImage) twitterPairs.push(['twitter:image', ogImage])

  const previousOg = new Map()
  for (const [property, value] of ogPairs) {
    const el = ensureMetaByProperty(property)
    previousOg.set(property, el.getAttribute('content'))
    el.setAttribute('content', value)
  }

  const previousTwitter = new Map()
  for (const [name, value] of twitterPairs) {
    const el = ensureMetaByName(name)
    previousTwitter.set(name, el.getAttribute('content'))
    el.setAttribute('content', value)
  }

  return () => {
    document.title = previousTitle
    if (previousDescription != null) descMeta.setAttribute('content', previousDescription)

    for (const [property, prev] of previousOg) {
      const el = document.head.querySelector(`meta[property="${property}"]`)
      if (!el) continue
      if (prev == null) el.remove()
      else el.setAttribute('content', prev)
    }
    for (const [name, prev] of previousTwitter) {
      const el = document.head.querySelector(`meta[name="${name}"]`)
      if (!el) continue
      if (prev == null) el.remove()
      else el.setAttribute('content', prev)
    }
  }
}
