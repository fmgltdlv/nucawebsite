type AdminEditActionsProps = {
  formId: string
  saveAction: string
  deleteAction: string
  encType?: string
}

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
