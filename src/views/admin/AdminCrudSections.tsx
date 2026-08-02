import { AdminAddButton, AdminListSearch, AdminListSection, AdminListToolbar } from './AdminListSection'
import { AdminModal, AdminModalCancelButton } from './AdminModal'

type AdminCrudAddAction = {
  buttonLabel: string
  modalId: string
  modalTitle: string
  formAction: string
  formEncType?: string
  formId?: string
  formBody: unknown
  submitLabel: string
  memberLogoForm?: boolean
  /** Use secondary button style (e.g. second add action on a shared list). */
  secondaryButton?: boolean
}

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
  /** Optional second create action (e.g. PDF + post on one page). */
  secondaryAdd?: AdminCrudAddAction
  listTitle: string
  listCount: number
  emptyMessage: string
  hasItems: boolean
  listId?: string
  tableHead: unknown
  tableBody: unknown
  afterTable?: unknown
}

function AddActionModal({ action }: { action: AdminCrudAddAction }) {
  const formId = action.formId ?? `${action.modalId}-form`
  return (
    <AdminModal
      id={action.modalId}
      title={action.modalTitle}
      formAction={action.formAction}
      formEncType={action.formEncType}
      formId={action.formId}
      memberLogoForm={action.memberLogoForm}
      footer={
        <>
          <AdminModalCancelButton />
          <button type="submit" class="btn btn-primary" form={formId}>
            {action.submitLabel}
          </button>
        </>
      }
    >
      {action.formBody}
    </AdminModal>
  )
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
  secondaryAdd,
  listTitle,
  listCount,
  emptyMessage,
  hasItems,
  listId,
  tableHead,
  tableBody,
  afterTable,
}: AdminCrudSectionsProps) {
  const primaryAdd: AdminCrudAddAction = {
    buttonLabel: addButtonLabel,
    modalId: addModalId,
    modalTitle: addModalTitle,
    formAction: addFormAction,
    formEncType: addFormEncType,
    formId: addFormId,
    formBody: addFormBody,
    submitLabel: addSubmitLabel,
    memberLogoForm,
  }

  return (
    <>
      {breadcrumb}
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="admin-flash admin-flash-error">{error}</p>}

      <AddActionModal action={primaryAdd} />
      {secondaryAdd ? <AddActionModal action={secondaryAdd} /> : null}

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
            {secondaryAdd ? (
              <AdminAddButton
                label={secondaryAdd.buttonLabel}
                modalId={secondaryAdd.modalId}
                secondary={secondaryAdd.secondaryButton !== false}
              />
            ) : null}
          </AdminListToolbar>
        }
        tableHead={tableHead}
        tableBody={tableBody}
        afterTable={afterTable}
      />
    </>
  )
}
