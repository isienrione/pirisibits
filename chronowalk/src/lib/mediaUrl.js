/** Resolve manifest media paths against VITE_MEDIA_BASE (R2 CDN). */
export function mediaUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const base = import.meta.env.VITE_MEDIA_BASE?.replace(/\/$/, '') ?? ''
  const normalized = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalized}` : normalized
}
