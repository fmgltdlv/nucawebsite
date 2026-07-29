export type EventRecord = {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  location: string | null
  description: string | null
  registration_url: string | null
  published: number
}

export async function listUpcomingEvents(db: D1Database): Promise<EventRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, starts_at, ends_at, location, description, registration_url, published
       FROM events WHERE published = 1 ORDER BY starts_at ASC LIMIT 50`,
    )
    .all<EventRecord>()
  return results ?? []
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
  },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO events (id, title, starts_at, ends_at, location, description, registration_url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    )
    .bind(
      id,
      data.title,
      data.starts_at,
      data.ends_at ?? null,
      data.location ?? null,
      data.description ?? null,
      data.registration_url ?? null,
    )
    .run()
  return id
}
