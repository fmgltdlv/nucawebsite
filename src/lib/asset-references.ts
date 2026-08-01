import { deleteAsset } from './r2-assets'

/** Count how many site records reference the same R2 object key. */
export async function countAssetKeyReferences(db: D1Database, key: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM members WHERE logo_r2_key = ?1) +
        (SELECT COUNT(*) FROM dirt_releases WHERE pdf_r2_key = ?1) +
        (SELECT COUNT(*) FROM leadership WHERE photo_r2_key = ?1) +
        (SELECT COUNT(*) FROM events WHERE thumbnail_r2_key = ?1) +
        (SELECT COUNT(*) FROM events WHERE flyer_r2_key = ?1) +
        (SELECT COUNT(*) FROM library_assets WHERE r2_key = ?1) +
        (SELECT COUNT(*) FROM site_settings WHERE key = 'logo_r2_key' AND value_json = ?2)
      AS total`,
    )
    .bind(key, JSON.stringify(key))
    .first<{ total: number }>()

  return row?.total ?? 0
}

/**
 * Delete an R2 object only when at most one database record still references it
 * (the record being updated or removed). Shared assets are left intact.
 */
export async function deleteAssetIfUnreferenced(
  r2: R2Bucket,
  db: D1Database,
  key: string,
): Promise<void> {
  if (!key) return
  const refs = await countAssetKeyReferences(db, key)
  if (refs <= 1) {
    await deleteAsset(r2, key)
  }
}
