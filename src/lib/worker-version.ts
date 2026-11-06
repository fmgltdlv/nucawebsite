import type { Env } from '../env'
import { formatAdminDateTime } from './format'

export type ServerLastUpdated = {
  iso: string | null
  label: string
}

function parseVersionTimestamp(raw: string): Date | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed)
    const ms = trimmed.length <= 10 ? n * 1000 : n
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Worker version upload time, or a local-dev fallback when metadata is absent. */
export function readServerLastUpdated(env: Env): ServerLastUpdated {
  const date = parseVersionTimestamp(env.CF_VERSION_METADATA?.timestamp ?? '')
  if (!date) return { iso: null, label: 'Local development' }
  const iso = date.toISOString()
  return { iso, label: formatAdminDateTime(iso) }
}
