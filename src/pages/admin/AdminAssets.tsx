import {
  ASSET_TYPES,
  assetTypeLabel,
  isPdfAsset,
  type AssetIndexEntry,
  type AssetType,
} from '../../lib/assets-index'
import { getAssetUrl } from '../../lib/r2-assets'
import { AdminShell } from '../../views/AdminShell'
import { AdminListSearch, AdminListSection, AdminListToolbar, AdminEditButton } from '../../views/admin/AdminListSection'
import { AdminAssetManageModal, assetManageModalId } from '../../views/admin/AdminAssetManageModal'
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
        <AdminEditButton modalId={assetManageModalId(asset)} label="Manage" />
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
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  assets: AssetIndexEntry[]
  typeCounts: Record<AssetType, number>
  totalCount: number
  filterType?: AssetType
  flash?: string
  error?: string
}) {
  const listTitle = filterType ? assetTypeLabel(filterType) : 'All assets'

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Assets"
      activePath="/admin/assets"
    >
      <p class="section-lead">
        Files stored in R2 for the public site. Upload library images and PDFs for the page editor, or
        manage any file from this list.
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="form-hint-warn">{error}</p>}

      <form
        class="form admin-form-section"
        method="post"
        action="/admin/assets/upload"
        encType="multipart/form-data"
      >
        <h2>Upload to library</h2>
        <p class="form-hint">
          Files uploaded here are tagged as <strong>library</strong> assets for use in the page editor and
          other admin forms. Use the label to describe what the file is.
        </p>
        <div class="form-row">
          <div class="form-field">
            <label for="label">Label / tag</label>
            <input
              type="text"
              name="label"
              id="label"
              placeholder="e.g. Homepage hero, 2025 gala flyer"
            />
            <p class="form-hint">Optional. Shown in the library picker and asset list.</p>
          </div>
          <div class="form-field">
            <label for="file">File</label>
            <input
              type="file"
              name="file"
              id="file"
              required
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            />
            <p class="form-hint">
              Images over 5 MB are automatically resized before upload. PDFs max 25 MB.
            </p>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">
          Upload
        </button>
      </form>

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
        afterTable={assets.map((asset) => (
          <AdminAssetManageModal key={`modal-${asset.type}-${asset.entityId}`} asset={asset} filterType={filterType} />
        ))}
      />
    </AdminShell>
  )
}
