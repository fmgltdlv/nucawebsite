import { committeePageSlug, committeePublicPath, defaultCommitteeBlocks } from './committee-pages'
import { createNavItem, deleteNavItem, listNavItems } from './nav-items-db'
import { blocksToMarkdown, serializePageBlocks } from './page-blocks'
import { upsertPage } from './pages-db'
import { CHAPTER_COMMITTEES } from '../data/committees'

export type CommitteeRecord = {
  id: string
  key: string
  name: string
  sort_order: number
  published: number
}

const COMMITTEE_KEY_PATTERN = /^[a-z][a-z0-9_]*$/

export function isCommitteeKeyFormat(key: string): boolean {
  return COMMITTEE_KEY_PATTERN.test(key)
}

export function slugifyCommitteeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\bcommittee\b/gi, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
}

export async function listCommittees(
  db: D1Database,
  publishedOnly = false,
): Promise<CommitteeRecord[]> {
  const sql = publishedOnly
    ? `SELECT id, key, name, sort_order, published
       FROM committees WHERE published = 1
       ORDER BY sort_order ASC, name ASC`
    : `SELECT id, key, name, sort_order, published
       FROM committees ORDER BY sort_order ASC, name ASC`
  const { results } = await db.prepare(sql).all<CommitteeRecord>()
  return results ?? []
}

export async function getCommitteeByKey(
  db: D1Database,
  key: string,
  publishedOnly = false,
): Promise<CommitteeRecord | null> {
  const row = await db
    .prepare(`SELECT id, key, name, sort_order, published FROM committees WHERE key = ?`)
    .bind(key)
    .first<CommitteeRecord>()
  if (!row) return null
  if (publishedOnly && row.published !== 1) return null
  return row
}

export async function getCommitteeById(db: D1Database, id: string): Promise<CommitteeRecord | null> {
  return (
    (await db
      .prepare(`SELECT id, key, name, sort_order, published FROM committees WHERE id = ?`)
      .bind(id)
      .first<CommitteeRecord>()) ?? null
  )
}

async function nextSortOrder(db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM committees')
    .first<{ m: number }>()
  return (row?.m ?? -1) + 1
}

async function findCommitteesNavParentId(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(`SELECT id FROM nav_items WHERE href = '/about/committees' AND parent_id IS NULL LIMIT 1`)
    .first<{ id: string }>()
  return row?.id ?? null
}

export async function provisionCommitteePage(
  db: D1Database,
  committee: Pick<CommitteeRecord, 'key' | 'name'>,
): Promise<void> {
  const slug = committeePageSlug(committee.key)
  const existing = await db.prepare('SELECT slug FROM pages WHERE slug = ?').bind(slug).first()
  if (existing) return

  const blocks = defaultCommitteeBlocks(committee.name)
  const body_json = serializePageBlocks(blocks)
  const body_md = blocksToMarkdown(blocks)

  await upsertPage(db, {
    slug,
    title: committee.name,
    body_md,
    body_json,
    meta_description: `${committee.name} — NUCA of Las Vegas`,
    published: true,
  })
}

export async function provisionCommitteeNavItem(
  db: D1Database,
  committee: Pick<CommitteeRecord, 'key' | 'name' | 'sort_order'>,
): Promise<void> {
  const parentId = await findCommitteesNavParentId(db)
  if (!parentId) return

  const href = committeePublicPath(committee.key)
  const items = await listNavItems(db)
  if (items.some((item) => item.href === href)) return

  await createNavItem(db, {
    parent_id: parentId,
    label: committee.name,
    href,
    sort_order: committee.sort_order,
    published: true,
    indent: true,
  })
}

export async function teardownCommitteeResources(db: D1Database, key: string): Promise<void> {
  const slug = committeePageSlug(key)
  await db.prepare('DELETE FROM pages WHERE slug = ?').bind(slug).run()

  const href = committeePublicPath(key)
  const items = await listNavItems(db)
  for (const item of items) {
    if (item.href === href) {
      await deleteNavItem(db, item.id)
    }
  }

  await db.prepare('UPDATE events SET committee_key = NULL WHERE committee_key = ?').bind(key).run()
}

export async function createCommittee(
  db: D1Database,
  data: { key: string; name: string; sort_order?: number; published?: boolean },
): Promise<string> {
  if (!isCommitteeKeyFormat(data.key)) {
    throw new Error('Committee key must use lowercase letters, numbers, and underscores.')
  }

  const existing = await getCommitteeByKey(db, data.key)
  if (existing) throw new Error('A committee with that key already exists.')

  const id = crypto.randomUUID()
  const sort_order = data.sort_order ?? (await nextSortOrder(db))
  const published = data.published === false ? 0 : 1

  await db
    .prepare(
      `INSERT INTO committees (id, key, name, sort_order, published, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(id, data.key, data.name.trim(), sort_order, published)
    .run()

  const committee = { id, key: data.key, name: data.name.trim(), sort_order, published }
  await provisionCommitteePage(db, committee)
  await provisionCommitteeNavItem(db, committee)

  return id
}

export async function updateCommittee(
  db: D1Database,
  id: string,
  data: { name: string; sort_order: number; published: boolean },
): Promise<void> {
  const existing = await getCommitteeById(db, id)
  if (!existing) throw new Error('Committee not found.')

  await db
    .prepare(
      `UPDATE committees SET name = ?, sort_order = ?, published = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(data.name.trim(), data.sort_order, data.published ? 1 : 0, id)
    .run()

  const slug = committeePageSlug(existing.key)
  const page = await db
    .prepare('SELECT slug, title FROM pages WHERE slug = ?')
    .bind(slug)
    .first<{ slug: string; title: string }>()
  if (page && page.title === existing.name) {
    await db
      .prepare(`UPDATE pages SET title = ?, updated_at = datetime('now') WHERE slug = ?`)
      .bind(data.name.trim(), slug)
      .run()
  }

  const href = committeePublicPath(existing.key)
  const items = await listNavItems(db)
  for (const item of items) {
    if (item.href === href && item.label === existing.name) {
      await db
        .prepare(`UPDATE nav_items SET label = ?, sort_order = ?, published = ? WHERE id = ?`)
        .bind(data.name.trim(), data.sort_order, data.published ? 1 : 0, item.id)
        .run()
    }
  }
}

export async function deleteCommittee(db: D1Database, id: string): Promise<void> {
  const existing = await getCommitteeById(db, id)
  if (!existing) return
  await teardownCommitteeResources(db, existing.key)
  await db.prepare('DELETE FROM committees WHERE id = ?').bind(id).run()
}

export async function seedCommitteesIfEmpty(db: D1Database): Promise<void> {
  const row = await db.prepare('SELECT COUNT(*) as c FROM committees').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return

  let order = 0
  for (const committee of CHAPTER_COMMITTEES) {
    await createCommittee(db, {
      key: committee.key,
      name: committee.name,
      sort_order: order++,
      published: true,
    })
  }
}
