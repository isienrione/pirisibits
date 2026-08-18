/**
 * Stamp `crossorigin="anonymous"` on stylesheet <link> tags so Session Replay
 * can read `cssRules` (Chrome blocks programmatic access without it) and so
 * Vite-injected hashed CSS participates in CORS.
 *
 * Same-origin sheets with this attribute require Access-Control-Allow-Origin
 * on the asset response (see public/_headers).
 */
export function ensureStylesheetCrossorigin(html) {
  return String(html).replace(/<link\b[^>]*>/gi, (tag) => {
    const relMatch = tag.match(/\brel\s*=\s*(['"]?)([^'"\s>]+)\1/i)
    if (!relMatch || !/\bstylesheet\b/i.test(relMatch[2])) return tag
    if (/\bcrossorigin\b/i.test(tag)) return tag
    return tag.replace(/^<link\b/i, '<link crossorigin="anonymous"')
  })
}
