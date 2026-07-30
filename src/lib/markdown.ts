import { raw } from 'hono/html'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
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
        parts.push(
          `<p>${lines
            .slice(1)
            .map((l) => inlineMarkdown(l))
            .join('<br>')}</p>`,
        )
      }
      continue
    }

    parts.push(
      `<p>${lines.map((line) => inlineMarkdown(escapeHtml(line))).join('<br>')}</p>`,
    )
  }

  return parts.join('\n')
}

export function markdownToSafeHtml(md: string) {
  return raw(renderMarkdown(md))
}
