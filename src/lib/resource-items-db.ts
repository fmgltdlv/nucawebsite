export type ResourceItemRecord = {
  id: string
  label: string
  url: string
  category: string
  sort_order: number
  published: number
}

export function groupResourceItems(items: ResourceItemRecord[]): { category: string; items: ResourceItemRecord[] }[] {
  const groups: { category: string; items: ResourceItemRecord[] }[] = []
  for (const item of items) {
    const category = item.category.trim() || 'Links'
    const last = groups[groups.length - 1]
    if (last?.category === category) {
      last.items.push(item)
    } else {
      groups.push({ category, items: [item] })
    }
  }
  return groups
}

export async function listResourceItems(
  db: D1Database,
  publishedOnly = false,
): Promise<ResourceItemRecord[]> {
  const sql = publishedOnly
    ? `SELECT id, label, url, category, sort_order, published FROM resource_items WHERE published = 1 ORDER BY sort_order ASC`
    : `SELECT id, label, url, category, sort_order, published FROM resource_items ORDER BY sort_order ASC`
  const { results } = await db.prepare(sql).all<ResourceItemRecord>()
  return results ?? []
}

export async function createResourceItem(
  db: D1Database,
  data: { label: string; url: string; category?: string; sort_order?: number; published?: boolean },
): Promise<string> {
  const id = crypto.randomUUID()
  const maxRow = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM resource_items')
    .first<{ m: number }>()
  const sort_order = data.sort_order ?? (maxRow?.m ?? -1) + 1
  await db
    .prepare(
      `INSERT INTO resource_items (id, label, url, category, sort_order, published) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, data.label, data.url, data.category?.trim() ?? '', sort_order, data.published === false ? 0 : 1)
    .run()
  return id
}

export async function updateResourceItem(
  db: D1Database,
  id: string,
  data: { label: string; url: string; category: string; sort_order: number; published: boolean },
): Promise<void> {
  await db
    .prepare(
      `UPDATE resource_items SET label = ?, url = ?, category = ?, sort_order = ?, published = ? WHERE id = ?`,
    )
    .bind(data.label, data.url, data.category.trim(), data.sort_order, data.published ? 1 : 0, id)
    .run()
}

export async function deleteResourceItem(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM resource_items WHERE id = ?').bind(id).run()
}
