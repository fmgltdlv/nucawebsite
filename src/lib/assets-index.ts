export type AssetType =
  | 'site_logo'
  | 'member_logo'
  | 'dirt_pdf'
  | 'leadership_photo'
  | 'event_thumbnail'
  | 'event_flyer'
  | 'library'

export const ASSET_TYPES: AssetType[] = [
  'site_logo',
  'member_logo',
  'dirt_pdf',
  'leadership_photo',
  'event_thumbnail',
  'event_flyer',
  'library',
]

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  site_logo: 'Site logo',
  member_logo: 'Member logos',
  dirt_pdf: 'THE DIRT PDFs',
  leadership_photo: 'Leadership photos',
  event_thumbnail: 'Event thumbnails',
  event_flyer: 'Event flyers',
  library: 'Library uploads',
}

export type AssetContentKind = 'image' | 'pdf'

export type AssetIndexEntry = {
  type: AssetType
  key: string
  entityId: string
  label: string
  adminEditUrl: string
  contentKind: AssetContentKind
}

export function parseAssetType(value: string | undefined): AssetType | undefined {
  if (!value) return undefined
  return ASSET_TYPES.includes(value as AssetType) ? (value as AssetType) : undefined
}

export function assetTypeLabel(type: AssetType): string {
  return ASSET_TYPE_LABELS[type]
}

export function isPdfAsset(entry: Pick<AssetIndexEntry, 'contentKind' | 'key'>): boolean {
  return entry.contentKind === 'pdf' || entry.key.endsWith('.pdf')
}

async function listSiteLogoAssets(db: D1Database): Promise<AssetIndexEntry[]> {
  const row = await db
    .prepare('SELECT value_json FROM site_settings WHERE key = ?')
    .bind('logo_r2_key')
    .first<{ value_json: string }>()
  if (!row) return []

  let key: string | null = null
  try {
    key = JSON.parse(row.value_json) as string
  } catch {
    return []
  }
  if (!key) return []

  return [
    {
      type: 'site_logo' as const,
      key,
      entityId: 'site',
      label: 'Header logo',
      adminEditUrl: '/admin/content/settings',
      contentKind: 'image' as const,
    },
  ]
}

async function listMemberLogoAssets(db: D1Database): Promise<AssetIndexEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT id, company_name, logo_r2_key
       FROM members
       WHERE logo_r2_key IS NOT NULL AND logo_r2_key != ''
       ORDER BY company_name COLLATE NOCASE`,
    )
    .all<{ id: string; company_name: string; logo_r2_key: string }>()

  return (results ?? []).map((row) => ({
    type: 'member_logo' as const,
    key: row.logo_r2_key,
    entityId: row.id,
    label: row.company_name,
    adminEditUrl: '/admin/members',
    contentKind: 'image' as const,
  }))
}

async function listDirtPdfAssets(db: D1Database): Promise<AssetIndexEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, pdf_r2_key
       FROM dirt_releases
       WHERE pdf_r2_key IS NOT NULL AND pdf_r2_key != ''
       ORDER BY published_at DESC`,
    )
    .all<{ id: string; title: string; pdf_r2_key: string }>()

  return (results ?? []).map((row) => ({
    type: 'dirt_pdf' as const,
    key: row.pdf_r2_key,
    entityId: row.id,
    label: row.title,
    adminEditUrl: '/admin/content/the-dirt',
    contentKind: 'pdf' as const,
  }))
}

async function listLeadershipPhotoAssets(db: D1Database): Promise<AssetIndexEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name, photo_r2_key
       FROM leadership
       WHERE photo_r2_key IS NOT NULL AND photo_r2_key != ''
       ORDER BY sort_order, name COLLATE NOCASE`,
    )
    .all<{ id: string; name: string; photo_r2_key: string }>()

  return (results ?? []).map((row) => ({
    type: 'leadership_photo' as const,
    key: row.photo_r2_key,
    entityId: row.id,
    label: row.name,
    adminEditUrl: '/admin/content/leadership',
    contentKind: 'image' as const,
  }))
}

async function listEventImageAssets(
  db: D1Database,
  column: 'thumbnail_r2_key' | 'flyer_r2_key',
  type: 'event_thumbnail' | 'event_flyer',
): Promise<AssetIndexEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, ${column} AS r2_key
       FROM events
       WHERE ${column} IS NOT NULL AND ${column} != ''
       ORDER BY starts_at DESC`,
    )
    .all<{ id: string; title: string; r2_key: string }>()

  return (results ?? []).map((row) => ({
    type,
    key: row.r2_key,
    entityId: row.id,
    label: row.title,
    adminEditUrl: '/admin/events',
    contentKind: 'image' as const,
  }))
}

async function listLibraryUploadAssets(db: D1Database): Promise<AssetIndexEntry[]> {
  try {
    const { results } = await db
      .prepare(
        `SELECT id, r2_key, label, content_kind
         FROM library_assets
         ORDER BY created_at DESC`,
      )
      .all<{ id: string; r2_key: string; label: string; content_kind: string }>()

    return (results ?? []).map((row) => ({
      type: 'library' as const,
      key: row.r2_key,
      entityId: row.id,
      label: row.label,
      adminEditUrl: '/admin/assets?type=library',
      contentKind: row.content_kind === 'pdf' ? ('pdf' as const) : ('image' as const),
    }))
  } catch {
    // Table may not exist until migration 0023 is applied.
    return []
  }
}

export async function listIndexedAssets(
  db: D1Database,
  filterType?: AssetType,
): Promise<AssetIndexEntry[]> {
  const loaders: Record<AssetType, () => Promise<AssetIndexEntry[]>> = {
    site_logo: () => listSiteLogoAssets(db),
    member_logo: () => listMemberLogoAssets(db),
    dirt_pdf: () => listDirtPdfAssets(db),
    leadership_photo: () => listLeadershipPhotoAssets(db),
    event_thumbnail: () => listEventImageAssets(db, 'thumbnail_r2_key', 'event_thumbnail'),
    event_flyer: () => listEventImageAssets(db, 'flyer_r2_key', 'event_flyer'),
    library: () => listLibraryUploadAssets(db),
  }

  if (filterType) {
    return loaders[filterType]()
  }

  const groups = await Promise.all(ASSET_TYPES.map((type) => loaders[type]()))
  return groups.flat()
}

export function countAssetsByType(assets: AssetIndexEntry[]): Record<AssetType, number> {
  const counts = Object.fromEntries(ASSET_TYPES.map((type) => [type, 0])) as Record<AssetType, number>
  for (const asset of assets) {
    counts[asset.type] += 1
  }
  return counts
}

export function filterAssetsByKind(
  assets: AssetIndexEntry[],
  kind: AssetContentKind,
): AssetIndexEntry[] {
  return assets.filter((asset) => asset.contentKind === kind)
}

export function dedupeAssetsByKey(assets: AssetIndexEntry[]): AssetIndexEntry[] {
  const seen = new Set<string>()
  const result: AssetIndexEntry[] = []
  for (const asset of assets) {
    if (seen.has(asset.key)) continue
    seen.add(asset.key)
    result.push(asset)
  }
  return result
}
