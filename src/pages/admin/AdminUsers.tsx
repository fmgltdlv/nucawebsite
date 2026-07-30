import type { Member } from '../../data/demo'
import {
  COMMITTEE_KEYS,
  COMMITTEE_LABELS,
  ROLE_LABELS,
  type UserWithMemberInfo,
} from '../../config/roles'
import { AdminShell } from '../../views/AdminShell'
import { MemberLinkStatusDot } from '../../views/MemberLinkStatus'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminUsersPage({
  theme,
  ctx,
  users,
  members,
  message,
}: PageProps & {
  ctx: AdminContext
  users: UserWithMemberInfo[]
  members: Member[]
  message?: string
}) {
  const pending = users.filter((u) => u.member_link_status === 'pending')

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

      {pending.length > 0 && (
        <section class="admin-form-section admin-pending-queue">
          <h2>Pending company link requests</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Current company</th>
                  <th>Requested company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.display_name || u.email}
                      <br />
                      <span class="admin-table-sub">{u.email}</span>
                    </td>
                    <td>
                      {u.member_company ? (
                        <span class="member-link-inline">
                          <MemberLinkStatusDot status="approved" />
                          {u.member_company}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span class="member-link-inline">
                        <MemberLinkStatusDot status="pending" />
                        {u.pending_company ?? '—'}
                      </span>
                    </td>
                    <td class="admin-actions-cell">
                      <form method="post" action={`/admin/users/${u.id}/approve-link`} class="admin-inline-form">
                        <button type="submit" class="btn btn-primary btn-sm">Approve</button>
                      </form>
                      <form method="post" action={`/admin/users/${u.id}/reject-link`} class="admin-inline-form">
                        <button type="submit" class="btn btn-secondary btn-sm">Reject</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Member company</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td>
                  {u.member_company ? (
                    <span class="member-link-inline">
                      <MemberLinkStatusDot status="approved" />
                      {u.member_company}
                    </span>
                  ) : u.pending_company && u.member_link_status === 'pending' ? (
                    <span class="member-link-inline">
                      <MemberLinkStatusDot status="pending" />
                      {u.pending_company} (pending)
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
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
              <label for="member_id">Member company (for Member role)</label>
              <select name="member_id" id="member_id">
                <option value="">None — user will request later</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.company}
                  </option>
                ))}
              </select>
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
