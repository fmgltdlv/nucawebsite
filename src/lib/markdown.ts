import { raw } from 'hono/html'
import { escapeHtml, escapeAttr } from './security/html'
import { safeHref } from './security/urls'

function applyBoldItalicCode(escaped: string): string {
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function inlineMarkdown(text: string): string {
  const parts: string[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    parts.push(applyBoldItalicCode(escapeHtml(text.slice(last, match.index))))
    const label = applyBoldItalicCode(escapeHtml(match[1]))
    const href = safeHref(match[2])
    parts.push(href ? `<a href="${escapeAttr(href)}">${label}</a>` : label)
    last = match.index + match[0].length
  }
  parts.push(applyBoldItalicCode(escapeHtml(text.slice(last))))
  return parts.join('')
}

/** Minimal markdown → HTML for FAQ answers and page bodies. */
export function renderMarkdown(md: string): string {
  const trimmed = md.trim()
  if (!trimmed) return ''

  const blocks = trimmed.split(/\n\n+/)
  const parts: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      const items = lines
        .map((line) => `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`)
        .join('')
      parts.push(`<ul>${items}</ul>`)
      continue
    }

    if (/^#{1,3}\s+/.test(lines[0])) {
      const level = lines[0].match(/^#+/)?.[0].length ?? 1
      const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
      parts.push(`<${tag}>${inlineMarkdown(lines[0].replace(/^#{1,3}\s+/, ''))}</${tag}>`)
      if (lines.length > 1) {
        parts.push(`<p>${lines.slice(1).map((line) => inlineMarkdown(line)).join('<br>')}</p>`)
      }
      continue
    }

    parts.push(`<p>${lines.map((line) => inlineMarkdown(line)).join('<br>')}</p>`)
  }

  return parts.join('\n')
}

export function markdownToSafeHtml(md: string) {
  return raw(renderMarkdown(md))
}

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

/** Escape plain text, then auto-link email addresses for safe HTML output. */
export function plainTextToSafeHtml(text: string) {
  const escaped = escapeHtml(text)
  const linked = escaped.replace(EMAIL_PATTERN, (email) => {
    const trimmed = email.replace(/[.,;:!?)]+$/, '')
    const trailing = email.slice(trimmed.length)
    return `<a href="mailto:${trimmed}">${trimmed}</a>${trailing}`
  })
  return raw(linked)
}
