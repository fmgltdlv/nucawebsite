import { getAssetUrl, uploadImage, uploadPdf } from './r2-assets'
import { createLibraryAsset, libraryAssetKey } from './library-assets-db'

export type LibraryAssetApiEntry = {
  key: string
  label: string
  type: string
  url: string
}

type UploadResult =
  | { ok: true; asset: LibraryAssetApiEntry }
  | { ok: false; error: string }

export function parseUploadFiles(value: unknown): File[] {
  if (value instanceof File) {
    return value.size > 0 ? [value] : []
  }
  if (Array.isArray(value)) {
    return value.filter((file): file is File => file instanceof File && file.size > 0)
  }
  return []
}

export async function uploadLibraryAsset(
  r2: R2Bucket,
  db: D1Database,
  file: File,
  options: { label?: string; expectedKind?: 'image' | 'pdf' },
): Promise<UploadResult> {
  if (file.size === 0) {
    return { ok: false, error: 'Choose a file to upload.' }
  }

  const isPdf = file.type === 'application/pdf'
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)

  if (!isPdf && !isImage) {
    return { ok: false, error: 'Upload a PDF or image (JPEG, PNG, WebP, GIF).' }
  }

  const contentKind = isPdf ? 'pdf' : 'image'

  if (options.expectedKind && contentKind !== options.expectedKind) {
    return {
      ok: false,
      error:
        options.expectedKind === 'pdf'
          ? 'This picker accepts PDFs only.'
          : 'This picker accepts images only.',
    }
  }

  const label =
    options.label?.trim() ||
    (file.name.trim() ? file.name.trim() : contentKind === 'pdf' ? 'PDF' : 'Image')

  const key = libraryAssetKey(file.name)
  const uploadResult = isPdf
    ? await uploadPdf(r2, file, key)
    : await uploadImage(r2, file, key)

  if (!uploadResult.ok) {
    return { ok: false, error: uploadResult.error }
  }

  await createLibraryAsset(db, {
    r2_key: key,
    label,
    content_kind: contentKind,
  })

  return {
    ok: true,
    asset: {
      key,
      label,
      type: 'library',
      url: getAssetUrl(key),
    },
  }
}
