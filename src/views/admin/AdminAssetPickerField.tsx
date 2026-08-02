import type { AssetContentKind } from '../../lib/assets-index'

type AdminAssetPickerFieldProps = {
  label: string
  kind: AssetContentKind
  hiddenInputName: string
  /** When omitted, only the asset library picker is shown (no separate file input). */
  fileInputName?: string
  fileInputId?: string
  fileAccept?: string
  currentKey?: string | null
  currentUrl?: string | null
  removeCheckboxName?: string
  hint?: string
}

export function AdminAssetPickerField({
  label,
  kind,
  hiddenInputName,
  fileInputName,
  fileInputId,
  fileAccept,
  currentKey,
  currentUrl,
  removeCheckboxName,
  hint,
}: AdminAssetPickerFieldProps) {
  const showFileInput = Boolean(fileInputName && fileInputId)

  return (
    <div class="form-field admin-asset-picker-field" data-asset-picker data-asset-kind={kind}>
      {showFileInput ? <label for={fileInputId}>{label}</label> : <span class="form-field-label">{label}</span>}

      <div class="admin-asset-picker-preview" data-asset-picker-preview hidden={!currentUrl}>
        {currentUrl && kind === 'image' && (
          <img
            src={currentUrl}
            alt=""
            class="admin-modal-logo-preview"
            data-asset-picker-preview-image
            loading="lazy"
            decoding="async"
          />
        )}
        {currentUrl && kind === 'pdf' && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-asset-picker-preview-link
          >
            View current PDF
          </a>
        )}
      </div>

      <input
        type="hidden"
        name={hiddenInputName}
        value={currentKey ?? ''}
        data-asset-picker-value
      />

      <div class="admin-asset-picker-actions">
        {showFileInput && (
          <input
            type="file"
            name={fileInputName}
            id={fileInputId}
            accept={fileAccept}
            data-asset-picker-file
          />
        )}
        <button type="button" class="btn btn-secondary btn-sm" data-asset-picker-open>
          Choose from library
        </button>
        <button type="button" class="btn btn-secondary btn-sm" data-asset-picker-clear hidden={!currentKey}>
          Clear
        </button>
      </div>

      {removeCheckboxName && currentKey && (
        <label class="admin-check">
          <input type="checkbox" name={removeCheckboxName} value="1" data-asset-picker-remove />
          Remove current {kind === 'pdf' ? 'PDF' : 'image'}
        </label>
      )}

      {hint && <p class="form-hint">{hint}</p>}
    </div>
  )
}
