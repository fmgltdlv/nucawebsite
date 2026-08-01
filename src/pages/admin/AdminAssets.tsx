import {
  ASSET_TYPES,
  assetTypeLabel,
  isPdfAsset,
  type AssetIndexEntry,
  type AssetType,
} from '../../lib/assets-index'
import { getAssetUrl } from '../../lib/r2-assets'
import { AdminShell } from '../../views/AdminShell'
import { AdminListSearch, AdminListSection, AdminListToolbar } from '../../views/admin/AdminListSection'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function assetSearchText(asset: AssetIndexEntry): string {
  return [asset.label, asset.key, assetTypeLabel(asset.type), asset.entityId].join(' ').toLowerCase()
}

function AssetPreview({ asset }: { asset: AssetIndexEntry }) {
  const url = getAssetUrl(asset.key)

  if (isPdfAsset(asset)) {
    return (
      <a href={url} class="admin-asset-pdf-preview" target="_blank" rel="noopener noreferrer" title="Open PDF">
        <span class="admin-asset-pdf-icon" aria-hidden="true">
          PDF
        </span>
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="Open image">
      <img
        src={url}
        alt=""
        class="admin-member-logo-preview"
        loading="lazy"
        decoding="async"
      />
    </a>
  )
}

function AssetRow({ asset }: { asset: AssetIndexEntry }) {
  return (
    <tr data-admin-list-row data-search={assetSearchText(asset)}>
      <td class="admin-list-logo-cell">
        <AssetPreview asset={asset} />
      </td>
      <td>
        <span class="admin-asset-type-badge">{assetTypeLabel(asset.type)}</span>
      </td>
      <td>
        <strong>{asset.label}</strong>
      </td>
      <td>
        <code class="admin-asset-key">{asset.key}</code>
      </td>
      <td class="admin-list-actions">
        <a href={asset.adminEditUrl} class="btn btn-secondary btn-sm">
          Manage
        </a>
      </td>
    </tr>
  )
}

function AssetTypeFilters({
  activeType,
  typeCounts,
  totalCount,
}: {
  activeType?: AssetType
  typeCounts: Record<AssetType, number>
  totalCount: number
}) {
  return (
    <nav class="admin-asset-filters" aria-label="Filter by asset type">
      <a href="/admin/assets" class={activeType ? 'admin-asset-filter' : 'admin-asset-filter admin-asset-filter-active'}>
        All ({totalCount})
      </a>
      {ASSET_TYPES.map((type) => (
        <a
          key={type}
          href={`/admin/assets?type=${type}`}
          class={activeType === type ? 'admin-asset-filter admin-asset-filter-active' : 'admin-asset-filter'}
        >
          {assetTypeLabel(type)} ({typeCounts[type]})
        </a>
      ))}
    </nav>
  )
}

export function AdminAssetsPage({
  ctx,
  assets,
  typeCounts,
  totalCount,
  filterType,
  ...site
}: PageProps & {
  ctx: AdminContext
  assets: AssetIndexEntry[]
  typeCounts: Record<AssetType, number>
  totalCount: number
  filterType?: AssetType
}) {
  const listTitle = filterType ? assetTypeLabel(filterType) : 'All assets'

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      inboxCounts={ctx.inboxCounts}
      title="Assets"
      activePath="/admin/assets"
    >
      <p class="section-lead">
        Files stored in R2 for the public site. Edit or replace them from the linked management screens.
      </p>

      <AssetTypeFilters activeType={filterType} typeCounts={typeCounts} totalCount={totalCount} />

      <AdminListSection
        title={listTitle}
        count={assets.length}
        emptyMessage={
          filterType
            ? `No ${assetTypeLabel(filterType).toLowerCase()} uploaded yet.`
            : 'No uploaded assets yet.'
        }
        hasItems={assets.length > 0}
        listId="admin-assets-list"
        toolbar={
          <AdminListToolbar>
            <AdminListSearch />
          </AdminListToolbar>
        }
        tableHead={
          <tr>
            <th scope="col">Preview</th>
            <th scope="col">Type</th>
            <th scope="col">Used by</th>
            <th scope="col">Storage key</th>
            <th scope="col">
              <span class="visually-hidden">Actions</span>
            </th>
          </tr>
        }
        tableBody={assets.map((asset) => (
          <AssetRow key={`${asset.type}-${asset.entityId}-${asset.key}`} asset={asset} />
        ))}
      />
    </AdminShell>
  )
}
