export type QaRecord = {
  id: string
  question: string
  answer_md: string
  sort_order: number
  published: number
}

export async function listQaItems(db: D1Database, publishedOnly = false): Promise<QaRecord[]> {
  const sql = publishedOnly
    ? `SELECT id, question, answer_md, sort_order, published
       FROM qa_items WHERE published = 1 ORDER BY sort_order ASC, updated_at ASC`
    : `SELECT id, question, answer_md, sort_order, published
       FROM qa_items ORDER BY sort_order ASC, updated_at ASC`
  const { results } = await db.prepare(sql).all<QaRecord>()
  return results ?? []
}

export async function getQaItem(db: D1Database, id: string): Promise<QaRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT id, question, answer_md, sort_order, published FROM qa_items WHERE id = ?`,
      )
      .bind(id)
      .first<QaRecord>()) ?? null
  )
}

export async function createQaItem(
  db: D1Database,
  data: { question: string; answer_md: string; sort_order?: number; published?: boolean },
): Promise<string> {
  const id = crypto.randomUUID()
  const maxRow = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM qa_items')
    .first<{ m: number }>()
  const sort_order = data.sort_order ?? (maxRow?.m ?? -1) + 1
  await db
    .prepare(
      `INSERT INTO qa_items (id, question, answer_md, sort_order, published, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(id, data.question, data.answer_md, sort_order, data.published === false ? 0 : 1)
    .run()
  return id
}

export async function updateQaItem(
  db: D1Database,
  id: string,
  data: {
    question: string
    answer_md: string
    sort_order: number
    published: boolean
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE qa_items SET question = ?, answer_md = ?, sort_order = ?, published = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(data.question, data.answer_md, data.sort_order, data.published ? 1 : 0, id)
    .run()
}

export async function deleteQaItem(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM qa_items WHERE id = ?').bind(id).run()
}
