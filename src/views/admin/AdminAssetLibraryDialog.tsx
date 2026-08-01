import { AdminModalCancelButton } from './AdminModal'

export function AdminAssetLibraryDialog() {
  return (
    <dialog id="asset-library-dialog" class="admin-modal admin-asset-library-dialog">
      <div class="admin-modal-form">
        <header class="admin-modal-header">
          <h2>Asset library</h2>
          <button type="button" class="admin-modal-close" aria-label="Close" data-modal-close>
            ×
          </button>
        </header>
        <div class="admin-modal-body">
          <div class="admin-asset-library-toolbar">
            <label class="admin-list-search admin-asset-library-search">
              <span class="visually-hidden">Search assets</span>
              <input
                type="search"
                class="admin-list-search-input"
                data-asset-library-search
                placeholder="Search by name or key…"
                autocomplete="off"
              />
            </label>
            <div class="admin-asset-library-upload" data-asset-library-upload>
              <input
                type="text"
                class="admin-asset-library-upload-label"
                data-asset-library-upload-label
                placeholder="Label (optional)"
                autocomplete="off"
              />
              <input
                type="file"
                class="visually-hidden"
                data-asset-library-upload-file
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              />
              <button type="button" class="btn btn-secondary btn-sm" data-asset-library-upload-btn>
                Upload
              </button>
              <span class="admin-asset-library-upload-status muted" data-asset-library-upload-status hidden></span>
            </div>
          </div>
          <p class="muted" data-asset-library-loading>
            Loading assets…
          </p>
          <p class="muted" data-asset-library-empty hidden>
            No matching assets in the library.
          </p>
          <div class="admin-asset-library-grid" data-asset-library-grid hidden></div>
        </div>
        <footer class="admin-modal-footer">
          <AdminModalCancelButton />
        </footer>
      </div>
    </dialog>
  )
}
