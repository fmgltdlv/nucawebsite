import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminProfilePage({
  ctx,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Profile"
      activePath="/admin/profile"
    >
      <p class="admin-note">
        Signed in as <strong>{ctx.user.email}</strong>
        {ctx.user.display_name ? ` (${ctx.user.display_name})` : ''}.
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="form-hint-warn">{error}</p>}

      <form class="form admin-form-section" method="post" action="/admin/profile/password">
        <h2>Change password</h2>
        <div class="form-field">
          <label for="current_password">Current password</label>
          <input
            type="password"
            name="current_password"
            id="current_password"
            required
            autocomplete="current-password"
          />
        </div>
        <div class="form-field">
          <label for="new_password">New password</label>
          <input
            type="password"
            name="new_password"
            id="new_password"
            required
            minlength={10}
            autocomplete="new-password"
          />
        </div>
        <div class="form-field">
          <label for="confirm_password">Confirm new password</label>
          <input
            type="password"
            name="confirm_password"
            id="confirm_password"
            required
            minlength={10}
            autocomplete="new-password"
          />
        </div>
        <button type="submit" class="btn btn-primary">
          Update password
        </button>
      </form>
    </AdminShell>
  )
}
