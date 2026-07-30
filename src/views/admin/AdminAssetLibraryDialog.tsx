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
