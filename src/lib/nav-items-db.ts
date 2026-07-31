import { isNavGroup, siteNavigation, type NavEntry } from '../nav/site-nav'

export type NavItemRecord = {
  id: string
  parent_id: string | null
  label: string
  href: string
  sort_order: number
  published: number
  indent: number
}

export function buildSiteNavigation(items: NavItemRecord[]): NavEntry[] {
  const visible = items.filter((item) => item.published === 1)
  const topLevel = visible.filter((item) => !item.parent_id).sort((a, b) => a.sort_order - b.sort_order)

  return topLevel.map((item) => {
    const children = visible
      .filter((child) => child.parent_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order)

    if (children.length > 0) {
      return {
        label: item.label,
        href: item.href || undefined,
        children: children.map((child) => ({
          label: child.label,
          href: child.href,
          indent: child.indent === 1 ? true : undefined,
        })),
      }
    }

    return {
      label: item.label,
      href: item.href,
    }
  })
}

export async function listNavItems(db: D1Database, publishedOnly = false): Promise<NavItemRecord[]> {
  const sql = publishedOnly
    ? `SELECT id, parent_id, label, href, sort_order, published, indent
       FROM nav_items WHERE published = 1
       ORDER BY COALESCE(parent_id, id), parent_id IS NOT NULL, sort_order ASC`
    : `SELECT id, parent_id, label, href, sort_order, published, indent
       FROM nav_items
       ORDER BY COALESCE(parent_id, id), parent_id IS NOT NULL, sort_order ASC`
  const { results } = await db.prepare(sql).all<NavItemRecord>()
  return results ?? []
}

export async function getNavItemById(db: D1Database, id: string): Promise<NavItemRecord | null> {
  return db
    .prepare(
      `SELECT id, parent_id, label, href, sort_order, published, indent
       FROM nav_items WHERE id = ?`,
    )
    .bind(id)
    .first<NavItemRecord>()
}

export async function listNavParentOptions(db: D1Database): Promise<NavItemRecord[]> {
  const items = await listNavItems(db)
  return items.filter((item) => !item.parent_id).sort((a, b) => a.sort_order - b.sort_order)
}

async function nextSortOrder(db: D1Database, parentId: string | null): Promise<number> {
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM nav_items WHERE parent_id IS ?')
    .bind(parentId)
    .first<{ m: number }>()
  return (row?.m ?? -1) + 1
}

export async function createNavItem(
  db: D1Database,
  data: {
    id?: string
    label: string
    href?: string
    parent_id?: string | null
    sort_order?: number
    published?: boolean
    indent?: boolean
  },
): Promise<string> {
  const id = data.id ?? crypto.randomUUID()
  const parent_id = data.parent_id ?? null
  const sort_order = data.sort_order ?? (await nextSortOrder(db, parent_id))
  await db
    .prepare(
      `INSERT INTO nav_items (id, parent_id, label, href, sort_order, published, indent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      parent_id,
      data.label,
      data.href?.trim() ?? '',
      sort_order,
      data.published === false ? 0 : 1,
      data.indent ? 1 : 0,
    )
    .run()
  return id
}

export async function updateNavItem(
  db: D1Database,
  id: string,
  data: {
    label: string
    href: string
    parent_id: string | null
    sort_order: number
    published: boolean
    indent: boolean
  },
): Promise<void> {
  if (data.parent_id === id) {
    throw new Error('A nav item cannot be its own parent.')
  }
  await db
    .prepare(
      `UPDATE nav_items
       SET label = ?, href = ?, parent_id = ?, sort_order = ?, published = ?, indent = ?
       WHERE id = ?`,
    )
    .bind(
      data.label,
      data.href.trim(),
      data.parent_id,
      data.sort_order,
      data.published ? 1 : 0,
      data.indent ? 1 : 0,
      id,
    )
    .run()
}

export async function deleteNavItem(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM nav_items WHERE id = ?').bind(id).run()
}

export async function getPublishedSiteNavigation(db: D1Database): Promise<NavEntry[]> {
  const items = await listNavItems(db, true)
  if (items.length === 0) return siteNavigation
  return buildSiteNavigation(items)
}

export async function seedNavItemsIfEmpty(db: D1Database): Promise<void> {
  const row = await db.prepare('SELECT COUNT(*) as c FROM nav_items').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return

  let sortOrder = 0
  for (const entry of siteNavigation) {
    const id = crypto.randomUUID()
    if (isNavGroup(entry)) {
      await createNavItem(db, {
        id,
        label: entry.label,
        href: entry.href,
        sort_order: sortOrder++,
        published: true,
      })
      let childOrder = 0
      for (const child of entry.children) {
        await createNavItem(db, {
          parent_id: id,
          label: child.label,
          href: child.href,
          sort_order: childOrder++,
          published: true,
          indent: child.indent,
        })
      }
    } else {
      await createNavItem(db, {
        label: entry.label,
        href: entry.href,
        sort_order: sortOrder++,
        published: true,
      })
    }
  }
}
