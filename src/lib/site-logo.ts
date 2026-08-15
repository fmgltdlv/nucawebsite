import { getAssetUrl } from './r2-assets'
import { deleteR2Object, MEMBER_LOGO_MAX_BYTES } from './member-logos'

const ALLOWED_LOGO_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export const DEFAULT_SITE_LOGO_URL = '/images/nuca-logo.png'

export const DEFAULT_LOGO_SIZE_PERCENT = 100
export const LOGO_SIZE_MIN_PERCENT = 50
export const LOGO_SIZE_MAX_PERCENT = 400

export function parseLogoSizePercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return DEFAULT_LOGO_SIZE_PERCENT
  return Math.min(LOGO_SIZE_MAX_PERCENT, Math.max(LOGO_SIZE_MIN_PERCENT, Math.round(n)))
}

export function logoSizeScale(percent?: number): number {
  return parseLogoSizePercent(percent ?? DEFAULT_LOGO_SIZE_PERCENT) / 100
}

export function siteLogoUrl(r2Key?: string | null): string | undefined {
  return r2Key ? getAssetUrl(r2Key) : undefined
}

export function resolveSiteLogoUrl(r2Key?: string | null): string {
  return siteLogoUrl(r2Key) ?? DEFAULT_SITE_LOGO_URL
}

export function parseSiteLogoFile(body: Record<string, File | string>): File | null {
  const logo = body.site_logo
  if (logo instanceof File && logo.size > 0) return logo
  return null
}

function extFromFile(file: File): string | null {
  const fromMime = MIME_TO_EXT[file.type]
  if (fromMime) return fromMime

  const match = /\.(png|jpe?g|webp|svg)$/i.exec(file.name)
  if (!match) return null
  const ext = match[1].toLowerCase()
  if (ext === 'jpeg') return 'jpg'
  return ext
}

function contentTypeForFile(file: File): string | null {
  if (file.type && ALLOWED_LOGO_TYPES.has(file.type)) return file.type

  const ext = extFromFile(file)
  const extToMime: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return ext ? (extToMime[ext] ?? null) : null
}

export async function uploadSiteLogo(
  r2: R2Bucket,
  file: File,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  if (file.size > MEMBER_LOGO_MAX_BYTES) {
    return { ok: false, error: 'Logo must be 2 MB or smaller.' }
  }

  const contentType = contentTypeForFile(file)
  if (!contentType) {
    return { ok: false, error: 'Logo must be PNG, JPEG, WebP, or SVG.' }
  }

  const ext = extFromFile(file)
  if (!ext) return { ok: false, error: 'Unsupported image type.' }

  const key = `site/logo.${ext}`
  await r2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType },
  })

  return { ok: true, key }
}

export async function applySiteLogoChange(
  r2: R2Bucket,
  db: D1Database,
  updateLogoKey: (key: string | null) => Promise<void>,
  body: Record<string, File | string>,
  previousKey?: string | null,
): Promise<string | undefined> {
  if (body.remove_site_logo === '1') {
    if (previousKey) {
      await deleteR2Object(r2, db, previousKey)
      await updateLogoKey(null)
    }
    return undefined
  }

  const logoFile = parseSiteLogoFile(body)
  if (!logoFile) return undefined

  const uploaded = await uploadSiteLogo(r2, logoFile)
  if (!uploaded.ok) return uploaded.error

  await updateLogoKey(uploaded.key)
  if (previousKey && previousKey !== uploaded.key) {
    await deleteR2Object(r2, db, previousKey)
  }
  return undefined
}
