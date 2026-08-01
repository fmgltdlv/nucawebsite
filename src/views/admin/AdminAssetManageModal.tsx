import {
  assetTypeLabel,
  isPdfAsset,
  type AssetIndexEntry,
  type AssetType,
} from '../../lib/assets-index'
import { getAssetUrl } from '../../lib/r2-assets'
import { AdminAssetPickerField } from './AdminAssetPickerField'
import { AdminModal, AdminModalCancelButton } from './AdminModal'

function assetModalId(asset: AssetIndexEntry): string {
  return `manage-asset-${asset.type}-${asset.entityId}`
}

function assetFormId(asset: AssetIndexEntry): string {
  return `form-asset-${asset.type}-${asset.entityId}`
}

function linkedRecordLabel(type: AssetType): string {
  switch (type) {
    case 'site_logo':
      return 'Site settings'
    case 'member_logo':
      return 'Member'
    case 'dirt_pdf':
      return 'THE DIRT release'
    case 'leadership_photo':
      return 'Leader'
    case 'event_thumbnail':
    case 'event_flyer':
      return 'Event'
    default:
      return 'Record'
  }
}

function AssetManagePreview({ asset }: { asset: AssetIndexEntry }) {
  const url = getAssetUrl(asset.key)

  if (isPdfAsset(asset)) {
    return (
      <a href={url} class="admin-asset-pdf-preview" target="_blank" rel="noopener noreferrer">
        <span class="admin-asset-pdf-icon" aria-hidden="true">
          PDF
        </span>
      </a>
    )
  }

  return (
    <img
      src={url}
      alt=""
      class="admin-modal-logo-preview"
      loading="lazy"
      decoding="async"
    />
  )
}

export function AdminAssetManageModal({
  asset,
  filterType,
}: {
  asset: AssetIndexEntry
  filterType?: AssetType
}) {
  const modalId = assetModalId(asset)
  const formId = assetFormId(asset)
  const url = getAssetUrl(asset.key)
  const isLibrary = asset.type === 'library'
  const isPdf = isPdfAsset(asset)
  const isLogo = asset.type === 'site_logo' || asset.type === 'member_logo'
  const canRemove = !isLibrary && asset.type !== 'dirt_pdf'
  const imageAccept = isLogo
    ? 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
    : 'image/png,image/jpeg,image/webp,image/gif'

  return (
    <AdminModal
      id={modalId}
      title="Manage asset"
      formAction="/admin/assets/manage"
      formEncType="multipart/form-data"
      formId={formId}
      memberLogoForm={isLogo}
      footer={
        isLibrary ? (
          <>
            <AdminModalCancelButton />
            <form
              method="post"
              action={`/admin/assets/library/${asset.entityId}/delete`}
              class="admin-inline-form"
              onsubmit="return confirm('Delete this library upload?')"
            >
              <button type="submit" class="btn btn-secondary">
                Delete
              </button>
            </form>
            <button type="submit" class="btn btn-primary" form={formId}>
              Save
            </button>
          </>
        ) : (
          <>
            <AdminModalCancelButton />
            <button type="submit" class="btn btn-primary" form={formId}>
              Save
            </button>
          </>
        )
      }
    >
      <input type="hidden" name="asset_type" value={asset.type} />
      <input type="hidden" name="entity_id" value={asset.entityId} />
      <input type="hidden" name="current_key" value={asset.key} />
      {filterType && <input type="hidden" name="return_type" value={filterType} />}

      <div class="form-field">
        <span class="form-label">Preview</span>
        <AssetManagePreview asset={asset} />
      </div>

      <div class="form-row">
        <div class="form-field">
          <span class="form-label">Type</span>
          <p>{assetTypeLabel(asset.type)}</p>
        </div>
        <div class="form-field">
          <span class="form-label">Storage key</span>
          <p>
            <code class="admin-asset-key">{asset.key}</code>
          </p>
        </div>
      </div>

      {isLibrary ? (
        <>
          <div class="form-field">
            <label for={`${formId}-label`}>Label</label>
            <input type="text" name="label" id={`${formId}-label`} value={asset.label} required />
          </div>
          <div class="form-field">
            <label for={`${formId}-file`}>Replace file</label>
            <input
              type="file"
              name="file"
              id={`${formId}-file`}
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            />
            <p class="form-hint">Leave empty to keep the current file.</p>
          </div>
        </>
      ) : (
        <>
          <p class="form-hint">
            Used by {linkedRecordLabel(asset.type).toLowerCase()}:{' '}
            <a href={asset.adminEditUrl}>{asset.label}</a>
          </p>
          <AdminAssetPickerField
            label={isPdf ? 'PDF file' : 'Image file'}
            kind={isPdf ? 'pdf' : 'image'}
            hiddenInputName="existing_asset_key"
            fileInputName="file"
            fileInputId={`${formId}-file`}
            fileAccept={isPdf ? 'application/pdf' : imageAccept}
            currentKey={asset.key}
            currentUrl={url}
            removeCheckboxName={canRemove ? 'remove_asset' : undefined}
            hint="Upload a replacement, choose from the library, or remove the current file."
          />
        </>
      )}
    </AdminModal>
  )
}

export function assetManageModalId(asset: AssetIndexEntry): string {
  return assetModalId(asset)
}
