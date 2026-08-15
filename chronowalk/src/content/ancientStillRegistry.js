/** Auto-mapped ancient stills under public/waypoints (poster preferred). */
export const ANCIENT_STILL_BY_MEDIA_ROOT = Object.freeze({
  '/waypoints/campo-de-fiori/': '/waypoints/campo-de-fiori/ancient-poster.jpg',
  '/waypoints/capitoline-hill/': '/waypoints/capitoline-hill/ancient-poster.jpg',
  '/waypoints/castel-sant-angelo/': '/waypoints/castel-sant-angelo/ancient-poster.jpg',
  '/waypoints/circus-maximus/': '/waypoints/circus-maximus/ancient-reconstruction.jpg',
  '/waypoints/colosseum/exterior/': '/waypoints/colosseum/exterior/ancient-poster.jpg',
  '/waypoints/colosseum/interior/': '/waypoints/colosseum/interior/ancient-poster.jpg',
  '/waypoints/forum-cluster/forum-arch-severus/': '/waypoints/forum-cluster/forum-arch-severus/ancient-poster.jpg',
  '/waypoints/forum-cluster/forum-curia-julia/': '/waypoints/forum-cluster/forum-curia-julia/ancient-poster.jpg',
  '/waypoints/forum-cluster/forum-rostra/': '/waypoints/forum-cluster/forum-rostra/ancient-reconstruction.jpg',
  '/waypoints/largo-argentina/': '/waypoints/largo-argentina/ancient-poster.jpg',
  '/waypoints/pantheon/': '/waypoints/pantheon/ancient-poster.jpg',
  '/waypoints/piazza-navona/': '/waypoints/piazza-navona/ancient-poster.jpg',
})

export function ancientStillForMediaRoot(root) {
  if (!root) return null
  return ANCIENT_STILL_BY_MEDIA_ROOT[root] ?? null
}
