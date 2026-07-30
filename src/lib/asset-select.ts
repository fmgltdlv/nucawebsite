import { getAssetObject } from './r2-assets'

const IMAGE_KEY_PATTERN = /\.(png|jpe?g|webp|gif|svg)$/i
const PDF_KEY_PATTERN = /\.pdf$/i

export function parseExistingAssetKey(
  body: Record<string, File | string>,
  fieldName: string,
): string | null {
  const value = body[fieldName]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

export function isValidAssetKey(key: string): boolean {
  if (!key || key.includes('..') || key.startsWith('/')) return false
  return /^[a-z0-9_\-/.]+$/i.test(key)
}

export function isImageAssetKey(key: string): boolean {
  return isValidAssetKey(key) && IMAGE_KEY_PATTERN.test(key)
}

export function isPdfAssetKey(key: string): boolean {
  return isValidAssetKey(key) && PDF_KEY_PATTERN.test(key)
}

export async function assetKeyExists(r2: R2Bucket, key: string): Promise<boolean> {
  return (await getAssetObject(r2, key)) !== null
}

export async function resolveExistingImageKey(
  r2: R2Bucket,
  body: Record<string, File | string>,
  fieldName: string,
): Promise<string | null | { error: string }> {
  const key = parseExistingAssetKey(body, fieldName)
  if (!key) return null
  if (!isImageAssetKey(key)) return { error: 'Invalid image asset selected.' }
  if (!(await assetKeyExists(r2, key))) return { error: 'Selected image was not found.' }
  return key
}

export async function resolveExistingPdfKey(
  r2: R2Bucket,
  body: Record<string, File | string>,
  fieldName: string,
): Promise<string | null | { error: string }> {
  const key = parseExistingAssetKey(body, fieldName)
  if (!key) return null
  if (!isPdfAssetKey(key)) return { error: 'Invalid PDF asset selected.' }
  if (!(await assetKeyExists(r2, key))) return { error: 'Selected PDF was not found.' }
  return key
}
