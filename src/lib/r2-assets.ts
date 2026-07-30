const MAX_PDF_BYTES = 25 * 1024 * 1024
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function getAssetUrl(key: string): string {
  return `/assets/${key}`
}

export async function uploadAsset(
  r2: R2Bucket,
  file: File,
  key: string,
  options?: { maxBytes?: number; allowedTypes?: string[] },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const maxBytes = options?.maxBytes ?? MAX_PDF_BYTES
  const allowedTypes = options?.allowedTypes ?? ['application/pdf']

  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: `File type not allowed: ${file.type || 'unknown'}` }
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).` }
  }

  const buffer = await file.arrayBuffer()
  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  })
  return { ok: true }
}

export async function uploadPdf(r2: R2Bucket, file: File, key: string) {
  return uploadAsset(r2, file, key, {
    maxBytes: MAX_PDF_BYTES,
    allowedTypes: ['application/pdf'],
  })
}

export async function uploadImage(r2: R2Bucket, file: File, key: string) {
  return uploadAsset(r2, file, key, {
    maxBytes: MAX_IMAGE_BYTES,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })
}

export async function deleteAsset(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key)
}

export async function getAssetObject(r2: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return (await r2.get(key)) ?? null
}

export function dirtPdfKey(id: string): string {
  return `dirt/${id}.pdf`
}

export function leadershipPhotoKey(id: string, filename: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg'
  return `leadership/${id}.${ext}`
}
