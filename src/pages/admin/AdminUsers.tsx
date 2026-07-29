import { COMMITTEE_KEYS, COMMITTEE_LABELS, ROLE_LABELS, type User } from '../../config/roles'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminUsersPage({
  theme,
  ctx,
  users,
  message,
}: PageProps & { ctx: AdminContext; users: User[]; message?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Users & roles"
      activePath="/admin/users"
    >
      {message && <p class="admin-flash">{message}</p>}
      <p class="section-lead">
        <strong>Admin</strong> — full access. <strong>Chair</strong> — events + assigned committee pages.
        <strong>Member</strong> — edit linked directory listing only.
      </p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Member link</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td>{u.member_id ? <code>{u.member_id}</code> : '—'}</td>
                <td>{u.display_name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section class="admin-form-section">
        <h2>Add user</h2>
        <form class="form" method="post" action="/admin/users">
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
          <div class="form-row">
            <div class="form-field">
              <label for="role">Role</label>
              <select name="role" id="role" required>
                <option value="admin">Admin</option>
                <option value="chair">Chair</option>
                <option value="member">Member</option>
              </select>
            </div>
            <div class="form-field">
              <label for="member_id">Member ID (for Member role)</label>
              <input type="text" name="member_id" id="member_id" placeholder="UUID from member list" />
            </div>
          </div>
          <div class="form-field">
            <label for="display_name">Display name</label>
            <input type="text" name="display_name" id="display_name" />
          </div>
          <fieldset class="admin-fieldset">
            <legend>Chair committee assignments</legend>
            {COMMITTEE_KEYS.map((key) => (
              <label class="admin-check" key={key}>
                <input type="checkbox" name={`committee_${key}`} value="1" />
                {COMMITTEE_LABELS[key]}
              </label>
            ))}
          </fieldset>
          <button type="submit" class="btn btn-primary">Create user</button>
        </form>
      </section>
    </AdminShell>
  )
}
