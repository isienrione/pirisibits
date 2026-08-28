#!/usr/bin/env npx tsx
/**
 * Gate 2E — generate standalone Santiago Route Lab HTML + UI bundle.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildRouteLabEmbedPayload } from '../../src/dev/route-lab/embedPayload'
import { buildAllFixtureResults } from '../../src/dev/route-lab/runRouteLab'

const ROOT = resolve(__dirname, '../..')
const OUT_HTML = resolve(ROOT, 'docs/engine/gate-2e-route-lab.html')
const OUT_JS = resolve(ROOT, 'docs/engine/route-lab-ui.v0.1.js')
const SHELL = resolve(ROOT, 'src/dev/route-lab/static/route-lab-shell.html')
const UI_SRC = resolve(ROOT, 'src/dev/route-lab/static/route-lab-ui.js')

function main() {
  console.log('Building Route Lab fixture payloads (F1–F18)…')
  const results = buildAllFixtureResults(ROOT)
  const payload = buildRouteLabEmbedPayload(results)

  let shell = readFileSync(SHELL, 'utf8')
  const inject = `<script>window.__ROUTE_LAB_DATA__ = ${JSON.stringify(payload)};</script>`
  shell = shell.replace('<!--INJECT_DATA-->', inject)

  mkdirSync(resolve(ROOT, 'docs/engine'), { recursive: true })
  writeFileSync(OUT_HTML, shell, 'utf8')
  copyFileSync(UI_SRC, OUT_JS)

  console.log(JSON.stringify({ html: 'docs/engine/gate-2e-route-lab.html', js: 'docs/engine/route-lab-ui.v0.1.js', fixtures: Object.keys(results).length }, null, 2))
}

main()
