import { raw } from 'hono/html'
import type { ExpandedEventRecord } from './event-repeat'
import { EVENTS_LIST_PAGE_SIZE } from './events'
import { renderMarkdown } from './markdown'
import { parseCommitteeKey } from './committee-pages'

export type TextAlign = 'left' | 'center' | 'right'
export type BlockColor = 'default' | 'muted' | 'accent' | 'primary'
export type BlockFont = 'body' | 'display'
export type CalendarView = 'list' | 'week' | 'month'
export type SectionBackground =
  | 'none'
  | 'muted'
  | 'accent-soft'
  | 'accent'
  | 'primary'
  | 'surface'

export type PageBlock =
  | {
      type: 'heading'
      text: string
      level: 2 | 3 | 4
      align: TextAlign
      color?: BlockColor
      font?: BlockFont
    }
  | { type: 'text'; body: string; align?: TextAlign; color?: BlockColor; font?: BlockFont }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'callout'; title?: string; body: string; style: 'default' | 'muted' | 'accent' }
  | {
      type: 'section'
      title?: string
      muted?: boolean
      background?: SectionBackground
      blocks: PageBlock[]
    }
  | {
      type: 'calendar'
      title?: string
      view: CalendarView
      committee_keys: string[]
    }
  | {
      type: 'hero'
      eyebrow: string
      title: string
      lead: string
      cta_primary_label: string
      cta_primary_href: string
      cta_secondary_label: string
      cta_secondary_href: string
    }
  | {
      type: 'events_feed'
      title: string
      lead: string
      limit: number
    }
  | {
      type: 'dirt_feed'
      title: string
      lead: string
      limit: number
    }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTextAlign(value: unknown): value is TextAlign {
  return value === 'left' || value === 'center' || value === 'right'
}

function isBlockColor(value: unknown): value is BlockColor {
  return value === 'default' || value === 'muted' || value === 'accent' || value === 'primary'
}

function isBlockFont(value: unknown): value is BlockFont {
  return value === 'body' || value === 'display'
}

function isSectionBackground(value: unknown): value is SectionBackground {
  return (
    value === 'none' ||
    value === 'muted' ||
    value === 'accent-soft' ||
    value === 'accent' ||
    value === 'primary' ||
    value === 'surface'
  )
}

function parseBlockColor(value: unknown): BlockColor | undefined {
  return isBlockColor(value) && value !== 'default' ? value : undefined
}

function parseBlockFont(value: unknown): BlockFont | undefined {
  return isBlockFont(value) && value !== 'body' ? value : undefined
}

function sectionBackground(block: {
  muted?: boolean
  background?: unknown
}): SectionBackground {
  if (isSectionBackground(block.background)) return block.background
  return block.muted === true ? 'muted' : 'none'
}

function parseCalendarView(value: unknown): CalendarView {
  if (value === 'week' || value === 'month') return value
  return 'list'
}

function parseCalendarCommitteeKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (key): key is string => typeof key === 'string' && parseCommitteeKey(key) !== null,
  )
}

function parseBlock(value: unknown, allowSection = true): PageBlock | null {
  if (!isObject(value) || typeof value.type !== 'string') return null

  switch (value.type) {
    case 'heading': {
      const level = value.level === 3 || value.level === 4 ? value.level : 2
      const text = typeof value.text === 'string' ? value.text : ''
      const align = isTextAlign(value.align) ? value.align : 'left'
      const color = parseBlockColor(value.color)
      const font = parseBlockFont(value.font)
      return { type: 'heading', text, level, align, color, font }
    }
    case 'text': {
      const body = typeof value.body === 'string' ? value.body : ''
      const align = isTextAlign(value.align) ? value.align : undefined
      const color = parseBlockColor(value.color)
      const font = parseBlockFont(value.font)
      return { type: 'text', body, align, color, font }
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
      const background = sectionBackground(value)
      const muted = background === 'muted'
      const blocks = Array.isArray(value.blocks)
        ? value.blocks
            .map((block) => parseBlock(block, false))
            .filter((block): block is PageBlock => block !== null)
        : []
      return { type: 'section', title, muted, background, blocks }
    }
    case 'calendar': {
      const title = typeof value.title === 'string' ? value.title : undefined
      const view = parseCalendarView(value.view)
      const committee_keys = parseCalendarCommitteeKeys(value.committee_keys)
      return { type: 'calendar', title, view, committee_keys }
    }
    case 'hero':
      return {
        type: 'hero',
        eyebrow: typeof value.eyebrow === 'string' ? value.eyebrow : '',
        title: typeof value.title === 'string' ? value.title : '',
        lead: typeof value.lead === 'string' ? value.lead : '',
        cta_primary_label:
          typeof value.cta_primary_label === 'string' ? value.cta_primary_label : 'Learn more',
        cta_primary_href: typeof value.cta_primary_href === 'string' ? value.cta_primary_href : '/',
        cta_secondary_label:
          typeof value.cta_secondary_label === 'string' ? value.cta_secondary_label : '',
        cta_secondary_href:
          typeof value.cta_secondary_href === 'string' ? value.cta_secondary_href : '/',
      }
    case 'events_feed': {
      const limit = typeof value.limit === 'number' && value.limit > 0 ? value.limit : 3
      return {
        type: 'events_feed',
        title: typeof value.title === 'string' ? value.title : 'Calendar events',
        lead: typeof value.lead === 'string' ? value.lead : '',
        limit,
      }
    }
    case 'dirt_feed': {
      const limit = typeof value.limit === 'number' && value.limit > 0 ? value.limit : 3
      return {
        type: 'dirt_feed',
        title: typeof value.title === 'string' ? value.title : 'THE DIRT',
        lead: typeof value.lead === 'string' ? value.lead : '',
        limit,
      }
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

export function pageBlocksIncludeCalendar(json: string | null | undefined): boolean {
  const blocks = parsePageBlocks(json)
  if (!blocks) return false
  return blocksIncludeCalendar(blocks)
}

function blocksIncludeCalendar(blocks: PageBlock[]): boolean {
  for (const block of blocks) {
    if (block.type === 'calendar') return true
    if (block.type === 'section' && blocksIncludeCalendar(block.blocks)) return true
  }
  return false
}

function todayDateParam(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const CALENDAR_MAP_ASSETS = `
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="" defer></script>
<script src="/event-map-thumbs.js?v=1" defer></script>
`

function renderCalendarBlockHtml(block: PageBlock & { type: 'calendar' }): string {
  const focusDate = todayDateParam()
  const committeeKeys = block.committee_keys.join(',')
  const views: { id: CalendarView; label: string }[] = [
    { id: 'list', label: 'List' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ]

  const title = block.title?.trim()
    ? `<h3 class="page-block-calendar-title">${escapeHtml(block.title.trim())}</h3>`
    : ''

  const viewTabs = views
    .map((item) => {
      const active = block.view === item.id
      return `<button type="button" class="pill${active ? ' pill-active' : ''}" data-view="${item.id}" role="tab" aria-selected="${active ? 'true' : 'false'}">${item.label}</button>`
    })
    .join('')

  const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map((day) => `<span>${day}</span>`)
    .join('')

  const listHidden = block.view !== 'list' ? ' hidden' : ''
  const weekHidden = block.view !== 'week' ? ' hidden' : ''
  const monthHidden = block.view !== 'month' ? ' hidden' : ''

  return `<div class="page-block-calendar" data-view="${block.view}" data-committee-keys="${escapeHtml(committeeKeys)}" data-focus-date="${focusDate}" data-list-page-size="${EVENTS_LIST_PAGE_SIZE}">
${title}
<div class="events-toolbar">
<div class="filter-pills page-calendar-view-tabs" role="tablist" aria-label="Events view">${viewTabs}</div>
</div>
<div class="page-calendar-view page-calendar-view-list" data-view-panel="list"${listHidden} role="tabpanel">
<div class="event-list page-calendar-list"></div>
<p class="prose page-calendar-list-empty" hidden>No upcoming events scheduled.</p>
<nav class="events-pagination page-calendar-pagination" aria-label="Events list pagination" hidden>
<button type="button" class="btn btn-secondary btn-sm page-calendar-page-prev">Previous</button>
<span class="events-page-info page-calendar-page-info"></span>
<button type="button" class="btn btn-secondary btn-sm page-calendar-page-next">Next</button>
</nav>
</div>
<div class="page-calendar-view page-calendar-view-week" data-view-panel="week"${weekHidden} role="tabpanel">
<div class="events-cal-toolbar">
<button type="button" class="btn btn-secondary btn-sm page-calendar-week-prev">Previous week</button>
<h4 class="events-cal-label page-calendar-week-label"></h4>
<button type="button" class="btn btn-secondary btn-sm page-calendar-week-next">Next week</button>
</div>
<div class="page-calendar-week-grid events-week-grid"></div>
</div>
<div class="page-calendar-view page-calendar-view-month" data-view-panel="month"${monthHidden} role="tabpanel">
<div class="events-cal-toolbar">
<button type="button" class="btn btn-secondary btn-sm page-calendar-month-prev">Previous month</button>
<h4 class="events-cal-label page-calendar-month-label"></h4>
<button type="button" class="btn btn-secondary btn-sm page-calendar-month-next">Next month</button>
</div>
<div class="events-month-weekdays" aria-hidden="true">${weekdayHeaders}</div>
<div class="page-calendar-month-grid events-month-grid"></div>
</div>
</div>`
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

function colorClass(color: BlockColor | undefined): string {
  if (!color || color === 'default') return ''
  return ` page-block-color-${color}`
}

function fontClass(font: BlockFont | undefined): string {
  if (!font || font === 'body') return ''
  return ` page-block-font-${font}`
}

function textStyleClass(color?: BlockColor, font?: BlockFont): string {
  return `${colorClass(color)}${fontClass(font)}`
}

function sectionBackgroundClass(background: SectionBackground): string {
  if (background === 'none') return ''
  return ` page-section--bg-${background}`
}

function renderBlocksHtml(blocks: PageBlock[], parentIndex = ''): string {
  return blocks
    .map((block, i) => {
      const index = parentIndex === '' ? String(i) : `${parentIndex}-${i}`
      const inner = renderBlockHtml(block, index)
      return `<div class="cms-preview-block" data-cms-block-index="${index}">${inner}</div>`
    })
    .join('\n')
}

function renderBlockHtml(block: PageBlock, blockIndex: string): string {
  switch (block.type) {
    case 'heading': {
      const tag = block.level === 2 ? 'h2' : block.level === 3 ? 'h3' : 'h4'
      return `<${tag} class="page-block-heading${alignClass(block.align)}${textStyleClass(block.color, block.font)}">${escapeHtml(block.text)}</${tag}>`
    }
    case 'text':
      return `<div class="page-block-text${alignClass(block.align)}${textStyleClass(block.color, block.font)}">${renderMarkdown(block.body)}</div>`
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
      const inner = renderBlocksHtml(block.blocks, blockIndex)
      const background = sectionBackground(block)
      const legacyMuted = background === 'muted' ? ' page-section--muted' : ''
      return `<section class="page-section${legacyMuted}${sectionBackgroundClass(background)}">${title}<div class="page-section-inner">${inner}</div></section>`
    }
    case 'calendar':
      return renderCalendarBlockHtml(block)
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

export function renderPageContent(
  body_md: string,
  body_json: string | null | undefined,
  options?: { calendarEvents?: ExpandedEventRecord[] },
) {
  const blocks = parsePageBlocks(body_json)
  if (blocks) {
    const includeCalendar = blocksIncludeCalendar(blocks)
    const calendarData =
      includeCalendar && options?.calendarEvents
        ? `<script type="application/json" id="page-calendar-events-data">${JSON.stringify(options.calendarEvents).replace(/</g, '\\u003c')}</script>${CALENDAR_MAP_ASSETS}`
        : ''
    return raw(`<div class="page-blocks">${renderBlocksHtml(blocks)}</div>${calendarData}`)
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
      case 'calendar': {
        const filter =
          block.committee_keys.length > 0
            ? ` (${block.committee_keys.join(', ')})`
            : ' (all events)'
        const heading = block.title?.trim() || 'Events calendar'
        parts.push(`## ${heading}${filter}`)
        break
      }
      case 'hero':
        parts.push(`# ${block.title}\n\n${block.lead}`)
        break
      case 'events_feed':
        parts.push(`## ${block.title}\n\n${block.lead}`)
        break
      case 'dirt_feed':
        parts.push(`## ${block.title}\n\n${block.lead}`)
        break
      default:
        break
    }
  }

  return parts.filter(Boolean).join('\n\n')
}
