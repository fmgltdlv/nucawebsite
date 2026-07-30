import { AdminModalCancelButton } from './AdminModal'

type AdminEditActionsProps = {
  formId: string
  saveAction: string
  deleteAction: string
  encType?: string
  saveLabel?: string
  deleteLabel?: string
}

/** Save + delete actions for edit modals (footer: cancel, delete, save). */
export function AdminEditModalFooter({
  formId,
  saveAction,
  deleteAction,
  encType,
  saveLabel = 'Save',
  deleteLabel = 'Delete',
}: AdminEditActionsProps) {
  return (
    <>
      <AdminModalCancelButton />
      <form method="post" action={deleteAction} class="admin-inline-form">
        <button type="submit" class="btn btn-secondary">{deleteLabel}</button>
      </form>
      <button type="submit" class="btn btn-primary" form={formId}>{saveLabel}</button>
    </>
  )
}

/** Legacy inline save/delete pair (avoid for new list rows). */
export function AdminEditActions({ formId, saveAction, deleteAction, encType }: AdminEditActionsProps) {
  return (
    <>
      <form id={formId} method="post" action={saveAction} encType={encType}>
        <button type="submit" class="btn btn-secondary btn-sm">
          Save
        </button>
      </form>
      <form method="post" action={deleteAction} class="admin-inline-form">
        <button type="submit" class="btn btn-secondary btn-sm">
          Delete
        </button>
      </form>
    </>
  )
}
