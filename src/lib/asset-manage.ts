import { deleteAssetIfUnreferenced } from './asset-references'
import { parseAssetType, type AssetType } from './assets-index'
import { resolveExistingImageKey, resolveExistingPdfKey } from './asset-select'
import { getDirtRelease, updateDirtRelease } from './dirt-db'
import { applyEventImageUploads, getEventById, updateEvent } from './events'
import { getLeadershipById, updateLeadership } from './leadership-db'
import {
  getLibraryAsset,
  updateLibraryAsset,
} from './library-assets-db'
import { applyMemberLogoChange } from './member-logos'
import { getMemberLogoR2Key, updateMemberLogoKey } from './members-db'
import { dirtPdfKey, leadershipPhotoKey, uploadImage, uploadPdf } from './r2-assets'
import { applySiteLogoChange } from './site-logo'
import { getSiteLogoR2Key, setSiteLogoR2Key } from './site-settings'

export function parseAssetManageRequest(body: Record<string, File | string>): {
  type?: AssetType
  entityId: string
  currentKey: string
  returnType?: AssetType
} {
  const type = parseAssetType(typeof body.asset_type === 'string' ? body.asset_type : undefined)
  const entityId = typeof body.entity_id === 'string' ? body.entity_id.trim() : ''
  const currentKey = typeof body.current_key === 'string' ? body.current_key.trim() : ''
  const returnType = parseAssetType(typeof body.return_type === 'string' ? body.return_type : undefined)
  return { type, entityId, currentKey, returnType }
}

export async function applyAssetManage(
  r2: R2Bucket,
  db: D1Database,
  type: AssetType,
  entityId: string,
  currentKey: string,
  body: Record<string, File | string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  switch (type) {
    case 'library':
      return manageLibraryAsset(r2, db, entityId, currentKey, body)
    case 'site_logo':
      return manageSiteLogo(r2, db, currentKey, body)
    case 'member_logo':
      return manageMemberLogo(r2, db, entityId, currentKey, body)
    case 'dirt_pdf':
      return manageDirtPdf(r2, db, entityId, currentKey, body)
    case 'leadership_photo':
      return manageLeadershipPhoto(r2, db, entityId, currentKey, body)
    case 'event_thumbnail':
      return manageEventImage(r2, db, entityId, 'thumbnail', currentKey, body)
    case 'event_flyer':
      return manageEventImage(r2, db, entityId, 'flyer', currentKey, body)
    default:
      return { ok: false, error: 'Unsupported asset type.' }
  }
}

async function manageLibraryAsset(
  r2: R2Bucket,
  db: D1Database,
  entityId: string,
  currentKey: string,
  body: Record<string, File | string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getLibraryAsset(db, entityId)
  if (!existing || existing.r2_key !== currentKey) {
    return { ok: false, error: 'Library asset not found.' }
  }

  const label = typeof body.label === 'string' ? body.label.trim() : existing.label
  if (!label) return { ok: false, error: 'Label is required.' }

  const file = body.file instanceof File && body.file.size > 0 ? body.file : null
  let nextKey = existing.r2_key
  let contentKind = existing.content_kind

  if (file) {
    const isPdf = file.type === 'application/pdf'
    const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    if (!isPdf && !isImage) {
      return { ok: false, error: 'Upload a PDF or image (JPEG, PNG, WebP, GIF).' }
    }

    // Replace in place so CMS page blocks and other references keep the same key.
    const upload = isPdf
      ? await uploadPdf(r2, file, existing.r2_key)
      : await uploadImage(r2, file, existing.r2_key)
    if (!upload.ok) return { ok: false, error: upload.error }
    contentKind = isPdf ? 'pdf' : 'image'
  }

  const updated = await updateLibraryAsset(db, entityId, {
    label,
    r2_key: nextKey,
    content_kind: contentKind,
  })
  if (!updated) return { ok: false, error: 'Library asset not found.' }

  return { ok: true }
}

async function manageSiteLogo(
  r2: R2Bucket,
  db: D1Database,
  currentKey: string,
  body: Record<string, File | string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const previousKey = await getSiteLogoR2Key(db)
  if (previousKey !== currentKey) {
    return { ok: false, error: 'Site logo has changed. Refresh and try again.' }
  }

  if (body.remove_asset === '1') {
    const error = await applySiteLogoChange(
      r2,
      db,
      (key) => setSiteLogoR2Key(db, key),
      { remove_site_logo: '1' },
      previousKey,
    )
    return error ? { ok: false, error } : { ok: true }
  }

  const file = body.file instanceof File && body.file.size > 0 ? body.file : null
  if (file) {
    const error = await applySiteLogoChange(
      r2,
      db,
      (key) => setSiteLogoR2Key(db, key),
      { site_logo: file },
      previousKey,
    )
    return error ? { ok: false, error } : { ok: true }
  }

  const existingKey = await resolveExistingImageKey(r2, body, 'existing_asset_key')
  if (existingKey && typeof existingKey === 'object') return { ok: false, error: existingKey.error }
  if (typeof existingKey === 'string') {
    await setSiteLogoR2Key(db, existingKey)
    if (previousKey && previousKey !== existingKey) {
      await deleteAssetIfUnreferenced(r2, db, previousKey)
    }
  }

  return { ok: true }
}

async function manageMemberLogo(
  r2: R2Bucket,
  db: D1Database,
  entityId: string,
  currentKey: string,
  body: Record<string, File | string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const previousKey = await getMemberLogoR2Key(db, entityId)
  if ((previousKey ?? '') !== currentKey) {
    return { ok: false, error: 'Member logo has changed. Refresh and try again.' }
  }
  if (!previousKey && body.remove_asset !== '1') {
    const hasFile = body.file instanceof File && body.file.size > 0
    const existingKey = await resolveExistingImageKey(r2, body, 'existing_asset_key')
    if (!hasFile && typeof existingKey !== 'string') {
      return { ok: false, error: 'Member not found.' }
    }
  }

  const mappedBody: Record<string, File | string> = {
    logo: body.file,
    remove_logo: body.remove_asset === '1' ? '1' : '',
    existing_logo_key: typeof body.existing_asset_key === 'string' ? body.existing_asset_key : '',
  }

  const error = await applyMemberLogoChange(
    r2,
    db,
    (id, key) => updateMemberLogoKey(db, id, key),
    entityId,
    mappedBody,
    previousKey,
  )
  return error ? { ok: false, error } : { ok: true }
}

async function manageDirtPdf(
  r2: R2Bucket,
  db: D1Database,
  entityId: string,
  currentKey: string,
  body: Record<string, File | string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getDirtRelease(db, entityId)
  if (!existing) return { ok: false, error: 'Release not found.' }
  if (existing.pdf_r2_key !== currentKey) {
    return { ok: false, error: 'Release PDF has changed. Refresh and try again.' }
  }

  const file = body.file instanceof File && body.file.size > 0 ? body.file : null
  let pdf_r2_key = existing.pdf_r2_key

  if (file) {
    const key = dirtPdfKey(entityId)
    const upload = await uploadPdf(r2, file, key)
    if (!upload.ok) return { ok: false, error: upload.error }
    if (existing.pdf_r2_key !== key) {
      await deleteAssetIfUnreferenced(r2, db, existing.pdf_r2_key)
    }
    pdf_r2_key = key
  } else {
    const existingKey = await resolveExistingPdfKey(r2, body, 'existing_asset_key')
    if (existingKey && typeof existingKey === 'object') return { ok: false, error: existingKey.error }
    if (typeof existingKey === 'string' && existingKey !== existing.pdf_r2_key) {
      await deleteAssetIfUnreferenced(r2, db, existing.pdf_r2_key)
      pdf_r2_key = existingKey
    }
  }

  if (pdf_r2_key !== existing.pdf_r2_key) {
    await updateDirtRelease(db, entityId, {
      title: existing.title,
      summary: existing.summary,
      published_at: existing.published_at,
      pdf_r2_key,
      published: existing.published === 1,
    })
  }

  return { ok: true }
}

async function manageLeadershipPhoto(
  r2: R2Bucket,
  db: D1Database,
  entityId: string,
  currentKey: string,
  body: Record<string, File | string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getLeadershipById(db, entityId)
  if (!existing) return { ok: false, error: 'Leader not found.' }
  if ((existing.photo_r2_key ?? '') !== currentKey) {
    return { ok: false, error: 'Leader photo has changed. Refresh and try again.' }
  }

  let photo_r2_key = existing.photo_r2_key

  if (body.remove_asset === '1') {
    if (photo_r2_key) await deleteAssetIfUnreferenced(r2, db, photo_r2_key)
    photo_r2_key = null
  } else {
    const photo = body.file instanceof File && body.file.size > 0 ? body.file : null
    if (photo) {
      const key = leadershipPhotoKey(entityId, photo.name)
      const upload = await uploadImage(r2, photo, key)
      if (!upload.ok) return { ok: false, error: upload.error }
      if (existing.photo_r2_key) await deleteAssetIfUnreferenced(r2, db, existing.photo_r2_key)
      photo_r2_key = key
    } else {
      const existingKey = await resolveExistingImageKey(r2, body, 'existing_asset_key')
      if (existingKey && typeof existingKey === 'object') return { ok: false, error: existingKey.error }
      if (typeof existingKey === 'string' && existingKey !== existing.photo_r2_key) {
        if (existing.photo_r2_key) await deleteAssetIfUnreferenced(r2, db, existing.photo_r2_key)
        photo_r2_key = existingKey
      }
    }
  }

  if (photo_r2_key !== existing.photo_r2_key) {
    await updateLeadership(db, entityId, {
      name: existing.name,
      role_title: existing.role_title,
      chair_title: existing.chair_title,
      company: existing.company,
      website: existing.website,
      linkedin_url: existing.linkedin_url,
      bio: existing.bio,
      sort_order: existing.sort_order,
      photo_r2_key,
      published: existing.published === 1,
    })
  }

  return { ok: true }
}

async function manageEventImage(
  r2: R2Bucket,
  db: D1Database,
  entityId: string,
  field: 'thumbnail' | 'flyer',
  currentKey: string,
  body: Record<string, File | string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getEventById(db, entityId)
  if (!existing) return { ok: false, error: 'Event not found.' }

  const dbKey =
    field === 'thumbnail' ? (existing.thumbnail_r2_key ?? '') : (existing.flyer_r2_key ?? '')
  if (dbKey !== currentKey) {
    return {
      ok: false,
      error: `${field === 'thumbnail' ? 'Event thumbnail' : 'Event flyer'} has changed. Refresh and try again.`,
    }
  }

  const mappedBody: Record<string, File | string> =
    field === 'thumbnail'
      ? {
          thumbnail: body.file,
          existing_thumbnail_key: body.existing_asset_key,
          remove_thumbnail: body.remove_asset === '1' ? '1' : '',
        }
      : {
          flyer: body.file,
          existing_flyer_key: body.existing_asset_key,
          remove_flyer: body.remove_asset === '1' ? '1' : '',
        }

  const images = await applyEventImageUploads(r2, db, entityId, mappedBody, existing)
  if (images.error) return { ok: false, error: images.error }

  await updateEvent(db, entityId, {
    title: existing.title,
    starts_at: existing.starts_at,
    ends_at: existing.ends_at,
    location: existing.location,
    description: existing.description,
    registration_url: existing.registration_url,
    rsvp_enabled: existing.rsvp_enabled === 1,
    registration_limit: existing.registration_limit,
    published: existing.published === 1,
    repeat_rule: existing.repeat_rule,
    repeat_until: existing.repeat_until,
    committee_key: existing.committee_key,
    latitude: existing.latitude,
    longitude: existing.longitude,
    thumbnail_r2_key: images.thumbnail_r2_key,
    flyer_r2_key: images.flyer_r2_key,
  })

  return { ok: true }
}
