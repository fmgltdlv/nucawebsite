import { raw } from 'hono/html'
import { renderMarkdown } from './markdown'

export type TextAlign = 'left' | 'center' | 'right'

export type PageBlock =
  | { type: 'heading'; text: string; level: 2 | 3 | 4; align: TextAlign }
  | { type: 'text'; body: string; align?: TextAlign }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'callout'; title?: string; body: string; style: 'default' | 'muted' | 'accent' }
  | { type: 'section'; title?: string; muted?: boolean; blocks: PageBlock[] }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTextAlign(value: unknown): value is TextAlign {
  return value === 'left' || value === 'center' || value === 'right'
}

function parseBlock(value: unknown, allowSection = true): PageBlock | null {
  if (!isObject(value) || typeof value.type !== 'string') return null

  switch (value.type) {
    case 'heading': {
      const level = value.level === 3 || value.level === 4 ? value.level : 2
      const text = typeof value.text === 'string' ? value.text : ''
      const align = isTextAlign(value.align) ? value.align : 'left'
      return { type: 'heading', text, level, align }
    }
    case 'text': {
      const body = typeof value.body === 'string' ? value.body : ''
      const align = isTextAlign(value.align) ? value.align : undefined
      return { type: 'text', body, align }
    }
    case 'list': {
      const items = Array.isArray(value.items)
        ? value.items.filter((item): item is string => typeof item === 'string')
        : []
      return { type: 'list', ordered: value.ordered === true, items }
    }
    case 'callout': {
      const body = typeof value.body === 'string' ? value.body : ''
      const title = typeof value.title === 'string' ? value.title : undefined
      const style =
        value.style === 'muted' || value.style === 'accent' ? value.style : 'default'
      return { type: 'callout', title, body, style }
    }
    case 'section': {
      if (!allowSection) return null
      const title = typeof value.title === 'string' ? value.title : undefined
      const muted = value.muted === true
      const blocks = Array.isArray(value.blocks)
        ? value.blocks
            .map((block) => parseBlock(block, false))
            .filter((block): block is PageBlock => block !== null)
        : []
      return { type: 'section', title, muted, blocks }
    }
    default:
      return null
  }
}

export function parsePageBlocks(json: string | null | undefined): PageBlock[] | null {
  if (!json?.trim()) return null
  try {
    const parsed = JSON.parse(json) as unknown
    if (!Array.isArray(parsed)) return null
    const blocks = parsed
      .map((block) => parseBlock(block))
      .filter((block): block is PageBlock => block !== null)
    return blocks.length > 0 ? blocks : null
  } catch {
    return null
  }
}

export function serializePageBlocks(blocks: PageBlock[]): string {
  return JSON.stringify(blocks)
}

/** Convert legacy markdown into starter blocks for the editor. */
export function blocksFromMarkdown(md: string): PageBlock[] {
  const trimmed = md.trim()
  if (!trimmed) return []

  const blocks: PageBlock[] = []
  const parts = trimmed.split(/\n\n+/)

  for (const part of parts) {
    const lines = part.split('\n')
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      blocks.push({
        type: 'list',
        ordered: false,
        items: lines.map((line) => line.replace(/^[-*]\s+/, '')),
      })
      continue
    }

    const heading = lines[0].match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length === 1 ? 2 : heading[1].length === 2 ? 3 : 4
      blocks.push({
        type: 'heading',
        text: heading[2],
        level: level as 2 | 3 | 4,
        align: 'left',
      })
      if (lines.length > 1) {
        blocks.push({ type: 'text', body: lines.slice(1).join('\n') })
      }
      continue
    }

    blocks.push({ type: 'text', body: part })
  }

  return blocks
}

function alignClass(align: TextAlign | undefined): string {
  if (align === 'center') return ' page-block-align-center'
  if (align === 'right') return ' page-block-align-right'
  return ''
}

function renderBlocksHtml(blocks: PageBlock[]): string {
  return blocks.map((block) => renderBlockHtml(block)).join('\n')
}

function renderBlockHtml(block: PageBlock): string {
  switch (block.type) {
    case 'heading': {
      const tag = block.level === 2 ? 'h2' : block.level === 3 ? 'h3' : 'h4'
      return `<${tag} class="page-block-heading${alignClass(block.align)}">${escapeHtml(block.text)}</${tag}>`
    }
    case 'text':
      return `<div class="page-block-text${alignClass(block.align)}">${renderMarkdown(block.body)}</div>`
    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul'
      const items = block.items
        .map((item) => `<li>${renderMarkdown(item)}</li>`)
        .join('')
      return `<${tag} class="page-block-list">${items}</${tag}>`
    }
    case 'callout': {
      const title = block.title
        ? `<h3 class="page-callout-title">${escapeHtml(block.title)}</h3>`
        : ''
      return `<aside class="page-callout page-callout--${block.style}">${title}<div class="page-callout-body">${renderMarkdown(block.body)}</div></aside>`
    }
    case 'section': {
      const title = block.title
        ? `<h2 class="page-section-title">${escapeHtml(block.title)}</h2>`
        : ''
      const inner = renderBlocksHtml(block.blocks)
      const muted = block.muted ? ' page-section--muted' : ''
      return `<section class="page-section${muted}">${title}<div class="page-section-inner">${inner}</div></section>`
    }
    default:
      return ''
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderPageContent(body_md: string, body_json: string | null | undefined) {
  const blocks = parsePageBlocks(body_json)
  if (blocks) {
    return raw(`<div class="page-blocks">${renderBlocksHtml(blocks)}</div>`)
  }
  if (body_md.trim()) {
    return raw(`<div class="page-blocks">${renderMarkdown(body_md)}</div>`)
  }
  return raw('')
}

export function blocksToMarkdown(blocks: PageBlock[]): string {
  const parts: string[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        const hashes = '#'.repeat(block.level - 1)
        parts.push(`${hashes} ${block.text}`)
        break
      }
      case 'text':
        if (block.body.trim()) parts.push(block.body.trim())
        break
      case 'list': {
        const lines = block.items.map((item, index) =>
          block.ordered ? `${index + 1}. ${item}` : `- ${item}`,
        )
        if (lines.length > 0) parts.push(lines.join('\n'))
        break
      }
      case 'callout': {
        const title = block.title ? `**${block.title}**\n\n` : ''
        parts.push(`${title}${block.body.trim()}`)
        break
      }
      case 'section': {
        if (block.title) parts.push(`## ${block.title}`)
        parts.push(blocksToMarkdown(block.blocks))
        break
      }
      default:
        break
    }
  }

  return parts.filter(Boolean).join('\n\n')
}
