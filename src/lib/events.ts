import { parseCommitteeKey } from './committee-pages'
import { getCommitteeByKey } from './committees-db'
import { expandEventOccurrences, type ExpandedEventRecord } from './event-repeat'
import { geocodeClarkCountyAddress } from './geocode'
import { resolveExistingImageKey } from './asset-select'
import {
  deleteAsset,
  eventFlyerKey,
  eventThumbnailKey,
  getAssetUrl,
  uploadImage,
} from './r2-assets'

export type EventRecord = {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  location: string | null
  description: string | null
  registration_url: string | null
  published: number
  repeat_rule: string | null
  repeat_until: string | null
  thumbnail_r2_key: string | null
  flyer_r2_key: string | null
  latitude: number | null
  longitude: number | null
  committee_key: string | null
}

export type EventOccurrenceView = {
  master: EventRecord
  starts_at: string
  ends_at: string | null
}

export const EVENTS_LIST_PAGE_SIZE = 5

const EVENT_COLUMNS = `id, title, starts_at, ends_at, location, description, registration_url, published, repeat_rule, repeat_until, thumbnail_r2_key, flyer_r2_key, latitude, longitude, committee_key`

export async function resolveEventCommitteeKey(
  db: D1Database,
  value: unknown,
): Promise<string | null> {
  if (typeof value !== 'string') return null
  const key = parseCommitteeKey(value.trim())
  if (!key) return null
  const committee = await getCommitteeByKey(db, key)
  return committee ? committee.key : null
}

function filterEventsByCommittee(
  events: EventRecord[],
  committeeKey?: string | null,
): EventRecord[] {
  if (!committeeKey) return events
  return events.filter((event) => event.committee_key === committeeKey)
}

export function filterEventsByCommitteeKeys(
  events: EventRecord[],
  committeeKeys: string[],
): EventRecord[] {
  if (committeeKeys.length === 0) return events
  const allowed = new Set(committeeKeys)
  return events.filter((event) => event.committee_key != null && allowed.has(event.committee_key))
}

async function listPublishedMasterEvents(db: D1Database): Promise<EventRecord[]> {
  const { results } = await db
    .prepare(`SELECT ${EVENT_COLUMNS} FROM events WHERE published = 1 ORDER BY starts_at ASC LIMIT 500`)
    .all<EventRecord>()
  return results ?? []
}

function upcomingOccurrences(events: EventRecord[]): ExpandedEventRecord[] {
  return expandEventOccurrences(events, { upcomingOnly: true })
}

export type EventThumbnail =
  | { kind: 'image'; url: string }
  | { kind: 'map'; latitude: number; longitude: number }

export function eventThumbnail(
  event: Pick<EventRecord, 'thumbnail_r2_key' | 'latitude' | 'longitude'>,
): EventThumbnail | null {
  if (event.thumbnail_r2_key) {
    return { kind: 'image', url: getAssetUrl(event.thumbnail_r2_key) }
  }
  if (event.latitude != null && event.longitude != null) {
    return { kind: 'map', latitude: event.latitude, longitude: event.longitude }
  }
  return null
}

export function eventThumbnailUrl(
  event: Pick<EventRecord, 'thumbnail_r2_key' | 'latitude' | 'longitude'>,
): string | undefined {
  const thumbnail = eventThumbnail(event)
  return thumbnail?.kind === 'image' ? thumbnail.url : undefined
}

export function eventFlyerUrl(event: Pick<EventRecord, 'flyer_r2_key'>): string | undefined {
  return event.flyer_r2_key ? getAssetUrl(event.flyer_r2_key) : undefined
}

export function eventPublicHref(event: Pick<ExpandedEventRecord, 'series_id' | 'starts_at'>): string {
  return `/events/${event.series_id}?at=${encodeURIComponent(event.starts_at)}`
}

export async function countUpcomingEvents(
  db: D1Database,
  committeeKey?: string | null,
): Promise<number> {
  const events = filterEventsByCommittee(await listPublishedMasterEvents(db), committeeKey)
  return upcomingOccurrences(events).length
}

export async function listUpcomingEventsPage(
  db: D1Database,
  page: number,
  pageSize = EVENTS_LIST_PAGE_SIZE,
  committeeKey?: string | null,
): Promise<ExpandedEventRecord[]> {
  const events = filterEventsByCommittee(await listPublishedMasterEvents(db), committeeKey)
  const offset = Math.max(0, (Math.max(1, page) - 1) * pageSize)
  return upcomingOccurrences(events).slice(offset, offset + pageSize)
}

export async function listPublishedEventsForCalendar(
  db: D1Database,
  committeeKey?: string | null,
): Promise<ExpandedEventRecord[]> {
  const events = filterEventsByCommittee(await listPublishedMasterEvents(db), committeeKey)
  return expandEventOccurrences(events)
}

export async function listUpcomingEvents(
  db: D1Database,
  limit = 50,
  committeeKey?: string | null,
): Promise<ExpandedEventRecord[]> {
  const events = filterEventsByCommittee(await listPublishedMasterEvents(db), committeeKey)
  return upcomingOccurrences(events).slice(0, limit)
}

export async function listAllEventsForAdmin(db: D1Database): Promise<EventRecord[]> {
  const { results } = await db
    .prepare(`SELECT ${EVENT_COLUMNS} FROM events ORDER BY starts_at DESC LIMIT 100`)
    .all<EventRecord>()
  return results ?? []
}

export async function getEventById(db: D1Database, id: string): Promise<EventRecord | null> {
  return (
    (await db
      .prepare(`SELECT ${EVENT_COLUMNS} FROM events WHERE id = ?`)
      .bind(id)
      .first<EventRecord>()) ?? null
  )
}

export async function getPublishedEventById(db: D1Database, id: string): Promise<EventRecord | null> {
  const event = await getEventById(db, id)
  if (!event || event.published !== 1) return null
  return event
}

export function resolveEventOccurrence(master: EventRecord, at?: string | null): EventOccurrenceView | null {
  if (!at) {
    return { master, starts_at: master.starts_at, ends_at: master.ends_at }
  }

  const expanded = expandEventOccurrences([master], { upcomingOnly: false })
  const match = expanded.find((occurrence) => occurrence.starts_at === at)
  if (!match) return null

  return {
    master,
    starts_at: match.starts_at,
    ends_at: match.ends_at,
  }
}

export function parseManualCoordinates(
  latitude: unknown,
  longitude: unknown,
): { latitude: number; longitude: number } | null {
  const lat = typeof latitude === 'string' ? Number(latitude) : typeof latitude === 'number' ? latitude : NaN
  const lng =
    typeof longitude === 'string' ? Number(longitude) : typeof longitude === 'number' ? longitude : NaN
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { latitude: lat, longitude: lng }
}

export async function resolveEventCoordinates(
  location: string | null,
  existing?: EventRecord | null,
): Promise<{ latitude: number | null; longitude: number | null }> {
  const trimmed = location?.trim() ?? ''
  if (!trimmed) return { latitude: null, longitude: null }

  if (
    existing &&
    existing.location?.trim() === trimmed &&
    existing.latitude != null &&
    existing.longitude != null
  ) {
    return { latitude: existing.latitude, longitude: existing.longitude }
  }

  const geocoded = await geocodeClarkCountyAddress(trimmed).catch(() => null)
  if (!geocoded) return { latitude: null, longitude: null }

  return { latitude: geocoded.lat, longitude: geocoded.lng }
}

export async function resolveEventFormCoordinates(
  location: string | null,
  options?: {
    existing?: EventRecord | null
    manual?: { latitude: number; longitude: number } | null
    skipMap?: boolean
  },
): Promise<{ latitude: number | null; longitude: number | null }> {
  if (options?.manual) return options.manual
  if (options?.skipMap) return { latitude: null, longitude: null }
  return resolveEventCoordinates(location, options?.existing)
}

export async function applyEventImageUploads(
  r2: R2Bucket,
  eventId: string,
  body: Record<string, File | string>,
  existing?: EventRecord | null,
): Promise<{ thumbnail_r2_key: string | null; flyer_r2_key: string | null; error?: string }> {
  let thumbnail_r2_key = existing?.thumbnail_r2_key ?? null
  let flyer_r2_key = existing?.flyer_r2_key ?? null

  if (body.remove_thumbnail === '1') {
    if (thumbnail_r2_key) await deleteAsset(r2, thumbnail_r2_key)
    thumbnail_r2_key = null
  } else {
    const thumbnail = body.thumbnail
    if (thumbnail instanceof File && thumbnail.size > 0) {
      const key = eventThumbnailKey(eventId, thumbnail.name)
      const upload = await uploadImage(r2, thumbnail, key)
      if (upload.ok) {
        if (thumbnail_r2_key && thumbnail_r2_key !== key) await deleteAsset(r2, thumbnail_r2_key)
        thumbnail_r2_key = key
      }
    } else {
      const existingKey = await resolveExistingImageKey(r2, body, 'existing_thumbnail_key')
      if (existingKey && typeof existingKey === 'object') {
        return { thumbnail_r2_key, flyer_r2_key, error: existingKey.error }
      }
      if (typeof existingKey === 'string') {
        if (thumbnail_r2_key && thumbnail_r2_key !== existingKey) await deleteAsset(r2, thumbnail_r2_key)
        thumbnail_r2_key = existingKey
      }
    }
  }

  if (body.remove_flyer === '1') {
    if (flyer_r2_key) await deleteAsset(r2, flyer_r2_key)
    flyer_r2_key = null
  } else {
    const flyer = body.flyer
    if (flyer instanceof File && flyer.size > 0) {
      const key = eventFlyerKey(eventId, flyer.name)
      const upload = await uploadImage(r2, flyer, key)
      if (upload.ok) {
        if (flyer_r2_key && flyer_r2_key !== key) await deleteAsset(r2, flyer_r2_key)
        flyer_r2_key = key
      }
    } else {
      const existingKey = await resolveExistingImageKey(r2, body, 'existing_flyer_key')
      if (existingKey && typeof existingKey === 'object') {
        return { thumbnail_r2_key, flyer_r2_key, error: existingKey.error }
      }
      if (typeof existingKey === 'string') {
        if (flyer_r2_key && flyer_r2_key !== existingKey) await deleteAsset(r2, flyer_r2_key)
        flyer_r2_key = existingKey
      }
    }
  }

  return { thumbnail_r2_key, flyer_r2_key }
}

export async function deleteEventAssets(r2: R2Bucket, event: EventRecord): Promise<void> {
  if (event.thumbnail_r2_key) await deleteAsset(r2, event.thumbnail_r2_key)
  if (event.flyer_r2_key) await deleteAsset(r2, event.flyer_r2_key)
}

export async function createEvent(
  db: D1Database,
  data: {
    title: string
    starts_at: string
    ends_at?: string
    location?: string
    description?: string
    registration_url?: string
    repeat_rule?: string | null
    repeat_until?: string | null
    thumbnail_r2_key?: string | null
    flyer_r2_key?: string | null
    latitude?: number | null
    longitude?: number | null
    committee_key?: string | null
  },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO events (id, title, starts_at, ends_at, location, description, registration_url, published, repeat_rule, repeat_until, thumbnail_r2_key, flyer_r2_key, latitude, longitude, committee_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.title,
      data.starts_at,
      data.ends_at ?? null,
      data.location ?? null,
      data.description ?? null,
      data.registration_url ?? null,
      data.repeat_rule ?? null,
      data.repeat_until ?? null,
      data.thumbnail_r2_key ?? null,
      data.flyer_r2_key ?? null,
      data.latitude ?? null,
      data.longitude ?? null,
      data.committee_key ?? null,
    )
    .run()
  return id
}

export async function updateEvent(
  db: D1Database,
  id: string,
  data: {
    title: string
    starts_at: string
    ends_at?: string | null
    location?: string | null
    description?: string | null
    registration_url?: string | null
    published: boolean
    repeat_rule?: string | null
    repeat_until?: string | null
    thumbnail_r2_key?: string | null
    flyer_r2_key?: string | null
    latitude?: number | null
    longitude?: number | null
    committee_key?: string | null
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE events SET title = ?, starts_at = ?, ends_at = ?, location = ?, description = ?,
       registration_url = ?, published = ?, repeat_rule = ?, repeat_until = ?,
       thumbnail_r2_key = ?, flyer_r2_key = ?, latitude = ?, longitude = ?, committee_key = ?,
       updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(
      data.title,
      data.starts_at,
      data.ends_at ?? null,
      data.location ?? null,
      data.description ?? null,
      data.registration_url ?? null,
      data.published ? 1 : 0,
      data.repeat_rule ?? null,
      data.repeat_until ?? null,
      data.thumbnail_r2_key ?? null,
      data.flyer_r2_key ?? null,
      data.latitude ?? null,
      data.longitude ?? null,
      data.committee_key ?? null,
      id,
    )
    .run()
}

export async function deleteEvent(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
}

export { toDatetimeLocalValue, toDateInputValue } from './datetime'
