export type LeadershipRecord = {
  id: string
  name: string
  role_title: string
  sort_order: number
  photo_r2_key: string | null
  published: number
}

export async function listLeadership(
  db: D1Database,
  publishedOnly = false,
): Promise<LeadershipRecord[]> {
  const sql = publishedOnly
    ? `SELECT id, name, role_title, sort_order, photo_r2_key, published
       FROM leadership WHERE published = 1 ORDER BY sort_order ASC, name ASC`
    : `SELECT id, name, role_title, sort_order, photo_r2_key, published
       FROM leadership ORDER BY sort_order ASC, name ASC`
  const { results } = await db.prepare(sql).all<LeadershipRecord>()
  return results ?? []
}

export async function getLeadershipById(
  db: D1Database,
  id: string,
): Promise<LeadershipRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT id, name, role_title, sort_order, photo_r2_key, published FROM leadership WHERE id = ?`,
      )
      .bind(id)
      .first<LeadershipRecord>()) ?? null
  )
}

export async function createLeadership(
  db: D1Database,
  data: {
    name: string
    role_title: string
    sort_order?: number
    photo_r2_key?: string
    published?: boolean
  },
): Promise<string> {
  const id = crypto.randomUUID()
  const maxRow = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM leadership')
    .first<{ m: number }>()
  const sort_order = data.sort_order ?? (maxRow?.m ?? -1) + 1
  await db
    .prepare(
      `INSERT INTO leadership (id, name, role_title, sort_order, photo_r2_key, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      id,
      data.name,
      data.role_title,
      sort_order,
      data.photo_r2_key ?? null,
      data.published === false ? 0 : 1,
    )
    .run()
  return id
}

export async function updateLeadership(
  db: D1Database,
  id: string,
  data: {
    name: string
    role_title: string
    sort_order: number
    photo_r2_key?: string | null
    published: boolean
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE leadership SET name = ?, role_title = ?, sort_order = ?, photo_r2_key = ?, published = ?,
       updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(
      data.name,
      data.role_title,
      data.sort_order,
      data.photo_r2_key ?? null,
      data.published ? 1 : 0,
      id,
    )
    .run()
}

export async function deleteLeadership(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM leadership WHERE id = ?').bind(id).run()
}
