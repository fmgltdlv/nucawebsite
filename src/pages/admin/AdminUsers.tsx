import type { User } from '../../config/roles'
import { AdminShell } from '../../views/AdminShell'
import { AdminCrudSections } from '../../views/admin/AdminCrudSections'
import { AdminEditButton } from '../../views/admin/AdminListSection'
import { AdminModal, AdminModalCancelButton } from '../../views/admin/AdminModal'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function userSearchText(u: User): string {
  return [u.email, u.display_name].filter(Boolean).join(' ').toLowerCase()
}

function UserListRow({ user, currentUserId }: { user: User; currentUserId: string }) {
  const editModalId = `edit-user-${user.id}`
  const isSelf = user.id === currentUserId

  return (
    <tr data-admin-list-row data-search={userSearchText(user)}>
      <td>{user.email}</td>
      <td>{user.display_name ?? '—'}</td>
      <td class="admin-list-actions">
        <AdminEditButton modalId={editModalId} />
        {!isSelf && (
          <form
            method="post"
            action={`/admin/users/${user.id}/delete`}
            class="admin-inline-form"
            onsubmit="return confirm('Delete this admin user permanently?')"
          >
            <button type="submit" class="btn btn-secondary btn-sm">
              Delete
            </button>
          </form>
        )}
      </td>
    </tr>
  )
}

function UserEditModal({ user }: { user: User }) {
  const formId = `form-user-${user.id}`

  return (
    <AdminModal
      id={`edit-user-${user.id}`}
      title={`Reset password: ${user.email}`}
      formAction={`/admin/users/${user.id}/password`}
      formId={formId}
      footer={
        <>
          <AdminModalCancelButton />
          <button type="submit" class="btn btn-primary" form={formId}>
            Set password
          </button>
        </>
      }
    >
      <p class="admin-note">Sets a new password and signs the user out of other sessions.</p>
      <div class="form-field">
        <label for={`${formId}-password`}>New password</label>
        <input
          type="password"
          name="password"
          id={`${formId}-password`}
          required
          minlength={10}
          autocomplete="new-password"
        />
      </div>
    </AdminModal>
  )
}

export function AdminUsersPage({
  ctx,
  users,
  message,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  users: User[]
  message?: string
  error?: string
}) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Users"
      activePath="/admin/users"
    >
      {message && <p class="admin-flash">{message}</p>}
      {error && <p class="form-hint-warn">{error}</p>}
      <p class="section-lead">
        Admin accounts have full access to the staff portal. Change your own password on{' '}
        <a href="/admin/profile">Profile</a>.
      </p>

      <AdminCrudSections
        addButtonLabel="Add user"
        addModalId="add-user-dialog"
        addModalTitle="Add user"
        addFormAction="/admin/users"
        addSubmitLabel="Create user"
        addFormBody={
          <>
            <div class="form-row">
              <div class="form-field">
                <label for="email">Email</label>
                <input type="email" name="email" id="email" required />
              </div>
              <div class="form-field">
                <label for="password">Password</label>
                <input type="password" name="password" id="password" required minlength={10} />
              </div>
            </div>
            <div class="form-field">
              <label for="display_name">Display name</label>
              <input type="text" name="display_name" id="display_name" />
            </div>
          </>
        }
        listTitle="All users"
        listCount={users.length}
        emptyMessage="No users yet."
        hasItems={users.length > 0}
        tableHead={
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th></th>
          </tr>
        }
        tableBody={users.map((u) => (
          <UserListRow key={u.id} user={u} currentUserId={ctx.user.id} />
        ))}
        afterTable={users.map((u) => (
          <UserEditModal key={u.id} user={u} />
        ))}
      />
    </AdminShell>
  )
}
