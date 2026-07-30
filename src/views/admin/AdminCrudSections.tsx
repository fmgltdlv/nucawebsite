import { AdminAddButton, AdminListSearch, AdminListSection, AdminListToolbar } from './AdminListSection'
import { AdminModal, AdminModalCancelButton } from './AdminModal'

type AdminCrudSectionsProps = {
  breadcrumb?: unknown
  flash?: string
  error?: string
  addButtonLabel: string
  addModalId: string
  addModalTitle: string
  addFormAction: string
  addFormEncType?: string
  addFormId?: string
  addFormBody: unknown
  addSubmitLabel: string
  memberLogoForm?: boolean
  listTitle: string
  listCount: number
  emptyMessage: string
  hasItems: boolean
  listId?: string
  tableHead: unknown
  tableBody: unknown
  afterTable?: unknown
}

export function AdminCrudSections({
  breadcrumb,
  flash,
  error,
  addButtonLabel,
  addModalId,
  addModalTitle,
  addFormAction,
  addFormEncType,
  addFormId,
  addFormBody,
  addSubmitLabel,
  memberLogoForm,
  listTitle,
  listCount,
  emptyMessage,
  hasItems,
  listId,
  tableHead,
  tableBody,
  afterTable,
}: AdminCrudSectionsProps) {
  return (
    <>
      {breadcrumb}
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="admin-flash admin-flash-error">{error}</p>}

      <AdminModal
        id={addModalId}
        title={addModalTitle}
        formAction={addFormAction}
        formEncType={addFormEncType}
        formId={addFormId}
        memberLogoForm={memberLogoForm}
        footer={
          <>
            <AdminModalCancelButton />
            <button type="submit" class="btn btn-primary" form={addFormId ?? `${addModalId}-form`}>
              {addSubmitLabel}
            </button>
          </>
        }
      >
        {addFormBody}
      </AdminModal>

      <AdminListSection
        title={listTitle}
        count={listCount}
        emptyMessage={emptyMessage}
        hasItems={hasItems}
        listId={listId}
        toolbar={
          <AdminListToolbar>
            <AdminListSearch />
            <AdminAddButton label={addButtonLabel} modalId={addModalId} />
          </AdminListToolbar>
        }
        tableHead={tableHead}
        tableBody={tableBody}
        afterTable={afterTable}
      />
    </>
  )
}
