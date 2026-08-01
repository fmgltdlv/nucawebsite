export type MembershipTypeRecord = {
  key: string
  name: string
  description: string
  sort_order: number
  published: number
}

export function slugifyMembershipTypeKey(value: string): string | null {
  const key = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  if (!key || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(key)) return null
  return key
}

export async function listMembershipTypes(
  db: D1Database,
  publishedOnly = false,
): Promise<MembershipTypeRecord[]> {
  const sql = publishedOnly
    ? `SELECT key, name, description, sort_order, published
       FROM membership_types WHERE published = 1 ORDER BY sort_order ASC, name COLLATE NOCASE ASC`
    : `SELECT key, name, description, sort_order, published
       FROM membership_types ORDER BY sort_order ASC, name COLLATE NOCASE ASC`
  const { results } = await db.prepare(sql).all<MembershipTypeRecord>()
  return results ?? []
}

export async function getMembershipType(
  db: D1Database,
  key: string,
): Promise<MembershipTypeRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT key, name, description, sort_order, published FROM membership_types WHERE key = ?`,
      )
      .bind(key)
      .first<MembershipTypeRecord>()) ?? null
  )
}

export async function createMembershipType(
  db: D1Database,
  data: {
    key?: string
    name: string
    description?: string
    sort_order?: number
    published?: boolean
  },
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const name = data.name.trim()
  if (!name) return { ok: false, error: 'Name is required.' }

  const key = slugifyMembershipTypeKey(data.key?.trim() || name)
  if (!key) {
    return {
      ok: false,
      error: 'Key is invalid. Use lowercase letters, numbers, and hyphens.',
    }
  }

  const existing = await getMembershipType(db, key)
  if (existing) return { ok: false, error: 'A membership type with that key already exists.' }

  const maxRow = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM membership_types')
    .first<{ m: number }>()
  const sort_order = data.sort_order ?? (maxRow?.m ?? -1) + 1

  await db
    .prepare(
      `INSERT INTO membership_types (key, name, description, sort_order, published)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(key, name, data.description?.trim() ?? '', sort_order, data.published === false ? 0 : 1)
    .run()

  return { ok: true, key }
}

export async function updateMembershipType(
  db: D1Database,
  key: string,
  data: { name: string; description: string; sort_order: number; published: boolean },
): Promise<void> {
  await db
    .prepare(
      `UPDATE membership_types
       SET name = ?, description = ?, sort_order = ?, published = ?
       WHERE key = ?`,
    )
    .bind(data.name.trim(), data.description.trim(), data.sort_order, data.published ? 1 : 0, key)
    .run()
}

export async function countMembersWithType(db: D1Database, key: string): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as c FROM members WHERE member_type = ?')
    .bind(key)
    .first<{ c: number }>()
  return row?.c ?? 0
}

export async function deleteMembershipType(
  db: D1Database,
  key: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const inUse = await countMembersWithType(db, key)
  if (inUse > 0) {
    return {
      ok: false,
      error: `Cannot delete: ${inUse} member(s) still use this type.`,
    }
  }
  await db.prepare('DELETE FROM membership_types WHERE key = ?').bind(key).run()
  return { ok: true }
}

export async function seedMembershipTypesIfEmpty(db: D1Database): Promise<void> {
  const row = await db.prepare('SELECT COUNT(*) as c FROM membership_types').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return

  const defaults = [
    {
      key: 'contractor',
      name: 'Contractor Member',
      description:
        'Firms engaged in excavation, site work, and construction or rehabilitation of utility systems—including water, sewer, gas, electric, and communications infrastructure.',
      sort_order: 0,
    },
    {
      key: 'associate',
      name: 'Associate Member',
      description:
        'Suppliers of equipment, materials, or services to contractors in the excavation and utility construction industry.',
      sort_order: 1,
    },
    {
      key: 'institutional',
      name: 'Institutional Member',
      description:
        'Schools and governmental entities involved in utility construction and excavation.',
      sort_order: 2,
    },
  ]

  for (const item of defaults) {
    await db
      .prepare(
        `INSERT INTO membership_types (key, name, description, sort_order, published)
         VALUES (?, ?, ?, ?, 1)`,
      )
      .bind(item.key, item.name, item.description, item.sort_order)
      .run()
  }
}

/** Resolve a display label for a member type key (falls back to the key). */
export async function membershipTypeLabelMap(
  db: D1Database,
): Promise<Record<string, string>> {
  const types = await listMembershipTypes(db)
  const map: Record<string, string> = {}
  for (const t of types) map[t.key] = t.name
  return map
}
