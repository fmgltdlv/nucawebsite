type AdminListSectionProps = {
  title: string
  count: number
  emptyMessage: string
  hasItems: boolean
  listId?: string
  toolbar?: unknown
  tableHead: unknown
  tableBody: unknown
  afterTable?: unknown
}

export function AdminListSection({
  title,
  count,
  emptyMessage,
  hasItems,
  listId = 'admin-list',
  toolbar,
  tableHead,
  tableBody,
  afterTable,
}: AdminListSectionProps) {
  return (
    <section class="section admin-list-section" data-admin-list data-page-size="15" id={listId}>
      <div class="admin-list-header">
        <h2>{title} ({count})</h2>
        {toolbar}
      </div>
      {hasItems ? (
        <>
          <div class="table-wrap">
            <table class="data-table admin-list-table">
              <thead>{tableHead}</thead>
              <tbody data-admin-list-body>{tableBody}</tbody>
            </table>
          </div>
          <nav class="admin-list-pagination" data-admin-pagination hidden aria-label="List pagination">
            <button type="button" class="btn btn-secondary btn-sm" data-admin-page-prev disabled>
              Previous
            </button>
            <span class="admin-list-page-info" data-admin-page-info></span>
            <button type="button" class="btn btn-secondary btn-sm" data-admin-page-next disabled>
              Next
            </button>
          </nav>
          {afterTable}
        </>
      ) : (
        <p class="muted">{emptyMessage}</p>
      )}
    </section>
  )
}

export function AdminListSearch() {
  return (
    <label class="admin-list-search">
      <span class="visually-hidden">Search list</span>
      <input
        type="search"
        class="admin-list-search-input"
        data-admin-search
        placeholder="Search…"
        autocomplete="off"
      />
    </label>
  )
}

export function AdminAddButton({
  label,
  modalId,
  secondary = false,
}: {
  label: string
  modalId: string
  secondary?: boolean
}) {
  return (
    <button
      type="button"
      class={secondary ? 'btn btn-secondary' : 'btn btn-primary'}
      data-admin-modal-open={modalId}
    >
      {label}
    </button>
  )
}

export function AdminListToolbar({ children }: { children: unknown }) {
  return <div class="admin-list-toolbar">{children}</div>
}

export function AdminEditButton({ modalId, label = 'Edit' }: { modalId: string; label?: string }) {
  return (
    <button type="button" class="btn btn-secondary btn-sm" data-admin-modal-open={modalId}>
      {label}
    </button>
  )
}
