import { raw } from 'hono/html'

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'img',
  'span',
  'div',
  'figure',
  'figcaption',
  'button',
])

const VOID_TAGS = new Set(['br', 'hr', 'img'])

const GLOBAL_ATTRS = new Set(['class', 'id', 'title', 'aria-label', 'aria-hidden', 'role'])

const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
  button: new Set(['type', 'data-carousel-prev', 'data-carousel-next', 'data-carousel-dot']),
  div: new Set([
    'data-carousel',
    'data-position',
    'data-image-width',
    'data-placement',
    'data-width-pct',
  ]),
  figure: new Set(['data-placement', 'data-width-pct']),
  span: new Set(['style', 'data-carousel-dot']),
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function isSafeHref(href: string): boolean {
  const trimmed = href.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('mailto:')) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isSafeSrc(src: string): boolean {
  const trimmed = src.trim()
  if (trimmed.startsWith('/assets/')) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Allow only color / background-color / width percentage styles. */
function sanitizeStyle(style: string): string | null {
  const allowed: string[] = []
  for (const part of style.split(';')) {
    const [rawProp, ...rest] = part.split(':')
    if (!rawProp || rest.length === 0) continue
    const prop = rawProp.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (!value) continue
    if (prop === 'color' || prop === 'background-color') {
      if (/^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|[a-z]+)$/i.test(value)) {
        allowed.push(`${prop}: ${value}`)
      }
    } else if (prop === 'width') {
      if (/^\d{1,3}%$/.test(value) || /^(auto|100%)$/.test(value)) {
        allowed.push(`${prop}: ${value}`)
      }
    } else if (prop === 'text-align') {
      if (/^(left|center|right|justify)$/i.test(value)) {
        allowed.push(`${prop}: ${value}`)
      }
    }
  }
  return allowed.length > 0 ? allowed.join('; ') : null
}

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'tag'; raw: string; name: string; closing: boolean; selfClosing: boolean; attrs: string }

function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    if (match[0].startsWith('<!--')) continue
    if (match[1]) {
      const name = match[1].toLowerCase()
      const closing = match[0].startsWith('</')
      const attrs = match[2] ?? ''
      const selfClosing = /\/\s*>$/.test(match[0]) || VOID_TAGS.has(name)
      tokens.push({ kind: 'tag', raw: match[0], name, closing, selfClosing, attrs })
    } else if (match[3]) {
      tokens.push({ kind: 'text', value: match[3] })
    }
  }
  return tokens
}

function parseAttrs(attrString: string): Array<{ name: string; value: string }> {
  const attrs: Array<{ name: string; value: string }> = []
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(attrString))) {
    attrs.push({
      name: match[1].toLowerCase(),
      value: match[2] ?? match[3] ?? match[4] ?? '',
    })
  }
  return attrs
}

function filterAttrs(tag: string, attrString: string): string {
  const allowed = new Set([...GLOBAL_ATTRS, ...(TAG_ATTRS[tag] ?? [])])
  // data-* always allowed on media wrappers
  const out: string[] = []
  for (const { name, value } of parseAttrs(attrString)) {
    const isData = name.startsWith('data-')
    if (!allowed.has(name) && !isData && name !== 'style') continue

    if (name === 'href') {
      if (!isSafeHref(value)) continue
      out.push(`href="${escapeAttr(value)}"`)
      continue
    }
    if (name === 'src') {
      if (!isSafeSrc(value)) continue
      out.push(`src="${escapeAttr(value)}"`)
      continue
    }
    if (name === 'style') {
      const cleaned = sanitizeStyle(value)
      if (cleaned) out.push(`style="${escapeAttr(cleaned)}"`)
      continue
    }
    if (name === 'target') {
      if (value === '_blank') {
        out.push('target="_blank"')
        out.push('rel="noopener noreferrer"')
      }
      continue
    }
    if (name === 'rel') continue // set with target
    if (name === 'type' && tag === 'button') {
      out.push('type="button"')
      continue
    }
    out.push(`${name}="${escapeAttr(value)}"`)
  }
  return out.length ? ` ${out.join(' ')}` : ''
}

/** Workers-safe HTML allowlist sanitizer for DIRT post bodies. */
export function sanitizePostHtml(html: string): string {
  if (!html?.trim()) return ''

  const tokens = tokenize(html)
  const openStack: string[] = []
  const parts: string[] = []

  for (const token of tokens) {
    if (token.kind === 'text') {
      parts.push(token.value)
      continue
    }

    if (!ALLOWED_TAGS.has(token.name)) continue

    if (token.closing) {
      const idx = openStack.lastIndexOf(token.name)
      if (idx === -1) continue
      while (openStack.length > idx) {
        const name = openStack.pop()!
        parts.push(`</${name}>`)
      }
      continue
    }

    const attrs = filterAttrs(token.name, token.attrs)
    if (VOID_TAGS.has(token.name) || token.selfClosing) {
      parts.push(`<${token.name}${attrs}>`)
      continue
    }

    openStack.push(token.name)
    parts.push(`<${token.name}${attrs}>`)
  }

  while (openStack.length) {
    parts.push(`</${openStack.pop()}>`)
  }

  return parts.join('')
}

export function postHtmlToSafeRaw(html: string | null | undefined, fallbackMd?: string) {
  const sanitized = sanitizePostHtml(html ?? '')
  if (sanitized) return raw(sanitized)
  if (fallbackMd?.trim()) {
    // Lazy import avoided — caller can pass already-rendered markdown via fallback path.
    return null
  }
  return raw('')
}
