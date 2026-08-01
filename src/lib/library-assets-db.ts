export type LibraryAssetRecord = {
  id: string
  r2_key: string
  label: string
  content_kind: 'image' | 'pdf'
  created_at: string
}

export async function listLibraryAssets(db: D1Database): Promise<LibraryAssetRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, r2_key, label, content_kind, created_at
       FROM library_assets
       ORDER BY created_at DESC`,
    )
    .all<LibraryAssetRecord>()
  return results ?? []
}

export async function createLibraryAsset(
  db: D1Database,
  data: { r2_key: string; label: string; content_kind: 'image' | 'pdf' },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO library_assets (id, r2_key, label, content_kind)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, data.r2_key, data.label, data.content_kind)
    .run()
  return id
}

export async function getLibraryAsset(
  db: D1Database,
  id: string,
): Promise<LibraryAssetRecord | null> {
  return (
    (await db
      .prepare(
        `SELECT id, r2_key, label, content_kind, created_at FROM library_assets WHERE id = ?`,
      )
      .bind(id)
      .first<LibraryAssetRecord>()) ?? null
  )
}

export async function updateLibraryAsset(
  db: D1Database,
  id: string,
  data: { label?: string; r2_key?: string; content_kind?: 'image' | 'pdf' },
): Promise<LibraryAssetRecord | null> {
  const existing = await getLibraryAsset(db, id)
  if (!existing) return null

  const label = data.label?.trim() || existing.label
  const r2_key = data.r2_key ?? existing.r2_key
  const content_kind = data.content_kind ?? existing.content_kind

  await db
    .prepare(
      `UPDATE library_assets
       SET label = ?, r2_key = ?, content_kind = ?
       WHERE id = ?`,
    )
    .bind(label, r2_key, content_kind, id)
    .run()

  return { ...existing, label, r2_key, content_kind }
}

export async function deleteLibraryAsset(db: D1Database, id: string): Promise<string | null> {
  const existing = await getLibraryAsset(db, id)
  if (!existing) return null
  await db.prepare('DELETE FROM library_assets WHERE id = ?').bind(id).run()
  return existing.r2_key
}

export function libraryAssetKey(filename: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : 'bin'
  const safeExt = ext && /^[a-z0-9]+$/.test(ext) ? ext : 'bin'
  return `library/${crypto.randomUUID()}.${safeExt}`
}
