export type PostRecord = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body_md: string
  body_html: string | null
  cover_r2_key: string | null
  cover_alt: string | null
  cover_width_pct: number
  published_at: string | null
  published: number
}

const POST_SELECT = `id, title, slug, excerpt, body_md, body_html, cover_r2_key, cover_alt, cover_width_pct, published_at, published`

export function clampCoverWidthPct(value: unknown, fallback = 100): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(20, Math.min(100, Math.round(n)))
}

export async function listPublishedPosts(db: D1Database): Promise<PostRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT ${POST_SELECT}
       FROM posts WHERE published = 1 ORDER BY published_at DESC LIMIT 50`,
    )
    .all<PostRecord>()
  return (results ?? []).map(normalizePost)
}

export async function listAllPosts(db: D1Database): Promise<PostRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT ${POST_SELECT}
       FROM posts ORDER BY updated_at DESC LIMIT 100`,
    )
    .all<PostRecord>()
  return (results ?? []).map(normalizePost)
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<PostRecord | null> {
  const row = await db
    .prepare(
      `SELECT ${POST_SELECT}
       FROM posts WHERE slug = ? AND published = 1`,
    )
    .bind(slug)
    .first<PostRecord>()
  return row ? normalizePost(row) : null
}

export async function getPostById(db: D1Database, id: string): Promise<PostRecord | null> {
  const row = await db
    .prepare(`SELECT ${POST_SELECT} FROM posts WHERE id = ?`)
    .bind(id)
    .first<PostRecord>()
  return row ? normalizePost(row) : null
}

function normalizePost(row: PostRecord): PostRecord {
  return {
    ...row,
    cover_width_pct: clampCoverWidthPct(row.cover_width_pct, 100),
  }
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Plain-text fallback stored in body_md for legacy/search. */
export function plainTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function createPost(
  db: D1Database,
  data: {
    title: string
    slug?: string
    excerpt?: string
    body_md?: string
    body_html?: string | null
    cover_r2_key?: string | null
    cover_alt?: string | null
    cover_width_pct?: number
    published_at?: string
    published?: boolean
  },
): Promise<string> {
  const id = crypto.randomUUID()
  const slug = data.slug?.trim() || slugifyTitle(data.title) || id.slice(0, 8)
  const body_html = data.body_html?.trim() || null
  const body_md = data.body_md?.trim() || (body_html ? plainTextFromHtml(body_html) : '')
  await db
    .prepare(
      `INSERT INTO posts (
         id, title, slug, excerpt, body_md, body_html, cover_r2_key, cover_alt, cover_width_pct,
         published_at, published, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      id,
      data.title,
      slug,
      data.excerpt ?? null,
      body_md,
      body_html,
      data.cover_r2_key ?? null,
      data.cover_alt ?? null,
      clampCoverWidthPct(data.cover_width_pct, 100),
      data.published_at ?? new Date().toISOString(),
      data.published ? 1 : 0,
    )
    .run()
  return id
}

export async function updatePost(
  db: D1Database,
  id: string,
  data: {
    title: string
    slug: string
    excerpt?: string | null
    body_md?: string
    body_html?: string | null
    cover_r2_key?: string | null
    cover_alt?: string | null
    cover_width_pct?: number
    published_at?: string | null
    published: boolean
  },
): Promise<void> {
  const body_html = data.body_html !== undefined ? data.body_html?.trim() || null : null
  const body_md =
    data.body_md ??
    (body_html != null ? plainTextFromHtml(body_html) : '')

  await db
    .prepare(
      `UPDATE posts SET
         title = ?,
         slug = ?,
         excerpt = ?,
         body_md = ?,
         body_html = ?,
         cover_r2_key = ?,
         cover_alt = ?,
         cover_width_pct = ?,
         published_at = ?,
         published = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      data.title,
      data.slug,
      data.excerpt ?? null,
      body_md,
      body_html,
      data.cover_r2_key ?? null,
      data.cover_alt ?? null,
      clampCoverWidthPct(data.cover_width_pct, 100),
      data.published_at ?? null,
      data.published ? 1 : 0,
      id,
    )
    .run()
}

export async function deletePost(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()
}

export function postCoverKey(id: string, filename: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg'
  return `posts/${id}/cover.${ext}`
}
