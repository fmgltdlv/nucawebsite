import { deleteAssetIfUnreferenced } from './asset-references'
import { resolveExistingPdfKey } from './asset-select'
import { getAssetUrl, membershipApplicationPdfKey, uploadPdf } from './r2-assets'
import {
  getMembershipApplicationPdfR2Key,
  setMembershipApplicationPdfR2Key,
} from './site-settings'

export function membershipApplicationPdfUrl(r2Key?: string | null): string | null {
  return r2Key ? getAssetUrl(r2Key) : null
}

function parseMembershipPdfFile(body: Record<string, File | string>): File | null {
  const file = body.membership_pdf
  if (file instanceof File && file.size > 0) return file
  return null
}

export async function applyMembershipApplicationPdfChange(
  r2: R2Bucket,
  db: D1Database,
  body: Record<string, File | string>,
  previousKey?: string | null,
): Promise<string | undefined> {
  const previous = previousKey === undefined ? await getMembershipApplicationPdfR2Key(db) : previousKey

  if (body.remove_membership_pdf === '1') {
    if (previous) {
      await deleteAssetIfUnreferenced(r2, db, previous)
      await setMembershipApplicationPdfR2Key(db, null)
    }
    return undefined
  }

  const pdfFile = parseMembershipPdfFile(body)
  if (pdfFile) {
    const key = membershipApplicationPdfKey()
    const upload = await uploadPdf(r2, pdfFile, key)
    if (!upload.ok) return upload.error
    if (previous && previous !== key) {
      await deleteAssetIfUnreferenced(r2, db, previous)
    }
    await setMembershipApplicationPdfR2Key(db, key)
    return undefined
  }

  const existingKey = await resolveExistingPdfKey(r2, body, 'existing_membership_pdf_key')
  if (existingKey && typeof existingKey === 'object') return existingKey.error
  if (typeof existingKey === 'string' && existingKey !== previous) {
    if (previous) await deleteAssetIfUnreferenced(r2, db, previous)
    await setMembershipApplicationPdfR2Key(db, existingKey)
  }

  return undefined
}
