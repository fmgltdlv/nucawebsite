export type PageRecord = {
  slug: string
  title: string
  body_md: string
  body_json: string | null
  meta_description: string | null
  published: number
  is_custom: number
}

export const PAGE_SLUGS = [
  'home',
  'about',
  'training',
  'resources',
  'scholarships',
  'committees',
  'faq',
  'leadership',
  'events',
  'the-dirt',
  'join',
  'contact',
] as const

export type PageSlug = (typeof PAGE_SLUGS)[number]

export const PAGE_LABELS: Record<PageSlug, string> = {
  home: 'Home page',
  about: 'About',
  training: 'Training',
  resources: 'Resources',
  scholarships: 'NUCA Las Vegas Scholarships',
  committees: 'Committees',
  faq: 'FAQ',
  leadership: 'Leadership',
  events: 'Events',
  'the-dirt': 'THE DIRT',
  join: 'Join',
  contact: 'Contact',
}

/** URL path segments reserved for app routes — cannot be used as custom page slugs. */
export const RESERVED_PAGE_SLUGS = new Set([
  'admin',
  'advocacy',
  'api',
  'assets',
  'about',
  'committees',
  'contact',
  'events',
  'faq',
  'home',
  'industry-updates',
  'join',
  'leadership',
  'members',
  'resources',
  'scholarships',
  'the-dirt',
  'theme',
  'training',
])

export function isCommitteePageSlug(slug: string): boolean {
  return slug.startsWith('committee-')
}

export function isSystemPageSlug(slug: string): boolean {
  return isPageSlug(slug) || isCommitteePageSlug(slug)
}

export function isKnownPageSlug(slug: string): boolean {
  return isSystemPageSlug(slug)
}

export function isCustomPage(page: Pick<PageRecord, 'is_custom'>): boolean {
  return page.is_custom === 1
}

export function buildPageLabels(
  committees: { key: string; name: string }[],
  customPages: Pick<PageRecord, 'slug' | 'title'>[] = [],
): Record<string, string> {
  const labels: Record<string, string> = { ...PAGE_LABELS }
  for (const committee of committees) {
    labels[`committee-${committee.key}`] = committee.name
  }
  for (const page of customPages) {
    labels[page.slug] = page.title
  }
  return labels
}

export function isPageSlug(slug: string): slug is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(slug)
}

export function slugifyPageTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function parseCustomPageSlug(value: string): string | null {
  const slug = value.trim().toLowerCase()
  if (!slug || slug.length > 64) return null
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) return null
  if (RESERVED_PAGE_SLUGS.has(slug)) return null
  if (isPageSlug(slug)) return null
  if (isCommitteePageSlug(slug)) return null
  return slug
}

export type CreateCustomPageResult =
  | { ok: true; slug: string }
  | { ok: false; error: string }

export async function listPages(db: D1Database): Promise<PageRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT slug, title, body_md, body_json, meta_description, published, is_custom
       FROM pages ORDER BY slug ASC`,
    )
    .all<PageRecord>()
  return results ?? []
}

export async function listCustomPages(db: D1Database): Promise<PageRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT slug, title, body_md, body_json, meta_description, published, is_custom
       FROM pages WHERE is_custom = 1 ORDER BY title COLLATE NOCASE ASC`,
    )
    .all<PageRecord>()
  return results ?? []
}

export async function getPageBySlug(
  db: D1Database,
  slug: string,
  publishedOnly = false,
): Promise<PageRecord | null> {
  const row = await db
    .prepare(
      `SELECT slug, title, body_md, body_json, meta_description, published, is_custom
       FROM pages WHERE slug = ?`,
    )
    .bind(slug)
    .first<PageRecord>()
  if (!row) return null
  if (publishedOnly && row.published !== 1) return null
  return row
}

export async function createCustomPage(
  db: D1Database,
  data: {
    title: string
    slug?: string
    meta_description?: string | null
    published?: boolean
  },
): Promise<CreateCustomPageResult> {
  const title = data.title.trim()
  if (!title) return { ok: false, error: 'Title is required.' }

  const slug = parseCustomPageSlug(data.slug?.trim() || slugifyPageTitle(title))
  if (!slug) {
    return {
      ok: false,
      error: 'URL slug is invalid or reserved. Use lowercase letters, numbers, and hyphens.',
    }
  }

  const existing = await getPageBySlug(db, slug)
  if (existing) return { ok: false, error: 'A page with that URL slug already exists.' }

  await db
    .prepare(
      `INSERT INTO pages (slug, title, body_md, body_json, meta_description, published, is_custom, updated_at)
       VALUES (?, ?, '', NULL, ?, ?, 1, datetime('now'))`,
    )
    .bind(slug, title, data.meta_description ?? null, data.published ? 1 : 0)
    .run()

  return { ok: true, slug }
}

export async function deleteCustomPage(db: D1Database, slug: string): Promise<boolean> {
  const page = await getPageBySlug(db, slug)
  if (!page || page.is_custom !== 1) return false
  await db.prepare('DELETE FROM pages WHERE slug = ? AND is_custom = 1').bind(slug).run()
  return true
}

export async function upsertPage(
  db: D1Database,
  data: {
    slug: string
    title: string
    body_md: string
    body_json?: string | null
    meta_description?: string | null
    published: boolean
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO pages (slug, title, body_md, body_json, meta_description, published, is_custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         body_md = excluded.body_md,
         body_json = excluded.body_json,
         meta_description = excluded.meta_description,
         published = excluded.published,
         updated_at = datetime('now')`,
    )
    .bind(
      data.slug,
      data.title,
      data.body_md,
      data.body_json ?? null,
      data.meta_description ?? null,
      data.published ? 1 : 0,
    )
    .run()
}
