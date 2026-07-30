export type PostRecord = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body_md: string
  published_at: string | null
  published: number
}

export async function listPublishedPosts(db: D1Database): Promise<PostRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, slug, excerpt, body_md, published_at, published
       FROM posts WHERE published = 1 ORDER BY published_at DESC LIMIT 50`,
    )
    .all<PostRecord>()
  return results ?? []
}

export async function listAllPosts(db: D1Database): Promise<PostRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, slug, excerpt, body_md, published_at, published
       FROM posts ORDER BY updated_at DESC LIMIT 100`,
    )
    .all<PostRecord>()
  return results ?? []
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<PostRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT id, title, slug, excerpt, body_md, published_at, published
         FROM posts WHERE slug = ? AND published = 1`,
      )
      .bind(slug)
      .first<PostRecord>()) ?? null
  )
}

export async function getPostById(db: D1Database, id: string): Promise<PostRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT id, title, slug, excerpt, body_md, published_at, published FROM posts WHERE id = ?`,
      )
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

export async function createPost(
  db: D1Database,
  data: {
    title: string
    slug?: string
    excerpt?: string
    body_md: string
    published_at?: string
    published?: boolean
  },
): Promise<string> {
  const id = crypto.randomUUID()
  const slug = data.slug?.trim() || slugifyTitle(data.title) || id.slice(0, 8)
  await db
    .prepare(
      `INSERT INTO posts (id, title, slug, excerpt, body_md, published_at, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      id,
      data.title,
      slug,
      data.excerpt ?? null,
      data.body_md,
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
    body_md: string
    published_at?: string | null
    published: boolean
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE posts SET title = ?, slug = ?, excerpt = ?, body_md = ?, published_at = ?, published = ?,
       updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(
      data.title,
      data.slug,
      data.excerpt ?? null,
      data.body_md,
      data.published_at ?? null,
      data.published ? 1 : 0,
      id,
    )
    .run()
}

export async function deletePost(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()
}
