#!/usr/bin/env node
/**
 * Parses recording master scripts and writes transcripts into manifest.json.
 * Run: node scripts/apply-recording-master-scripts.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRomeManifest } from '../src/content/romeManifestZod.schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const manifestPath = join(root, 'src/content/rome/manifest.json')
const docxDir = join(root, 'docx_extract')
const fullBySectionPath = join(docxDir, 'FULL_BY_SECTION.md')

const DOC_FILE_ALIASES = {
  't01_a.mp3': 't01_fork_a.mp3',
  't01_b.mp3': 't01_fork_b.mp3',
  'w_pause.mp3': 'pause.mp3',
}

const W17_FILES = ['w17_ch1.mp3', 'w17_ch2.mp3', 'w17_ch3.mp3', 'w17_ch4.mp3']

function loadSourceMarkdown() {
  if (existsSync(fullBySectionPath)) {
    return { markdown: readFileSync(fullBySectionPath, 'utf8'), source: fullBySectionPath }
  }

  const indexPath = join(docxDir, 'sections_index.txt')
  const byIdDir = join(docxDir, 'by_id')
  if (existsSync(indexPath) && existsSync(byIdDir)) {
    const ids = readFileSync(indexPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const parts = ids.map((id) => {
      const file = join(byIdDir, `${id}.md`)
      return existsSync(file) ? readFileSync(file, 'utf8') : ''
    })
    return { markdown: parts.join('\n\n'), source: `${indexPath} + by_id/` }
  }

  throw new Error(`No script source found at ${fullBySectionPath}`)
}

function cleanTranscript(raw) {
  const out = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      out.push('')
      continue
    }
    if (/^MIX NOTE:/i.test(trimmed)) continue
    if (/^[─\-]{3,}/.test(trimmed)) continue
    if (/^⟦/.test(trimmed)) continue
    if (/⟦[^⟧]*⟧/.test(trimmed) && trimmed.replace(/⟦[^⟧]*⟧/g, '').trim() === '') continue
    if (/^\*\*Threshold setup:\*\*/i.test(trimmed)) continue
    if (/^⟦App:/i.test(trimmed)) continue
    if (/^\*\(In-app:/i.test(trimmed)) continue
    if (/^### PART \d+ —/.test(trimmed)) continue

    if (/^\[BREATH/i.test(trimmed)) {
      out.push('')
      continue
    }

    let cleaned = trimmed
      .replace(/⟦[^⟧]*⟧/g, '')
      .replace(/⟨[^⟩]*⟩/g, '')
      .replace(/\*\(In-app:[^)]*\)\*/gi, '')
      .trim()

    if (!cleaned) continue
    out.push(cleaned)
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function parseH2(line) {
  const body = line.replace(/^##\s+/, '').trim()
  const dashIdx = body.indexOf(' — ')
  if (dashIdx === -1) {
    return { docId: body, title: body }
  }

  const left = body.slice(0, dashIdx).trim()
  const title = body
    .slice(dashIdx + 3)
    .replace(/\s*\(~[^)]*\)\s*$/, '')
    .trim()

  const docId = left.split(/\s*:\s*/)[0].trim()
  return { docId, title }
}

function resolveManifestFile(docId) {
  const normalized = docId.endsWith('.mp3') ? docId : `${docId.replace(/\.mp3$/, '')}.mp3`
  return DOC_FILE_ALIASES[normalized] ?? normalized
}

function splitW17Parts(raw, baseTitle) {
  const partRegex = /### PART (\d+) — ([^\n]+)\n([\s\S]*?)(?=### PART \d+ —|$)/g
  const clips = []
  let match
  let index = 0

  while ((match = partRegex.exec(raw)) !== null) {
    const file = W17_FILES[index]
    if (!file) break
    const partTitle = match[2].trim()
    clips.push({
      file,
      title: baseTitle ? `${baseTitle} — ${partTitle}` : partTitle,
      transcript: cleanTranscript(match[3]),
    })
    index += 1
  }

  if (clips.length === 0) {
    clips.push({
      file: 'w17_ch1.mp3',
      title: baseTitle,
      transcript: cleanTranscript(raw),
    })
  }

  return clips
}

function parseClipsFromMarkdown(markdown) {
  const clips = []
  const lines = markdown.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.startsWith('## ')) {
      i += 1
      continue
    }

    const heading = parseH2(line)
    i += 1

    while (i < lines.length && !lines[i].startsWith('### Script / transcript')) {
      if (lines[i].startsWith('## ') || (lines[i].startsWith('# ') && !lines[i].startsWith('### '))) {
        break
      }
      i += 1
    }

    if (i >= lines.length || !lines[i].startsWith('### Script / transcript')) {
      continue
    }

    i += 1
    const body = []
    while (i < lines.length) {
      if (lines[i].startsWith('## ')) break
      if (lines[i].startsWith('# ') && !lines[i].startsWith('### ')) break
      if (lines[i].trim() === '---') break
      body.push(lines[i])
      i += 1
    }

    const raw = body.join('\n').trim()
    if (!raw || raw.length < 8) continue

    if (heading.docId.startsWith('w17')) {
      clips.push(...splitW17Parts(raw, heading.title))
      continue
    }

    const file = resolveManifestFile(heading.docId)
    clips.push({
      file,
      title: heading.title,
      transcript: cleanTranscript(raw),
    })
  }

  return clips
}

function parseInsertsFromMarkdown(markdown) {
  const inserts = new Map()
  const sectionStart = markdown.indexOf('# CONDITIONAL INSERTS')
  if (sectionStart === -1) return inserts

  const section = markdown.slice(sectionStart)
  const blocks = section.split(/\n(?=(?:\*\*)?(?:ins_[a-z0-9_]+|w21_alt_bruno))/i)

  for (const block of blocks) {
    const idMatch = block.match(/^(?:\*\*)?(ins_[a-z0-9_]+|w21_alt_bruno)(?:\.mp3)?(?:\*\*)?/i)
    if (!idMatch) continue

    const insertId = idMatch[1].toLowerCase()
    const lines = block.split('\n').slice(1)
    const scriptLines = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        if (scriptLines.length) scriptLines.push('')
        continue
      }
      if (trimmed.startsWith('>')) {
        scriptLines.push(trimmed.replace(/^>\s*/, ''))
        continue
      }
      if (/^\[.+\]/.test(trimmed)) {
        scriptLines.push(trimmed)
        continue
      }
      if (scriptLines.length) break
    }

    if (!scriptLines.length) continue

    const title = block
      .split('\n')[0]
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .replace(/\.mp3\*\*$/, '')
      .split('—')[0]
      .trim()

    inserts.set(insertId, {
      title: title || insertId,
      transcript: cleanTranscript(scriptLines.join('\n')),
    })
  }

  return inserts
}

function clipMap(clips) {
  const map = new Map()
  for (const clip of clips) {
    map.set(clip.file, clip)
  }
  return map
}

function chapterObject(file, clip, existing) {
  const obj = { file }
  const title = clip?.title ?? (typeof existing === 'object' ? existing.title : undefined)
  const transcript = clip?.transcript ?? (typeof existing === 'object' ? existing.transcript : undefined)
  if (title) obj.title = title
  if (transcript) obj.transcript = transcript
  return obj
}

function applyToManifest(manifest, clipsByFile, insertsById) {
  for (const waypoint of Object.values(manifest.waypoints)) {
    const transcriptParts = []

    waypoint.chapters = waypoint.chapters.map((chapter) => {
      const file = typeof chapter === 'string' ? chapter : chapter.file
      const clip = clipsByFile.get(file)
      const obj = chapterObject(file, clip, chapter)
      if (obj.transcript) transcriptParts.push(obj.transcript)
      return obj
    })

    if (waypoint.outro_variants) {
      for (const outroFile of Object.values(waypoint.outro_variants)) {
        const clip = clipsByFile.get(outroFile)
        if (clip?.transcript) transcriptParts.push(clip.transcript)
      }
    }

    if (transcriptParts.length) {
      waypoint.transcript = transcriptParts.join('\n\n')
    }
  }

  for (const [transitId, transit] of Object.entries(manifest.transits)) {
    if (transit.audio) {
      const clip = clipsByFile.get(transit.audio)
      if (clip?.title) transit.title = clip.title
      if (clip?.transcript) transit.transcript = clip.transcript
    }

    if (transit.variants) {
      transit.variant_meta = transit.variant_meta ?? {}
      for (const [path, variantFile] of Object.entries(transit.variants)) {
        const clip = clipsByFile.get(variantFile)
        if (!clip) continue
        transit.variant_meta[path] = {
          ...(clip.title ? { title: clip.title } : {}),
          ...(clip.transcript ? { transcript: clip.transcript } : {}),
        }
      }
      if (Object.keys(transit.variant_meta).length === 0) {
        delete transit.variant_meta
      }
    }
  }

  for (const [insertId, insert] of Object.entries(manifest.inserts)) {
    const meta = insertsById.get(insertId)
    if (!meta) continue
    if (meta.title) insert.title = meta.title
    if (meta.transcript) insert.transcript = meta.transcript
  }
}

function main() {
  const { markdown, source } = loadSourceMarkdown()
  const clips = parseClipsFromMarkdown(markdown)
  const insertsById = parseInsertsFromMarkdown(markdown)
  const clipsByFile = clipMap(clips)

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  applyToManifest(manifest, clipsByFile, insertsById)

  parseRomeManifest(manifest)

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const matched = clips.length
  const waypointCount = Object.values(manifest.waypoints).filter((w) => w.transcript).length
  const transitCount = Object.values(manifest.transits).filter((t) => t.transcript || t.variant_meta).length
  const insertCount = Object.values(manifest.inserts).filter((i) => i.transcript).length

  console.log(`Source: ${source}`)
  console.log(`Parsed ${matched} narration clips`)
  console.log(`Wrote ${manifestPath}`)
  console.log(`  waypoints with transcript: ${waypointCount}`)
  console.log(`  transits with transcript/meta: ${transitCount}`)
  console.log(`  inserts with transcript: ${insertCount}`)
  console.log('Manifest validates with parseRomeManifest')
}

main()
