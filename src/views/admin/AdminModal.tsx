type AdminModalProps = {
  id: string
  title: string
  children: unknown
  footer?: unknown
  formMethod?: 'get' | 'post'
  formAction?: string
  formEncType?: string
  formId?: string
  memberLogoForm?: boolean
}

export function AdminModal({
  id,
  title,
  children,
  footer,
  formMethod = 'post',
  formAction,
  formEncType,
  formId,
  memberLogoForm,
}: AdminModalProps) {
  const resolvedFormId = formId ?? `${id}-form`

  return (
    <dialog id={id} class="admin-modal">
      <div class="admin-modal-form">
        <header class="admin-modal-header">
          <h2>{title}</h2>
          <button type="button" class="admin-modal-close" aria-label="Close" data-modal-close>
            ×
          </button>
        </header>
        <form
          id={resolvedFormId}
          class="form admin-modal-body-form"
          method={formMethod}
          action={formAction}
          encType={formEncType}
          data-member-logo-form={memberLogoForm ? '' : undefined}
        >
          <div class="admin-modal-body">{children}</div>
        </form>
        {footer && <footer class="admin-modal-footer">{footer}</footer>}
      </div>
    </dialog>
  )
}

type AdminModalShellProps = {
  id: string
  title: string
  children: unknown
  footer?: unknown
}

/** Dialog without a wrapping form (e.g. display-only or nested forms). */
export function AdminModalShell({ id, title, children, footer }: AdminModalShellProps) {
  return (
    <dialog id={id} class="admin-modal">
      <div class="admin-modal-form">
        <header class="admin-modal-header">
          <h2>{title}</h2>
          <button type="button" class="admin-modal-close" aria-label="Close" data-modal-close>
            ×
          </button>
        </header>
        <div class="admin-modal-body">{children}</div>
        {footer && <footer class="admin-modal-footer">{footer}</footer>}
      </div>
    </dialog>
  )
}

export function AdminModalCancelButton() {
  return (
    <button type="button" class="btn btn-secondary" data-modal-close>
      Cancel
    </button>
  )
}
