import { deleteAsset } from './r2-assets'

/** Count image block references to an asset key inside parsed page block JSON. */
function countAssetKeyInBlocks(blocks: unknown, key: string): number {
  if (!Array.isArray(blocks)) return 0
  let count = 0
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const record = block as Record<string, unknown>
    if (record.type === 'image' && record.asset_key === key) count++
    if (record.type === 'section' && Array.isArray(record.blocks)) {
      count += countAssetKeyInBlocks(record.blocks, key)
    }
  }
  return count
}

async function countPageBodyAssetKeyReferences(db: D1Database, key: string): Promise<number> {
  const { results } = await db
    .prepare('SELECT body_json FROM pages WHERE body_json IS NOT NULL')
    .all<{ body_json: string }>()

  let count = 0
  for (const row of results ?? []) {
    try {
      count += countAssetKeyInBlocks(JSON.parse(row.body_json), key)
    } catch {
      // Ignore invalid JSON rows.
    }
  }
  return count
}

/** Count how many site records reference the same R2 object key. */
export async function countAssetKeyReferences(db: D1Database, key: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM members WHERE logo_r2_key = ?1) +
        (SELECT COUNT(*) FROM dirt_releases WHERE pdf_r2_key = ?1) +
        (SELECT COUNT(*) FROM leadership WHERE photo_r2_key = ?1) +
        (SELECT COUNT(*) FROM committees WHERE photo_r2_key = ?1) +
        (SELECT COUNT(*) FROM events WHERE thumbnail_r2_key = ?1) +
        (SELECT COUNT(*) FROM events WHERE flyer_r2_key = ?1) +
        (SELECT COUNT(*) FROM library_assets WHERE r2_key = ?1) +
        (SELECT COUNT(*) FROM site_settings WHERE key = 'logo_r2_key' AND value_json = ?2)
      AS total`,
    )
    .bind(key, JSON.stringify(key))
    .first<{ total: number }>()

  const tableRefs = row?.total ?? 0
  const pageRefs = await countPageBodyAssetKeyReferences(db, key)
  return tableRefs + pageRefs
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
