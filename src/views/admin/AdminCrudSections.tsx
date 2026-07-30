type AdminCrudSectionsProps = {
  breadcrumb?: unknown
  flash?: string
  error?: string
  addTitle: string
  addForm: unknown
  listTitle: string
  listCount: number
  emptyMessage: string
  hasItems: boolean
  table: unknown
}

export function AdminCrudSections({
  breadcrumb,
  flash,
  error,
  addTitle,
  addForm,
  listTitle,
  listCount,
  emptyMessage,
  hasItems,
  table,
}: AdminCrudSectionsProps) {
  return (
    <>
      {breadcrumb}
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="admin-flash admin-flash-error">{error}</p>}
      <section class="admin-form-section">
        <h2>{addTitle}</h2>
        {addForm}
      </section>
      <section class="section">
        <h2>
          {listTitle} ({listCount})
        </h2>
        {hasItems ? table : <p class="muted">{emptyMessage}</p>}
      </section>
    </>
  )
}
