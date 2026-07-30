import { createElement } from 'react'

/**
 * Minimal markdown → React for ChronoWalk legal documents.
 * Preserves wording exactly (including [BRACKET] placeholders).
 * Supports: ATX headings, paragraphs, bold, links, lists, tables, blockquotes, hr.
 */

function renderInline(text, keyPrefix) {
  const nodes = []
  // Bold (**…**), links ([label](url)), otherwise plain text — including [BRACKETS]
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`}>{token.slice(2, -2)}</strong>,
      )
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        const [, label, href] = linkMatch
        const external = /^https?:\/\//i.test(href)
        nodes.push(
          <a
            key={`${keyPrefix}-a-${i}`}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {label}
          </a>,
        )
      } else {
        nodes.push(token)
      }
    }
    last = match.index + token.length
    i += 1
  }

  if (last < text.length) {
    nodes.push(text.slice(last))
  }

  return nodes.length === 1 && typeof nodes[0] === 'string' ? nodes[0] : nodes
}

function isTableSeparator(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim())
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function parseBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i += 1
      continue
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i += 1
      continue
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2],
      })
      i += 1
      continue
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') })
      continue
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(trimmed)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i]))
        i += 1
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Paragraph: gather until blank line or next block marker
    const para = [trimmed]
    i += 1
    while (i < lines.length) {
      const next = lines[i].trim()
      if (!next) break
      if (/^---+$/.test(next)) break
      if (/^#{1,3}\s+/.test(next)) break
      if (next.startsWith('> ')) break
      if (next.startsWith('|')) break
      if (/^[-*]\s+/.test(next)) break
      para.push(next)
      i += 1
    }
    blocks.push({ type: 'p', text: para.join(' ') })
  }

  return blocks
}

export default function LegalMarkdown({ source }) {
  const blocks = parseBlocks(source)

  return (
    <div className="cw-legal-doc">
      {blocks.map((block, index) => {
        const key = `b-${index}`

        if (block.type === 'hr') {
          return <hr key={key} />
        }

        if (block.type === 'heading') {
          return createElement(
            `h${block.level}`,
            { key },
            renderInline(block.text, key),
          )
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote key={key}>
              {block.text.split('\n').map((line, li) => (
                <p key={`${key}-q-${li}`}>{renderInline(line, `${key}-q-${li}`)}</p>
              ))}
            </blockquote>
          )
        }

        if (block.type === 'ul') {
          return (
            <ul key={key}>
              {block.items.map((item, ii) => (
                <li key={`${key}-i-${ii}`}>{renderInline(item, `${key}-i-${ii}`)}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'table') {
          return (
            <div key={key} className="cw-legal-doc__table-wrap" role="region" aria-label="Data table">
              <table>
                <thead>
                  <tr>
                    {block.header.map((cell, ci) => (
                      <th key={`${key}-h-${ci}`}>{renderInline(cell, `${key}-h-${ci}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr key={`${key}-r-${ri}`}>
                      {row.map((cell, ci) => (
                        <td key={`${key}-r-${ri}-c-${ci}`}>
                          {renderInline(cell, `${key}-r-${ri}-c-${ci}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return <p key={key}>{renderInline(block.text, key)}</p>
      })}
    </div>
  )
}
