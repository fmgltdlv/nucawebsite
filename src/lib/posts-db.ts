export type PostRecord = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body_md: string
  body_html: string | null
  cover_r2_key: string | null
  cover_alt: string | null
  published_at: string | null
  published: number
}

const POST_SELECT = `id, title, slug, excerpt, body_md, body_html, cover_r2_key, cover_alt, published_at, published`

export async function listPublishedPosts(db: D1Database): Promise<PostRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT ${POST_SELECT}
       FROM posts WHERE published = 1 ORDER BY published_at DESC LIMIT 50`,
    )
    .all<PostRecord>()
  return results ?? []
}

export async function listAllPosts(db: D1Database): Promise<PostRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT ${POST_SELECT}
       FROM posts ORDER BY updated_at DESC LIMIT 100`,
    )
    .all<PostRecord>()
  return results ?? []
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<PostRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT ${POST_SELECT}
         FROM posts WHERE slug = ? AND published = 1`,
      )
      .bind(slug)
      .first<PostRecord>()) ?? null
  )
}

export async function getPostById(db: D1Database, id: string): Promise<PostRecord | null> {
  return (
    (await db
      .prepare(`SELECT ${POST_SELECT} FROM posts WHERE id = ?`)
      .bind(id)
      .first<PostRecord>()) ?? null
  )
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
         id, title, slug, excerpt, body_md, body_html, cover_r2_key, cover_alt,
         published_at, published, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
