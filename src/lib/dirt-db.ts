export type DirtReleaseRecord = {
  id: string
  title: string
  summary: string | null
  published_at: string
  pdf_r2_key: string
  published: number
}

export async function listDirtReleases(
  db: D1Database,
  publishedOnly = false,
): Promise<DirtReleaseRecord[]> {
  const sql = publishedOnly
    ? `SELECT id, title, summary, published_at, pdf_r2_key, published
       FROM dirt_releases WHERE published = 1 ORDER BY published_at DESC`
    : `SELECT id, title, summary, published_at, pdf_r2_key, published
       FROM dirt_releases ORDER BY published_at DESC`
  const { results } = await db.prepare(sql).all<DirtReleaseRecord>()
  return results ?? []
}

export async function getDirtRelease(
  db: D1Database,
  id: string,
): Promise<DirtReleaseRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT id, title, summary, published_at, pdf_r2_key, published FROM dirt_releases WHERE id = ?`,
      )
      .bind(id)
      .first<DirtReleaseRecord>()) ?? null
  )
}

export async function createDirtRelease(
  db: D1Database,
  data: {
    id?: string
    title: string
    summary?: string
    published_at: string
    pdf_r2_key: string
    published?: boolean
  },
): Promise<string> {
  const id = data.id ?? crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO dirt_releases (id, title, summary, published_at, pdf_r2_key, published)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.title,
      data.summary ?? null,
      data.published_at,
      data.pdf_r2_key,
      data.published === false ? 0 : 1,
    )
    .run()
  return id
}

export async function updateDirtRelease(
  db: D1Database,
  id: string,
  data: {
    title: string
    summary?: string | null
    published_at: string
    pdf_r2_key?: string
    published: boolean
  },
): Promise<void> {
  if (data.pdf_r2_key) {
    await db
      .prepare(
        `UPDATE dirt_releases SET title = ?, summary = ?, published_at = ?, pdf_r2_key = ?, published = ?
         WHERE id = ?`,
      )
      .bind(
        data.title,
        data.summary ?? null,
        data.published_at,
        data.pdf_r2_key,
        data.published ? 1 : 0,
        id,
      )
      .run()
    return
  }

  await db
    .prepare(
      `UPDATE dirt_releases SET title = ?, summary = ?, published_at = ?, published = ? WHERE id = ?`,
    )
    .bind(data.title, data.summary ?? null, data.published_at, data.published ? 1 : 0, id)
    .run()
}

export async function deleteDirtRelease(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM dirt_releases WHERE id = ?').bind(id).run()
}
