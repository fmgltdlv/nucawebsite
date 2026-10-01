const MAILTO = 'mailto:'

/**
 * Allow http(s), site-relative paths, fragments, and mailto.
 * Rejects javascript:, data:, and protocol-relative URLs.
 */
export function safeHref(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/[\r\n\0]/.test(trimmed) || trimmed.includes('\\')) return null
  if (trimmed.startsWith('//')) return null

  if (trimmed.startsWith('#')) return trimmed

  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null
    return trimmed
  }

  const lower = trimmed.toLowerCase()
  if (lower.startsWith(MAILTO)) {
    const rest = trimmed.slice(MAILTO.length)
    if (!rest || /[\r\n\0]/.test(rest)) return null
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:' || url.protocol === 'https:') return trimmed
  } catch {
    return null
  }
  return null
}

export function optionalSafeHref(raw: string | null | undefined): string | undefined {
  const safe = safeHref(raw)
  return safe ?? undefined
}
