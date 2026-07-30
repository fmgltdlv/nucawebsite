export type LeadershipRecord = {
  id: string
  name: string
  role_title: string
  chair_title: string | null
  company: string | null
  website: string | null
  linkedin_url: string | null
  sort_order: number
  photo_r2_key: string | null
  published: number
}

const LEADERSHIP_COLUMNS =
  'id, name, role_title, chair_title, company, website, linkedin_url, sort_order, photo_r2_key, published'

export type LeadershipInput = {
  name: string
  role_title: string
  chair_title?: string | null
  company?: string | null
  website?: string | null
  linkedin_url?: string | null
  sort_order?: number
  photo_r2_key?: string | null
  published?: boolean
}

export async function listLeadership(
  db: D1Database,
  publishedOnly = false,
): Promise<LeadershipRecord[]> {
  const sql = publishedOnly
    ? `SELECT ${LEADERSHIP_COLUMNS}
       FROM leadership WHERE published = 1 ORDER BY sort_order ASC, name ASC`
    : `SELECT ${LEADERSHIP_COLUMNS}
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
      .prepare(`SELECT ${LEADERSHIP_COLUMNS} FROM leadership WHERE id = ?`)
      .bind(id)
      .first<LeadershipRecord>()) ?? null
  )
}

export async function createLeadership(db: D1Database, data: LeadershipInput): Promise<string> {
  const id = crypto.randomUUID()
  const maxRow = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM leadership')
    .first<{ m: number }>()
  const sort_order = data.sort_order ?? (maxRow?.m ?? -1) + 1
  await db
    .prepare(
      `INSERT INTO leadership (
         id, name, role_title, chair_title, company, website, linkedin_url,
         sort_order, photo_r2_key, published, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      id,
      data.name,
      data.role_title,
      data.chair_title ?? null,
      data.company ?? null,
      data.website ?? null,
      data.linkedin_url ?? null,
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
  data: LeadershipInput & { sort_order: number; published: boolean },
): Promise<void> {
  await db
    .prepare(
      `UPDATE leadership
       SET name = ?, role_title = ?, chair_title = ?, company = ?, website = ?, linkedin_url = ?,
           sort_order = ?, photo_r2_key = ?, published = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      data.name,
      data.role_title,
      data.chair_title ?? null,
      data.company ?? null,
      data.website ?? null,
      data.linkedin_url ?? null,
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
