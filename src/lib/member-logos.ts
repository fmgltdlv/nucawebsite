export const MEMBER_LOGO_MAX_BYTES = 2 * 1024 * 1024

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

export function memberLogoPublicPath(memberId: string): string {
  return `/files/members/${memberId}/logo`
}

export function memberLogoUrl(memberId: string, logoR2Key?: string | null): string | undefined {
  return logoR2Key ? memberLogoPublicPath(memberId) : undefined
}

export function parseLogoFile(body: Record<string, File | string>): File | null {
  const logo = body.logo
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

export async function uploadMemberLogo(
  r2: R2Bucket,
  memberId: string,
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

  const key = `members/${memberId}/logo.${ext}`
  await r2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType },
  })

  return { ok: true, key }
}

export async function deleteR2Object(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key)
}

export async function applyMemberLogoChange(
  r2: R2Bucket,
  updateLogoKey: (memberId: string, key: string | null) => Promise<void>,
  memberId: string,
  body: Record<string, File | string>,
  previousKey?: string | null,
): Promise<string | undefined> {
  if (body.remove_logo === '1') {
    if (previousKey) {
      await deleteR2Object(r2, previousKey)
      await updateLogoKey(memberId, null)
    }
    return undefined
  }

  const logoFile = parseLogoFile(body)
  if (!logoFile) return undefined

  const uploaded = await uploadMemberLogo(r2, memberId, logoFile)
  if (!uploaded.ok) return uploaded.error

  await updateLogoKey(memberId, uploaded.key)
  if (previousKey && previousKey !== uploaded.key) {
    await deleteR2Object(r2, previousKey)
  }
  return undefined
}
