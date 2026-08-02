export type EventRsvpRecord = {
  id: string
  event_id: string
  occurrence_starts_at: string
  name: string
  email: string
  quantity: number
  created_at: string
}

export type CreateEventRsvpResult =
  | { ok: true; id: string }
  | { ok: false; error: 'disabled' | 'full' | 'duplicate' | 'invalid' }

const MAX_RSVP_QUANTITY = 50

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function parseRegistrationLimit(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const n = Number.parseInt(value.trim(), 10)
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

export function parseRsvpQuantity(value: unknown, maxAllowed?: number | null): number | null {
  const raw =
    typeof value === 'string'
      ? value.trim()
      : typeof value === 'number'
        ? String(value)
        : ''
  if (!raw) return 1
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) return null
  const cap =
    maxAllowed != null && Number.isFinite(maxAllowed) && maxAllowed > 0
      ? Math.min(MAX_RSVP_QUANTITY, maxAllowed)
      : MAX_RSVP_QUANTITY
  if (n > cap) return null
  return n
}

export async function countEventRsvps(
  db: D1Database,
  eventId: string,
  occurrenceStartsAt: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(quantity), 0) AS count FROM event_rsvps
       WHERE event_id = ? AND occurrence_starts_at = ?`,
    )
    .bind(eventId, occurrenceStartsAt)
    .first<{ count: number }>()
  return row?.count ?? 0
}

export async function countEventRsvpsForEvent(db: D1Database, eventId: string): Promise<number> {
  const row = await db
    .prepare(`SELECT COALESCE(SUM(quantity), 0) AS count FROM event_rsvps WHERE event_id = ?`)
    .bind(eventId)
    .first<{ count: number }>()
  return row?.count ?? 0
}

export async function listEventRsvps(
  db: D1Database,
  eventId: string,
): Promise<EventRsvpRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, event_id, occurrence_starts_at, name, email, quantity, created_at
       FROM event_rsvps WHERE event_id = ? ORDER BY created_at DESC LIMIT 2000`,
    )
    .bind(eventId)
    .all<EventRsvpRecord>()
  return results ?? []
}

export async function createEventRsvp(
  db: D1Database,
  data: {
    eventId: string
    occurrenceStartsAt: string
    name: string
    email: string
    quantity?: number
    rsvpEnabled: boolean
    registrationLimit: number | null
  },
): Promise<CreateEventRsvpResult> {
  const name = data.name.trim()
  const email = normalizeEmail(data.email)
  const quantity = data.quantity ?? 1
  if (!name || !email || !email.includes('@')) return { ok: false, error: 'invalid' }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_RSVP_QUANTITY) {
    return { ok: false, error: 'invalid' }
  }
  if (!data.rsvpEnabled) return { ok: false, error: 'disabled' }

  if (data.registrationLimit != null) {
    const count = await countEventRsvps(db, data.eventId, data.occurrenceStartsAt)
    if (count + quantity > data.registrationLimit) return { ok: false, error: 'full' }
  }

  const existing = await db
    .prepare(
      `SELECT id FROM event_rsvps
       WHERE event_id = ? AND occurrence_starts_at = ? AND email = ?`,
    )
    .bind(data.eventId, data.occurrenceStartsAt, email)
    .first<{ id: string }>()
  if (existing) return { ok: false, error: 'duplicate' }

  const id = crypto.randomUUID()
  try {
    await db
      .prepare(
        `INSERT INTO event_rsvps (id, event_id, occurrence_starts_at, name, email, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, data.eventId, data.occurrenceStartsAt, name, email, quantity)
      .run()
  } catch {
    return { ok: false, error: 'duplicate' }
  }

  if (data.registrationLimit != null) {
    const count = await countEventRsvps(db, data.eventId, data.occurrenceStartsAt)
    if (count > data.registrationLimit) {
      await db.prepare('DELETE FROM event_rsvps WHERE id = ?').bind(id).run()
      return { ok: false, error: 'full' }
    }
  }

  return { ok: true, id }
}

export async function deleteEventRsvp(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM event_rsvps WHERE id = ?').bind(id).run()
}

export async function deleteEventRsvpsForEvent(db: D1Database, eventId: string): Promise<void> {
  await db.prepare('DELETE FROM event_rsvps WHERE event_id = ?').bind(eventId).run()
}

export function buildEventRsvpsCsv(rsvps: EventRsvpRecord[]): string {
  const rows = [
    ['name', 'email', 'quantity', 'occurrence_starts_at', 'created_at'],
    ...rsvps.map((rsvp) => [
      rsvp.name,
      rsvp.email,
      String(rsvp.quantity ?? 1),
      rsvp.occurrence_starts_at,
      rsvp.created_at,
    ]),
  ]
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '')
          if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
          return value
        })
        .join(','),
    )
    .join('\n')
}

export function eventRsvpsExportFilename(eventTitle: string): string {
  const slug = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const date = new Date().toISOString().slice(0, 10)
  return `event-rsvps-${slug || 'event'}-${date}.csv`
}
