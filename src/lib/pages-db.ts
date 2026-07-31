export type PageRecord = {
  slug: string
  title: string
  body_md: string
  body_json: string | null
  meta_description: string | null
  published: number
}

export const PAGE_SLUGS = [
  'about',
  'training',
  'resources',
  'scholarships',
  'committees',
  'committee-legislative',
  'committee-safety',
  'committee-standards',
  'committee-damage_prevention',
] as const

export type PageSlug = (typeof PAGE_SLUGS)[number]

export const PAGE_LABELS: Record<PageSlug, string> = {
  about: 'About',
  training: 'Training',
  resources: 'Resources',
  scholarships: 'NUCA Las Vegas Scholarships',
  committees: 'Committees',
  'committee-legislative': 'Legislative Committee',
  'committee-safety': 'Safety Committee',
  'committee-standards': 'Standards Committee',
  'committee-damage_prevention': 'Damage Prevention Committee',
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
