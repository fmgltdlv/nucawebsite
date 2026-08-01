import type { User } from '../../config/roles'
import { AdminShell } from '../../views/AdminShell'
import { AdminCrudSections } from '../../views/admin/AdminCrudSections'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function userSearchText(u: User): string {
  return [u.email, u.display_name].filter(Boolean).join(' ').toLowerCase()
}

export function AdminUsersPage({
  ctx,
  users,
  message,
  ...site
}: PageProps & {
  ctx: AdminContext
  users: User[]
  message?: string
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
      <p class="section-lead">Admin accounts have full access to the staff portal.</p>

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
          </tr>
        }
        tableBody={users.map((u) => (
          <tr key={u.id} data-admin-list-row data-search={userSearchText(u)}>
            <td>{u.email}</td>
            <td>{u.display_name ?? '—'}</td>
          </tr>
        ))}
      />
    </AdminShell>
  )
}
