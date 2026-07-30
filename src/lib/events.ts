import { expandEventOccurrences, type ExpandedEventRecord } from './event-repeat'

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
}

export const EVENTS_LIST_PAGE_SIZE = 5

const EVENT_COLUMNS = `id, title, starts_at, ends_at, location, description, registration_url, published, repeat_rule, repeat_until`

async function listPublishedMasterEvents(db: D1Database): Promise<EventRecord[]> {
  const { results } = await db
    .prepare(`SELECT ${EVENT_COLUMNS} FROM events WHERE published = 1 ORDER BY starts_at ASC LIMIT 500`)
    .all<EventRecord>()
  return results ?? []
}

function upcomingOccurrences(events: EventRecord[]): ExpandedEventRecord[] {
  return expandEventOccurrences(events, { upcomingOnly: true })
}

export async function countUpcomingEvents(db: D1Database): Promise<number> {
  const events = await listPublishedMasterEvents(db)
  return upcomingOccurrences(events).length
}

export async function listUpcomingEventsPage(
  db: D1Database,
  page: number,
  pageSize = EVENTS_LIST_PAGE_SIZE,
): Promise<ExpandedEventRecord[]> {
  const events = await listPublishedMasterEvents(db)
  const offset = Math.max(0, (Math.max(1, page) - 1) * pageSize)
  return upcomingOccurrences(events).slice(offset, offset + pageSize)
}

export async function listPublishedEventsForCalendar(db: D1Database): Promise<ExpandedEventRecord[]> {
  const events = await listPublishedMasterEvents(db)
  return expandEventOccurrences(events)
}

export async function listUpcomingEvents(db: D1Database, limit = 50): Promise<ExpandedEventRecord[]> {
  const events = await listPublishedMasterEvents(db)
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
  },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO events (id, title, starts_at, ends_at, location, description, registration_url, published, repeat_rule, repeat_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
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
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE events SET title = ?, starts_at = ?, ends_at = ?, location = ?, description = ?,
       registration_url = ?, published = ?, repeat_rule = ?, repeat_until = ?, updated_at = datetime('now') WHERE id = ?`,
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
      id,
    )
    .run()
}

export async function deleteEvent(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
}

export { toDatetimeLocalValue, toDateInputValue } from './datetime'
