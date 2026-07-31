export type PageRecord = {
  slug: string
  title: string
  body_md: string
  body_json: string | null
  meta_description: string | null
  published: number
}

export const PAGE_SLUGS = [
  'home',
  'about',
  'training',
  'resources',
  'scholarships',
  'committees',
] as const

export type PageSlug = (typeof PAGE_SLUGS)[number]

export const PAGE_LABELS: Record<PageSlug, string> = {
  home: 'Home page',
  about: 'About',
  training: 'Training',
  resources: 'Resources',
  scholarships: 'NUCA Las Vegas Scholarships',
  committees: 'Committees',
}

export function isCommitteePageSlug(slug: string): boolean {
  return slug.startsWith('committee-')
}

export function isKnownPageSlug(slug: string): boolean {
  return isPageSlug(slug) || isCommitteePageSlug(slug)
}

export function buildPageLabels(committees: { key: string; name: string }[]): Record<string, string> {
  return {
    ...PAGE_LABELS,
    ...Object.fromEntries(committees.map((committee) => [`committee-${committee.key}`, committee.name])),
  }
}

export function isPageSlug(slug: string): slug is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(slug)
}

export async function listPages(db: D1Database): Promise<PageRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT slug, title, body_md, body_json, meta_description, published FROM pages ORDER BY slug ASC`,
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
      `SELECT slug, title, body_md, body_json, meta_description, published FROM pages WHERE slug = ?`,
    )
    .bind(slug)
    .first<PageRecord>()
  if (!row) return null
  if (publishedOnly && row.published !== 1) return null
  return row
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
      `INSERT INTO pages (slug, title, body_md, body_json, meta_description, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
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
