#!/usr/bin/env npx tsx
/**
 * Gate 2E — dev server for Route Lab with live /api/run.
 * URL: http://localhost:8791/dev/route-lab
 */

import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { serializeRouteLabRun } from '../../src/dev/route-lab/embedPayload'
import { runRouteLabFixture } from '../../src/dev/route-lab/runRouteLab'
import type { RouteRequestInput } from '../../src/engine/routes/route-request'

const ROOT = resolve(__dirname, '../..')
const PORT = Number(process.env.ROUTE_LAB_PORT || 8791)
const HTML = resolve(ROOT, 'docs/engine/gate-2e-route-lab.html')
const JS = resolve(ROOT, 'docs/engine/route-lab-ui.v0.1.js')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  if (req.method === 'POST' && url.pathname === '/api/run') {
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const json = JSON.parse(body || '{}') as { fixtureId?: string; input?: RouteRequestInput }
      const fixtureId = json.fixtureId || 'F2'
      const result = runRouteLabFixture(fixtureId, ROOT)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(serializeRouteLabRun(result)))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(e) }))
    }
    return
  }

  let filePath = HTML
  if (url.pathname === '/dev/route-lab' || url.pathname === '/dev/route-lab/') {
    filePath = HTML
  } else if (url.pathname.startsWith('/docs/engine/')) {
    filePath = resolve(ROOT, url.pathname.slice(1))
  } else if (url.pathname.endsWith('.js')) {
    filePath = url.pathname.includes('route-lab-ui') ? JS : resolve(ROOT, url.pathname.slice(1))
  } else if (url.pathname.endsWith('.html')) {
    filePath = resolve(ROOT, url.pathname.replace(/^\//, ''))
  }

  if (!existsSync(filePath)) {
    res.writeHead(404)
    res.end('Not found')
    return
  }
  const ext = extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' })
  res.end(readFileSync(filePath))
})

server.listen(PORT, () => {
  console.log(`Route Lab: http://localhost:${PORT}/dev/route-lab`)
})
